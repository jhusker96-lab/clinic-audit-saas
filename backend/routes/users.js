const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const { sendEmail } = require('../utils/email');

router.use(authenticate);

/**
 * GET /api/users
 * Get all users in clinic (Admin only)
 */
router.get('/', requireAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, email, first_name, last_name, role, is_active, created_at, last_login_at
             FROM users
             WHERE clinic_id = $1
             ORDER BY created_at DESC`,
            [req.user.clinic_id]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

/**
 * POST /api/users/invite
 * Invite user to clinic (Admin only)
 */
router.post('/invite', requireAdmin, [
    body('email').isEmail().normalizeEmail(),
    body('role').isIn(['admin', 'member'])
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, role } = req.body;

    try {
        // Check if user already exists in this clinic
        const existingUser = await pool.query(
            'SELECT id FROM users WHERE email = $1 AND clinic_id = $2',
            [email, req.user.clinic_id]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'User already exists in this clinic' });
        }

        // Check for pending invitation
        const existingInvite = await pool.query(
            'SELECT id FROM invitations WHERE email = $1 AND clinic_id = $2 AND status = $3',
            [email, req.user.clinic_id, 'pending']
        );

        if (existingInvite.rows.length > 0) {
            return res.status(400).json({ error: 'Invitation already sent to this email' });
        }

        // Generate invitation token
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + parseInt(process.env.INVITATION_EXPIRY_HOURS || 72) * 60 * 60 * 1000);

        // Create invitation
        await pool.query(
            `INSERT INTO invitations (email, clinic_id, invited_by, role, token, expires_at)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [email, req.user.clinic_id, req.user.id, role, token, expiresAt]
        );

        // Send invitation email
        const inviteLink = `${process.env.FRONTEND_URL}/accept-invitation?token=${token}`;
        await sendEmail({
            to: email,
            subject: `Join ${req.user.clinic_name} on Clinic Audit`,
            html: `
                <h2>You've been invited!</h2>
                <p>${req.user.first_name} ${req.user.last_name} has invited you to join <strong>${req.user.clinic_name}</strong> on Clinic Audit.</p>
                <p>Click the link below to accept the invitation and create your account:</p>
                <p><a href="${inviteLink}">${inviteLink}</a></p>
                <p>This invitation expires in ${process.env.INVITATION_EXPIRY_HOURS || 72} hours.</p>
                <p>You'll be joining as a <strong>${role}</strong>.</p>
            `
        });

        res.json({ message: 'Invitation sent successfully' });
    } catch (error) {
        console.error('Invite user error:', error);
        res.status(500).json({ error: 'Failed to send invitation' });
    }
});

/**
 * GET /api/users/invitations
 * Get pending invitations (Admin only)
 */
router.get('/invitations', requireAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT i.id, i.email, i.role, i.status, i.created_at, i.expires_at,
                    u.first_name as invited_by_first_name, u.last_name as invited_by_last_name
             FROM invitations i
             JOIN users u ON i.invited_by = u.id
             WHERE i.clinic_id = $1
             ORDER BY i.created_at DESC`,
            [req.user.clinic_id]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Get invitations error:', error);
        res.status(500).json({ error: 'Failed to fetch invitations' });
    }
});

/**
 * DELETE /api/users/invitations/:id
 * Cancel invitation (Admin only)
 */
router.delete('/invitations/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            'DELETE FROM invitations WHERE id = $1 AND clinic_id = $2 RETURNING id',
            [id, req.user.clinic_id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Invitation not found' });
        }

        res.json({ message: 'Invitation cancelled' });
    } catch (error) {
        console.error('Cancel invitation error:', error);
        res.status(500).json({ error: 'Failed to cancel invitation' });
    }
});

/**
 * PUT /api/users/:id/deactivate
 * Deactivate user (Admin only)
 */
router.put('/:id/deactivate', requireAdmin, async (req, res) => {
    const { id } = req.params;

    // Prevent self-deactivation
    if (id === req.user.id) {
        return res.status(400).json({ error: 'Cannot deactivate your own account' });
    }

    try {
        const result = await pool.query(
            'UPDATE users SET is_active = false WHERE id = $1 AND clinic_id = $2 RETURNING id',
            [id, req.user.clinic_id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'User deactivated successfully' });
    } catch (error) {
        console.error('Deactivate user error:', error);
        res.status(500).json({ error: 'Failed to deactivate user' });
    }
});

/**
 * PUT /api/users/:id/activate
 * Activate user (Admin only)
 */
router.put('/:id/activate', requireAdmin, async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            'UPDATE users SET is_active = true WHERE id = $1 AND clinic_id = $2 RETURNING id',
            [id, req.user.clinic_id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'User activated successfully' });
    } catch (error) {
        console.error('Activate user error:', error);
        res.status(500).json({ error: 'Failed to activate user' });
    }
});

module.exports = router;
