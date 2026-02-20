const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/audits
 * Get all monthly audits for user's clinic
 */
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
                ma.*,
                json_agg(DISTINCT jsonb_build_object('id', p.id, 'name', p.name, 'amount', p.amount))
                    FILTER (WHERE p.id IS NOT NULL) as payroll,
                json_agg(DISTINCT jsonb_build_object('id', ae.id, 'name', ae.name, 'amount', ae.amount, 'notes', ae.notes))
                    FILTER (WHERE ae.id IS NOT NULL) as expenses,
                json_agg(DISTINCT jsonb_build_object('id', s.id, 'name', s.name, 'provider_hours', s.provider_hours,
                    'booked_hours', s.booked_hours, 'revenue', s.revenue, 'commission', s.commission,
                    'allocated_expenses', s.allocated_expenses))
                    FILTER (WHERE s.id IS NOT NULL) as services
             FROM monthly_audits ma
             LEFT JOIN payroll_items p ON ma.id = p.monthly_audit_id
             LEFT JOIN additional_expenses ae ON ma.id = ae.monthly_audit_id
             LEFT JOIN services s ON ma.id = s.monthly_audit_id
             WHERE ma.clinic_id = $1
             GROUP BY ma.id
             ORDER BY ma.audit_month DESC`,
            [req.user.clinic_id]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Get audits error:', error);
        res.status(500).json({ error: 'Failed to fetch audits' });
    }
});

/**
 * GET /api/audits/:month
 * Get specific monthly audit (YYYY-MM format)
 */
router.get('/:month', async (req, res) => {
    const { month } = req.params;

    try {
        const result = await pool.query(
            `SELECT
                ma.*,
                json_agg(DISTINCT jsonb_build_object('id', p.id, 'name', p.name, 'amount', p.amount))
                    FILTER (WHERE p.id IS NOT NULL) as payroll,
                json_agg(DISTINCT jsonb_build_object('id', ae.id, 'name', ae.name, 'amount', ae.amount, 'notes', ae.notes))
                    FILTER (WHERE ae.id IS NOT NULL) as expenses,
                json_agg(DISTINCT jsonb_build_object('id', s.id, 'name', s.name, 'provider_hours', s.provider_hours,
                    'booked_hours', s.booked_hours, 'revenue', s.revenue, 'commission', s.commission,
                    'allocated_expenses', s.allocated_expenses))
                    FILTER (WHERE s.id IS NOT NULL) as services
             FROM monthly_audits ma
             LEFT JOIN payroll_items p ON ma.id = p.monthly_audit_id
             LEFT JOIN additional_expenses ae ON ma.id = ae.monthly_audit_id
             LEFT JOIN services s ON ma.id = s.monthly_audit_id
             WHERE ma.clinic_id = $1 AND ma.audit_month = $2
             GROUP BY ma.id`,
            [req.user.clinic_id, `${month}-01`]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Audit not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Get audit error:', error);
        res.status(500).json({ error: 'Failed to fetch audit' });
    }
});

/**
 * POST /api/audits
 * Create or update monthly audit
 */
router.post('/', async (req, res) => {
    const {
        auditMonth,
        clinicName,
        revenue,
        operatingExpenses,
        cogs,
        websiteVisits,
        websiteConversionRate,
        newClientVisits,
        clientsConvertingToTreatment,
        totalClients,
        totalAppointments,
        marketingSpend,
        payroll,
        expenses,
        services
    } = req.body;

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Upsert monthly audit
        const auditResult = await client.query(
            `INSERT INTO monthly_audits (
                clinic_id, audit_month, clinic_name, revenue, operating_expenses, cogs,
                website_visits, website_conversion_rate, new_client_visits,
                clients_converting_to_treatment, total_clients, total_appointments,
                marketing_spend, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            ON CONFLICT (clinic_id, audit_month)
            DO UPDATE SET
                clinic_name = EXCLUDED.clinic_name,
                revenue = EXCLUDED.revenue,
                operating_expenses = EXCLUDED.operating_expenses,
                cogs = EXCLUDED.cogs,
                website_visits = EXCLUDED.website_visits,
                website_conversion_rate = EXCLUDED.website_conversion_rate,
                new_client_visits = EXCLUDED.new_client_visits,
                clients_converting_to_treatment = EXCLUDED.clients_converting_to_treatment,
                total_clients = EXCLUDED.total_clients,
                total_appointments = EXCLUDED.total_appointments,
                marketing_spend = EXCLUDED.marketing_spend,
                updated_at = NOW()
            RETURNING id`,
            [
                req.user.clinic_id,
                `${auditMonth}-01`,
                clinicName,
                revenue || 0,
                operatingExpenses || 0,
                cogs || 0,
                websiteVisits || 0,
                websiteConversionRate || 0,
                newClientVisits || 0,
                clientsConvertingToTreatment || 0,
                totalClients || 0,
                totalAppointments || 0,
                marketingSpend || 0,
                req.user.id
            ]
        );

        const auditId = auditResult.rows[0].id;

        // Delete existing related records
        await client.query('DELETE FROM payroll_items WHERE monthly_audit_id = $1', [auditId]);
        await client.query('DELETE FROM additional_expenses WHERE monthly_audit_id = $1', [auditId]);
        await client.query('DELETE FROM services WHERE monthly_audit_id = $1', [auditId]);

        // Insert payroll items
        if (payroll && payroll.length > 0) {
            for (const item of payroll) {
                await client.query(
                    'INSERT INTO payroll_items (monthly_audit_id, name, amount) VALUES ($1, $2, $3)',
                    [auditId, item.name, item.amount || 0]
                );
            }
        }

        // Insert expenses
        if (expenses && expenses.length > 0) {
            for (const item of expenses) {
                await client.query(
                    'INSERT INTO additional_expenses (monthly_audit_id, name, amount, notes) VALUES ($1, $2, $3, $4)',
                    [auditId, item.name, item.amount || 0, item.notes || null]
                );
            }
        }

        // Insert services
        if (services && services.length > 0) {
            for (const item of services) {
                await client.query(
                    `INSERT INTO services (monthly_audit_id, name, provider_hours, booked_hours, revenue, commission, allocated_expenses)
                     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                    [
                        auditId,
                        item.name,
                        item.providerHours || 0,
                        item.bookedHours || 0,
                        item.revenue || 0,
                        item.commission || 0,
                        item.allocatedExpenses || 0
                    ]
                );
            }
        }

        await client.query('COMMIT');

        res.json({ message: 'Audit saved successfully', auditId });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Save audit error:', error);
        res.status(500).json({ error: 'Failed to save audit' });
    } finally {
        client.release();
    }
});

/**
 * DELETE /api/audits/:month
 * Delete monthly audit
 */
router.delete('/:month', async (req, res) => {
    const { month } = req.params;

    try {
        const result = await pool.query(
            'DELETE FROM monthly_audits WHERE clinic_id = $1 AND audit_month = $2 RETURNING id',
            [req.user.clinic_id, `${month}-01`]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Audit not found' });
        }

        res.json({ message: 'Audit deleted successfully' });
    } catch (error) {
        console.error('Delete audit error:', error);
        res.status(500).json({ error: 'Failed to delete audit' });
    }
});

module.exports = router;
