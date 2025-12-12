import { Request, Response } from 'express';

import { PrismaClient, Role } from '@prisma/client';

import { hashPassword, verifyPassword, generateToken } from '../utils/auth';

import {

  isValidEcuadorianCedula,

  passwordsMatch,

  normalizeEmail,

  isValidPin

} from '../utils/validators';

import { generateRawToken, hashToken, compareToken } from '../utils/reset';

import { sendPasswordResetEmail } from '../utils/email';



//tiempo expiración token en minutos

const RESET_TTL_MINUTES = 30;

// Instancia de Prisma Client

const prisma = new PrismaClient();



export const login = async (req: Request, res: Response) => {

  try {

    let { email, password } = req.body;



    email = normalizeEmail(email);

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



    const isValidPassword = await verifyPassword(

      password,

      user.password_hash

    );

   

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



    // CORRECCIÓN: Preparar el payload del token incluyendo external_id si es docente
    const tokenPayload: any = {
      userId: user.id,
      email: user.email,
      role: user.role
    };

    if (user.role === Role.DOCENTE) {
      tokenPayload.external_id = user.external_id;
    }

    // Generate JWT token con el payload completo
    const token = generateToken(tokenPayload);

    // Prepare user response object
    const userResponse: any = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    // If role is DOCENTE, include external_id
    if (user.role === Role.DOCENTE) {
      userResponse.external_id = user.external_id;
    }

    // Return user info and token
    res.json({
      user: userResponse,
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

    let {

      full_name,

      email,

      cedula,

      home_address,

      work_place,

      security_pin,

      password,

      confirm_password

    } = req.body;



    // Normaliza email

    email = normalizeEmail(email);



    // ✅ Validaciones de campos requeridos

    if (!full_name || !email || !cedula || !security_pin || !password || !confirm_password) {

      console.log('error de validacion de campos');

      return res.status(400).json({

        message: 'Nombre, correo, cédula, PIN, contraseña y confirmación son requeridos'

      });

    }



    // ✅ Validación de cédula ecuatoriana

    if (!isValidEcuadorianCedula(cedula)) {

      return res.status(400).json({ message: 'Cédula ecuatoriana inválida' });

    }



    // ✅ Passwords iguales

    if (!passwordsMatch(password, confirm_password)) {

      return res.status(400).json({ message: 'Las contraseñas no coinciden' });

    }



    // ✅ PIN numérico 4–6 dígitos

    if (!isValidPin(security_pin)) {

      return res.status(400).json({ message: 'PIN inválido (debe ser numérico de 4 a 6 dígitos)' });

    }



    // ✅ Unicidad: email y cédula

    const [existingUser, existingParent] = await Promise.all([

      prisma.user.findUnique({ where: { email } }),

      prisma.parent.findUnique({ where: { cedula } }),

    ]);



    if (existingUser) {

      return res.status(400).json({ message: 'Ya existe un usuario con este correo electrónico' });

    }

    if (existingParent) {

      return res.status(400).json({ message: 'Ya existe un registro con esta cédula' });

    }



    // Hashes

    const [password_hash, pin_hash] = await Promise.all([

      hashPassword(password),

      hashPassword(security_pin),

    ]);



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

          role: Role.FAMILIA,

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



export const forgotPassword = async (req: Request, res: Response) => {

  try {

    let { email } = req.body as { email?: string };

    if (!email) return res.status(400).json({ message: 'Email requerido' });

    email = normalizeEmail(email);



    const user = await prisma.user.findUnique({ where: { email } });

    // Para no filtrar si existe o no el correo, siempre respondemos 200.

    if (user) {

      const raw = generateRawToken();

      const tokenHash = await hashToken(raw);

      const expiresAt = new Date(Date.now() + RESET_TTL_MINUTES * 60 * 1000);



      // Invalida tokens anteriores pendientes

      await prisma.passwordReset.updateMany({

        where: { userId: user.id, used: false, expiresAt: { gt: new Date() } },

        data: { used: true },

      });



      await prisma.passwordReset.create({

        data: { userId: user.id, tokenHash, expiresAt, used: false }

      });



      const resetUrl = `${process.env.FRONTEND_URL ?? 'http://localhost:5173'}/reset-password?token=${raw}&email=${encodeURIComponent(email)}`;

      await sendPasswordResetEmail(email, resetUrl, RESET_TTL_MINUTES);



      // En dev, puedes devolver el token para probar rápido

      if (process.env.NODE_ENV !== 'production') {

        return res.status(200).json({ message: 'Enviado', dev_token: raw });

      }

    }

    return res.status(200).json({ message: 'Si el correo existe, recibirás instrucciones' });

  } catch (e) {

    console.error('forgotPassword error', e);

    return res.status(500).json({ message: 'Error solicitando recuperación' });

  }

};



/**

 * Resetea contraseña usando token de un solo uso

 */

export const resetPassword = async (req: Request, res: Response) => {

  try {

    const { email, token, password, confirm_password } = req.body as {

      email?: string; token?: string; password?: string; confirm_password?: string;

    };



    if (!email || !token || !password || !confirm_password) {

      return res.status(400).json({ message: 'Campos requeridos: email, token, password y confirm_password' });

    }

    if (password !== confirm_password) {

      return res.status(400).json({ message: 'Las contraseñas no coinciden' });

    }



    const normalizedEmail = normalizeEmail(email);

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (!user) return res.status(400).json({ message: 'Token inválido' });



    // Busca token válido y no usado

    const pr = await prisma.passwordReset.findFirst({

      where: { userId: user.id, used: false, expiresAt: { gt: new Date() } },

      orderBy: { expiresAt: 'desc' }

    });

    if (!pr) return res.status(400).json({ message: 'Token inválido o expirado' });



    const ok = await compareToken(token, pr.tokenHash);

    if (!ok) return res.status(400).json({ message: 'Token inválido' });



    const password_hash = await hashPassword(password);



    await prisma.$transaction([

      prisma.user.update({ where: { id: user.id }, data: { password_hash } }),

      prisma.passwordReset.update({ where: { id: pr.id }, data: { used: true } })

    ]);



    return res.status(200).json({ message: 'Contraseña actualizada con éxito' });

  } catch (e) {

    console.error('resetPassword error', e);

    return res.status(500).json({ message: 'Error al resetear la contraseña' });

  }

};

export const registerDeviceToken = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { token, platform } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!token || !platform) {
      return res.status(400).json({ message: 'Token and platform are required' });
    }

    await prisma.deviceToken.upsert({
      where: { fcm_token: token },
      update: {
        user_id: userId,
        platform,
        updatedAt: new Date()
      },
      create: {
        user_id: userId,
        fcm_token: token,
        platform
      }
    });

    return res.status(200).json({ message: 'Device token registered' });
  } catch (error) {
    console.error('Error registering device token:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};