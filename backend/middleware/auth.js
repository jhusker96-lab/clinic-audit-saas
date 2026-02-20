const jwt = require('jsonwebtoken');
const pool = require('../config/database');

/**
 * Middleware to verify JWT token and attach user to request
 */
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.substring(7);

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        // Fetch user from database
        const result = await pool.query(
            `SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.clinic_id, u.is_active,
                    c.name as clinic_name
             FROM users u
             JOIN clinics c ON u.clinic_id = c.id
             WHERE u.id = $1`,
            [decoded.userId]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'User not found' });
        }

        const user = result.rows[0];

        if (!user.is_active) {
            return res.status(403).json({ error: 'Account is inactive' });
        }

        // Attach user to request
        req.user = user;
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(500).json({ error: 'Authentication failed' });
    }
};

/**
 * Middleware to check if user is admin
 */
const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

/**
 * Middleware to ensure data belongs to user's clinic
 */
const ensureClinicAccess = (clinicIdParam = 'clinicId') => {
    return (req, res, next) => {
        const requestedClinicId = req.params[clinicIdParam] || req.body[clinicIdParam];

        if (requestedClinicId && requestedClinicId !== req.user.clinic_id) {
            return res.status(403).json({ error: 'Access denied to this clinic data' });
        }

        next();
    };
};

module.exports = {
    authenticate,
    requireAdmin,
    ensureClinicAccess
};
