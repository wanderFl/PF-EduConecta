"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.authenticate = void 0;
const auth_1 = require("../utils/auth");
const authenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Authentication token required' });
        }
        const token = authHeader.split(' ')[1];
        const decoded = (0, auth_1.verifyToken)(token);
        req.user = decoded;
        next();
    }
    catch (error) {
        return res.status(401).json({ message: 'Invalid authentication token' });
    }
};
exports.authenticate = authenticate;
const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            console.log('❌ Authorization failed: No user in request');
            return res.status(401).json({ message: 'Authentication required' });
        }
        console.log(`🔒 Checking authorization: User role="${req.user.role}" vs Allowed roles=[${allowedRoles.join(', ')}]`);
        if (!allowedRoles.includes(req.user.role)) {
            console.log(`❌ Authorization failed: Role "${req.user.role}" not in allowed roles [${allowedRoles.join(', ')}]`);
            return res.status(403).json({
                message: 'Access forbidden - Insufficient permissions',
                details: `Your role: ${req.user.role}, Required role(s): ${allowedRoles.join(' or ')}`
            });
        }
        console.log(`✅ Authorization successful for role: ${req.user.role}`);
        next();
    };
};
exports.authorize = authorize;
