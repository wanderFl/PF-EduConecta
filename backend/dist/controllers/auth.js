"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = exports.login = void 0;
const prisma_1 = require("../../generated/prisma");
const auth_1 = require("../utils/auth");
const prisma = new prisma_1.PrismaClient();
const login = async (req, res) => {
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
        const isValidPassword = await (0, auth_1.verifyPassword)(password, user.password_hash);
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
        const token = (0, auth_1.generateToken)({
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
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            message: 'An error occurred during login'
        });
    }
};
exports.login = login;
//Verificar el cambio para registrar usuario
const register = async (req, res) => {
    try {
        const { email, password, role } = req.body;
        // Validate input
        if (!email || !password || !role) {
            return res.status(400).json({
                message: 'Email, password and role are required'
            });
        }
        // Validate role
        if (!Object.values(prisma_1.Role).includes(role)) {
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
        const password_hash = await (0, auth_1.hashPassword)(password);
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
        const verificationToken = (0, auth_1.generateToken)({
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
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            message: 'An error occurred during registration'
        });
    }
};
exports.register = register;
