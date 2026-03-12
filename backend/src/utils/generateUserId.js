const Counter = require('../models/Counter');
const { sequelize } = require('../config/db');

const ROLE_PREFIX = {
    STUDENT: 'STU',
    INSTRUCTOR: 'INS',
    ADMIN: 'ADM'
};

/**
 * Generates a unique user ID like STU-2026-00001
 * Format: {ROLE_PREFIX}-{YEAR}-{ZERO_PADDED_SEQ}
 */
const generateUserId = async (role = 'STUDENT') => {
    const prefix = ROLE_PREFIX[role] || 'STU';
    const year = new Date().getFullYear();
    const counterName = `${prefix}-${year}`;

    // Atomic upsert + increment using raw SQL for safety
    const [results] = await sequelize.query(`
        INSERT INTO counters (name, seq)
        VALUES (:name, 1)
        ON CONFLICT (name)
        DO UPDATE SET seq = counters.seq + 1
        RETURNING seq
    `, {
        replacements: { name: counterName }
    });

    const seq = results[0].seq;
    const paddedSeq = String(seq).padStart(5, '0');
    return `${prefix}-${year}-${paddedSeq}`;
};

module.exports = generateUserId;
