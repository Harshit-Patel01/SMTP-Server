import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'mailflow',
    user: process.env.DB_USER || 'mailflow',
    password: process.env.DB_PASSWORD || 'mailflow',
});

// Helpers that match the shape the API expects (data/error or count/error)

function normalizeEmail(e) {
    return String(e || '').trim().toLowerCase();
}

export async function getInbox(email) {
    const norm = normalizeEmail(email);
    const res = await pool.query(
        `SELECT id, sender, header, created_at, is_read
         FROM mails
         WHERE LOWER(TRIM(receiver)) = $1
         ORDER BY created_at DESC`,
        [norm]
    );
    return { data: res.rows, error: null };
}

export async function getMailById(id) {
    const res = await pool.query('SELECT * FROM mails WHERE id = $1', [id]);
    const row = res.rows[0];
    if (!row) return { data: null, error: { message: 'Not found' } };
    return { data: row, error: null };
}

export async function markMailRead(id) {
    await pool.query('UPDATE mails SET is_read = true WHERE id = $1', [id]);
    return { error: null };
}

export async function deleteMailById(id) {
    const res = await pool.query('DELETE FROM mails WHERE id = $1', [id]);
    return { error: null };
}

export async function deleteInbox(email) {
    const norm = normalizeEmail(email);
    await pool.query('DELETE FROM mails WHERE LOWER(TRIM(receiver)) = $1', [norm]);
    return { error: null };
}

export async function markInboxRead(email) {
    const norm = normalizeEmail(email);
    await pool.query('UPDATE mails SET is_read = true WHERE LOWER(TRIM(receiver)) = $1', [norm]);
    return { error: null };
}

export async function getMailCount(email) {
    const norm = normalizeEmail(email);
    const res = await pool.query(
        'SELECT COUNT(*)::int AS count FROM mails WHERE LOWER(TRIM(receiver)) = $1',
        [norm]
    );
    return { count: res.rows[0].count, error: null };
}

export async function insertMail({ sender, receiver, header, body }) {
    const res = await pool.query(
        `INSERT INTO mails (sender, receiver, header, body)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [sender, receiver, header || 'No Subject', body || 'No Body']
    );
    return { error: null, data: res.rows[0] };
}

export { pool };
