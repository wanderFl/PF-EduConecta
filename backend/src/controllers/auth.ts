import { Request, Response } from 'express';
import { Role, PrismaClient } from '@prisma/client';
import { hashPassword, verifyPassword, generateToken } from '../utils/auth';
import { generateRawToken, hashToken, compareToken } from '../utils/reset';
import { sendPasswordResetEmail } from '../utils/email';

const prisma = new PrismaClient();

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        message: 'Email and password are required' 
      });
    }

    // Find user by email
    const user = await prisma.user.findUnique({ 
      where: { email } 
    });
    if (!user) {
      return res.status(401).json({ 
        message: 'Invalid credentials' 
      });
    }

    // Verify password
    console.log('Attempting password verification for user:', {
      email: user.email,
      providedPassword: password,
      storedHash: user.password_hash
    });

    const isValidPassword = await verifyPassword(
      password, 
      user.password_hash
    );
    
    console.log('Password verification result:', isValidPassword);

    if (!isValidPassword) {
      return res.status(401).json({ 
        message: 'Invalid credentials' 
      });
    }

    if (!user.is_verified) {
      return res.status(403).json({
        message: 'Please verify your email before logging in'
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        message: 'Your account has been deactivated'
      });
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      external_id: user.external_id
    });

    // Return user info and token
    res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        external_id: user.external_id
      },
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      message: 'An error occurred during login' 
    });
  }
};


//Verificar el cambio para registrar usuario
export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, role } = req.body;

    // Validate input
    if (!email || !password || !role) {
      return res.status(400).json({
        message: 'Email, password and role are required'
      });
    }

    // Validate role
    if (!Object.values(Role).includes(role)) {
      return res.status(400).json({
        message: 'Invalid role specified'
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const password_hash = await hashPassword(password);

    // Handle parent registration specifically
    if (role === 'FAMILIA') {
      const { 
        full_name, 
        cedula, 
        home_address, 
        work_place, 
        security_pin 
      } = req.body;

      // Validate parent-specific fields
      if (!full_name || !security_pin) {
        return res.status(400).json({
          message: 'Full name and security PIN are required for family registration'
        });
      }

      // Hash security PIN
      const security_pin_hash = await hashPassword(security_pin);

      // Check if cedula already exists (if provided)
      if (cedula) {
        const existingParent = await prisma.parent.findUnique({
          where: { cedula }
        });

        if (existingParent) {
          return res.status(400).json({
            message: 'A parent with this cedula already exists'
          });
        }
      }

      // Create parent record first
      const parent = await prisma.parent.create({
        data: {
          full_name,
          cedula: cedula || null,
          home_address: home_address || null,
          work_place: work_place || null,
          security_pin_hash
        }
      });

      // Create user record linked to parent
      const user = await prisma.user.create({
        data: {
          email,
          password_hash,
          role,
          parent_id: parent.id,
          is_verified: false
        }
      });

      res.status(201).json({
        message: 'Parent registered successfully. Please check your email for verification.',
        userId: user.id
      });

    } else {
      // Handle other role registrations (DIRECTIVO, DOCENTE)
      let external_id: string | null = null;

      // Para DOCENTE, intentar buscar el external_id en MySQL
      if (role === 'DOCENTE') {
        try {
          const { ceiafPool } = await import('../ext/ceiafDb');
          const [rows] = await ceiafPool.query(
            'SELECT id_docente FROM docentes WHERE email = ? LIMIT 1',
            [email]
          ) as any;

          if (rows && rows.length > 0) {
            external_id = rows[0].id_docente.toString();
            console.log(`✅ Docente found in MySQL with ID: ${external_id}`);
          } else {
            console.warn(`⚠️ No docente found in MySQL with email: ${email}`);
          }
        } catch (err) {
          console.error('Error searching for teacher in MySQL:', err);
          // No lanzar error, continuar sin external_id
        }
      }

      const user = await prisma.user.create({
        data: {
          email,
          password_hash,
          role,
          external_id: external_id,
          is_verified: false
        }
      });

      res.status(201).json({
        message: 'User registered successfully. Please check your email for verification.',
        userId: user.id,
        external_id: external_id ? 'linked' : 'not_linked'
      });
    }

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      message: 'An error occurred during registration'
    });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: 'Email is required'
      });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    // Always respond with success to prevent email enumeration
    if (!user) {
      return res.json({
        message: 'If the email exists, a password reset link has been sent.'
      });
    }

    // Delete any existing reset tokens for this user
    await prisma.passwordReset.deleteMany({
      where: { userId: user.id }
    });

    // Generate new reset token
    const rawToken = generateRawToken();
    const hashedToken = await hashToken(rawToken);

    // Store hashed token in database
    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        tokenHash: hashedToken,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
      }
    });

    // Send email with raw token
    await sendPasswordResetEmail(user.email, rawToken);

    res.json({
      message: 'If the email exists, a password reset link has been sent.'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      message: 'An error occurred while processing your request'
    });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        message: 'Token and password are required'
      });
    }

    // Find all reset records (not expired)
    const resetRecords = await prisma.passwordReset.findMany({
      where: {
        expiresAt: {
          gt: new Date()
        }
      },
      include: {
        user: true
      }
    });

    // Find matching token
    let validRecord = null;
    for (const record of resetRecords) {
      const isValid = await compareToken(token, record.tokenHash);
      if (isValid) {
        validRecord = record;
        break;
      }
    }

    if (!validRecord) {
      return res.status(400).json({
        message: 'Invalid or expired reset token'
      });
    }

    // Hash new password
    const newPasswordHash = await hashPassword(password);

    // Update user password
    await prisma.user.update({
      where: { id: validRecord.userId },
      data: { password_hash: newPasswordHash }
    });

    // Delete the used reset token
    await prisma.passwordReset.delete({
      where: { id: validRecord.id }
    });

    res.json({
      message: 'Password has been reset successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      message: 'An error occurred while resetting your password'
    });
  }
};