"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.generateToken = exports.verifyPassword = exports.hashPassword = void 0;
const bcryptjs_1 = require("bcryptjs");
const jsonwebtoken_1 = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key';
const SALT_ROUNDS = 10;
const hashPassword = async (password) => {
    try {
        const hashedPassword = await (0, bcryptjs_1.hash)(password, SALT_ROUNDS);
        return hashedPassword;
    }
    catch (error) {
        console.error('Error hashing password:', error);
        throw error;
    }
};
exports.hashPassword = hashPassword;
const verifyPassword = async (password, hashedPassword) => {
    try {
        const isValid = await (0, bcryptjs_1.compare)(password, hashedPassword);
        return isValid;
    }
    catch (error) {
        console.error('Error verifying password:', error);
        throw error;
    }
};
exports.verifyPassword = verifyPassword;
const generateToken = (payload) => {
    return (0, jsonwebtoken_1.sign)(payload, JWT_SECRET, { expiresIn: '24h' });
};
exports.generateToken = generateToken;
const verifyToken = (token) => {
    try {
        return (0, jsonwebtoken_1.verify)(token, JWT_SECRET);
    }
    catch (error) {
        throw new Error('Invalid token');
    }
};
exports.verifyToken = verifyToken;
