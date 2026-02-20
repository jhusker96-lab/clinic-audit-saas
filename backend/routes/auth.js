const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const { sendEmail } = require('../utils/email');

/**
 * POST /api/auth/signup
 * Create new clinic + admin user
 */
router.post('/signup', [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('firstName').trim().notEmpty(),
    body('lastName').trim().notEmpty(),
    body('clinicName').trim().notEmpty(),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, firstName, lastName, clinicName, clinicLocation } = req.body;

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Check if email already exists
        const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create clinic
        const clinicResult = await client.query(
            'INSERT INTO clinics (name, location) VALUES ($1, $2) RETURNING id',
            [clinicName, clinicLocation || null]
        );
        const clinicId = clinicResult.rows[0].id;

        // Create admin user
        const userResult = await client.query(
            `INSERT INTO users (email, password_hash, first_name, last_name, role, clinic_id)
             VALUES ($1, $2, $3, $4, 'admin', $5)
             RETURNING id, email, first_name, last_name, role, clinic_id`,
            [email, passwordHash, firstName, lastName, clinicId]
        );
        const user = userResult.rows[0];

        // Create default global goals
        await client.query(
            'INSERT INTO global_goals (clinic_id) VALUES ($1)',
            [clinicId]
        );

        await client.query('COMMIT');

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, clinicId: user.clinic_id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.SESSION_TIMEOUT || '24h' }
        );

        res.status(201).json({
            message: 'Account created successfully',
            token,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                role: user.role,
                clinicId: user.clinic_id,
                clinicName
            }
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Failed to create account' });
    } finally {
        client.release();
    }
});

/**
 * POST /api/auth/login
 * User login
 */
router.post('/login', [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
        const result = await pool.query(
            `SELECT u.id, u.email, u.password_hash, u.first_name, u.last_name, u.role,
                    u.clinic_id, u.is_active, c.name as clinic_name
             FROM users u
             JOIN clinics c ON u.clinic_id = c.id
             WHERE u.email = $1`,
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = result.rows[0];

        if (!user.is_active) {
            return res.status(403).json({ error: 'Account is inactive' });
        }

        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Update last login
        await pool.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, clinicId: user.clinic_id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.SESSION_TIMEOUT || '24h' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                role: user.role,
                clinicId: user.clinic_id,
                clinicName: user.clinic_name
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

/**
 * POST /api/auth/forgot-password
 * Request password reset email
 */
router.post('/forgot-password', [
    body('email').isEmail().normalizeEmail()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    try {
        const result = await pool.query('SELECT id, first_name FROM users WHERE email = $1', [email]);

        // Always return success to prevent email enumeration
        if (result.rows.length === 0) {
            return res.json({ message: 'If that email exists, a password reset link has been sent' });
        }

        const user = result.rows[0];

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + parseInt(process.env.PASSWORD_RESET_EXPIRY_HOURS || 1) * 60 * 60 * 1000);

        await pool.query(
            'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
            [user.id, resetToken, expiresAt]
        );

        // Send reset email
        const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
        await sendEmail({
            to: email,
            subject: 'Reset Your Password',
            html: `
                <h2>Password Reset Request</h2>
                <p>Hi ${user.first_name},</p>
                <p>You requested to reset your password. Click the link below to create a new password:</p>
                <p><a href="${resetLink}">${resetLink}</a></p>
                <p>This link expires in ${process.env.PASSWORD_RESET_EXPIRY_HOURS || 1} hour(s).</p>
                <p>If you didn't request this, please ignore this email.</p>
            `
        });

        res.json({ message: 'If that email exists, a password reset link has been sent' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Failed to process request' });
    }
});

/**
 * POST /api/auth/reset-password
 * Reset password with token
 */
router.post('/reset-password', [
    body('token').notEmpty(),
    body('newPassword').isLength({ min: 8 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { token, newPassword } = req.body;

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const result = await client.query(
            `SELECT user_id FROM password_reset_tokens
             WHERE token = $1 AND expires_at > NOW() AND used = false`,
            [token]
        );

        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Invalid or expired reset token' });
        }

        const userId = result.rows[0].user_id;

        // Hash new password
        const passwordHash = await bcrypt.hash(newPassword, 10);

        // Update password
        await client.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, userId]);

        // Mark token as used
        await client.query('UPDATE password_reset_tokens SET used = true WHERE token = $1', [token]);

        await client.query('COMMIT');

        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Failed to reset password' });
    } finally {
        client.release();
    }
});

/**
 * POST /api/auth/accept-invitation
 * Accept invitation and create account
 */
router.post('/accept-invitation', [
    body('token').notEmpty(),
    body('password').isLength({ min: 8 }),
    body('firstName').trim().notEmpty(),
    body('lastName').trim().notEmpty()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { token, password, firstName, lastName } = req.body;

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const inviteResult = await client.query(
            `SELECT id, email, clinic_id, role FROM invitations
             WHERE token = $1 AND status = 'pending' AND expires_at > NOW()`,
            [token]
        );

        if (inviteResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Invalid or expired invitation' });
        }

        const invitation = inviteResult.rows[0];

        // Check if email already has an account
        const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [invitation.email]);
        if (existingUser.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create user
        const userResult = await client.query(
            `INSERT INTO users (email, password_hash, first_name, last_name, role, clinic_id)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id, email, first_name, last_name, role, clinic_id`,
            [invitation.email, passwordHash, firstName, lastName, invitation.role, invitation.clinic_id]
        );
        const user = userResult.rows[0];

        // Mark invitation as accepted
        await client.query(
            'UPDATE invitations SET status = $1, accepted_at = NOW() WHERE id = $2',
            ['accepted', invitation.id]
        );

        await client.query('COMMIT');

        // Get clinic name
        const clinicResult = await client.query('SELECT name FROM clinics WHERE id = $1', [user.clinic_id]);
        const clinicName = clinicResult.rows[0].name;

        // Generate JWT token
        const jwtToken = jwt.sign(
            { userId: user.id, clinicId: user.clinic_id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.SESSION_TIMEOUT || '24h' }
        );

        res.status(201).json({
            message: 'Account created successfully',
            token: jwtToken,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                role: user.role,
                clinicId: user.clinic_id,
                clinicName
            }
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Accept invitation error:', error);
        res.status(500).json({ error: 'Failed to accept invitation' });
    } finally {
        client.release();
    }
});

module.exports = router;
