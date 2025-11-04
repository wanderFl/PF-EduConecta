"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRawToken = generateRawToken;
exports.hashToken = hashToken;
exports.compareToken = compareToken;
const crypto_1 = __importDefault(require("crypto"));
const auth_1 = require("./auth");
function generateRawToken() {
    // 32 bytes = 43 chars base64url aprox
    return crypto_1.default.randomBytes(32).toString('base64url');
}
async function hashToken(token) {
    // reutilizamos bcrypt de hashPassword
    return (0, auth_1.hashPassword)(token);
}
async function compareToken(raw, hashed) {
    return (0, auth_1.verifyPassword)(raw, hashed);
}
