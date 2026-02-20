const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.use(authenticate);

/**
 * GET /api/goals
 * Get global goals for clinic
 */
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM global_goals WHERE clinic_id = $1',
            [req.user.clinic_id]
        );

        if (result.rows.length === 0) {
            // Create default goals if none exist
            const createResult = await pool.query(
                'INSERT INTO global_goals (clinic_id) VALUES ($1) RETURNING *',
                [req.user.clinic_id]
            );
            return res.json(createResult.rows[0]);
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Get goals error:', error);
        res.status(500).json({ error: 'Failed to fetch goals' });
    }
});

/**
 * PUT /api/goals
 * Update global goals (Admin only)
 */
router.put('/', requireAdmin, async (req, res) => {
    const { revenueGoal, profitMarginGoal, capacityGoal } = req.body;

    try {
        const result = await pool.query(
            `UPDATE global_goals
             SET revenue_goal = $1, profit_margin_goal = $2, capacity_goal = $3, updated_at = NOW()
             WHERE clinic_id = $4
             RETURNING *`,
            [revenueGoal, profitMarginGoal, capacityGoal, req.user.clinic_id]
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Update goals error:', error);
        res.status(500).json({ error: 'Failed to update goals' });
    }
});

module.exports = router;
