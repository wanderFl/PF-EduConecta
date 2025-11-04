"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ceiafPool = void 0;
const promise_1 = __importDefault(require("mysql2/promise"));
require("dotenv/config");
const { DATABASE_CEIAF_URL } = process.env;
if (!DATABASE_CEIAF_URL) {
    throw new Error('DATABASE_CEIAF_URL no está definida en .env');
}
/**
 * Crea un pool de conexiones a MySQL (Railway).
 * Si Railway exige SSL, descomenta la sección ssl.
 */
exports.ceiafPool = promise_1.default.createPool({
    uri: DATABASE_CEIAF_URL,
    // ssl: { rejectUnauthorized: true }, // <- habilítalo si te da error de SSL
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
});
