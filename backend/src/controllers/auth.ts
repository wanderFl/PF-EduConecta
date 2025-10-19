import { Request, Response } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import { hashPassword, verifyPassword, generateToken } from '../utils/auth';

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
      role: user.role
    });

    // Return user info and token
    res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role
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

    // Create new user
    const user = await prisma.user.create({
      data: {
        email,
        password_hash,
        role,
        is_verified: false // Requires email verification
      }
    });

    // Generate verification token (you would implement email sending here)
    const verificationToken = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    // In a real application, you would send an email here
    // await sendVerificationEmail(user.email, verificationToken);

    res.status(201).json({
      message: 'User registered successfully. Please check your email for verification.',
      userId: user.id
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      message: 'An error occurred during registration'
    });
  }
};

export const registerParent = async (req: Request, res: Response) => {
  try {
    const { 
      full_name, 
      email, 
      cedula, 
      home_address, 
      work_place, 
      security_pin, 
      password 
    } = req.body;

    // Validate required fields
    if (!full_name || !email || !cedula || !security_pin || !password) {
      return res.status(400).json({
        message: 'Nombre completo, correo electrónico, cédula, PIN de seguridad y contraseña son requeridos'
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        message: 'Ya existe un usuario con este correo electrónico'
      });
    }

    // Check if parent with cedula already exists
    const existingParent = await prisma.parent.findUnique({
      where: { cedula }
    });

    if (existingParent) {
      return res.status(400).json({
        message: 'Ya existe un registro con esta cédula'
      });
    }

    // Hash password and pin
    const password_hash = await hashPassword(password);
    const pin_hash = await hashPassword(security_pin);

    // Create user and parent in a transaction
    const result = await prisma.$transaction(async (prisma) => {
      // Create parent first
      const parent = await prisma.parent.create({
        data: {
          full_name,
          cedula,
          home_address,
          work_place,
          security_pin_hash: pin_hash
        }
      });

      // Then create user with parent reference
      const user = await prisma.user.create({
        data: {
          email,
          password_hash,
          role: 'FAMILIA',
          is_verified: true, // Since we have cedula verification
          is_active: true,
          parent_id: parent.id
        }
      });

      return { user, parent };
    });

    // Generate JWT token
    const token = generateToken({
      userId: result.user.id,
      email: result.user.email,
      role: result.user.role
    });

    // Return user info and token
    res.status(201).json({
      user: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role
      },
      token
    });

  } catch (error) {
    console.error('Parent registration error:', error);
    
    // Provide more detailed error message for debugging
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Unknown error occurred';
      
    res.status(500).json({
      message: 'Ocurrió un error durante el registro',
      error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
};