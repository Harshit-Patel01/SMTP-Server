import { SMTPServer } from "smtp-server";
import { simpleParser } from "mailparser";
import * as db from './db.js';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EMAIL_DOMAIN = process.env.EMAIL_DOMAIN || 'mail.hael.in';
const API_PORT = process.env.API_PORT || 3004;
const SMTP_PORT = Number(process.env.SMTP_PORT) || 2525;

const app = express();
app.set('view engine', 'ejs');
app.use(express.json());

// CORS for frontend (Vite dev or separate origin)
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

// ============================================
// API ENDPOINTS FOR TEMPORARY EMAIL SERVICE
// ============================================

// Get public config (domain for frontend)
app.get('/api/config', (req, res) => {
    res.json({ domain: EMAIL_DOMAIN });
});

// Generate a random email address
app.get('/api/email/random', (req, res) => {
    const adjectives = ['swift', 'bright', 'cool', 'fast', 'happy', 'lucky', 'smart', 'bold', 'calm', 'wild', 'quick', 'clear', 'safe', 'bold'];
    const nouns = ['fox', 'hawk', 'wolf', 'bear', 'tiger', 'eagle', 'lion', 'shark', 'panther', 'falcon', 'flow', 'inbox', 'relay'];
    const randomNum = Math.floor(Math.random() * 9999);
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const username = `${adjective}${noun}${randomNum}`;
    const email = `${username}@${EMAIL_DOMAIN}`;

    res.json({ email, username });
});

// Get inbox for a specific email address (exact match on receiver)
app.get('/api/inbox/:email', async (req, res) => {
    const email = decodeURIComponent(req.params.email);
    const { data, error } = await db.getInbox(email);
    if (error) {
        res.status(500).json({ error: error.message });
    } else {
        res.json({ emails: data || [] });
    }
});

// Get a specific email by ID
app.get('/api/mail/:id', async (req, res) => {
    const id = req.params.id;
    const { data, error } = await db.getMailById(id);
    if (error) {
        res.status(404).json({ error: 'Email not found' });
    } else {
        await db.markMailRead(id);
        res.json({ email: data });
    }
});

// Delete a specific email
app.delete('/api/mail/:id', async (req, res) => {
    const id = req.params.id;
    const { error } = await db.deleteMailById(id);
    if (error) {
        res.status(500).json({ error: error.message });
    } else {
        res.json({ success: true });
    }
});

// Clear all emails for an address
app.delete('/api/inbox/:email', async (req, res) => {
    const email = decodeURIComponent(req.params.email);
    const { error } = await db.deleteInbox(email);
    if (error) {
        res.status(500).json({ error: error.message });
    } else {
        res.json({ success: true });
    }
});

// Mark all emails as read for an address
app.patch('/api/inbox/:email/read', async (req, res) => {
    const email = decodeURIComponent(req.params.email);
    const { error } = await db.markInboxRead(email);
    if (error) {
        res.status(500).json({ error: error.message });
    } else {
        res.json({ success: true });
    }
});

// Mark single email as read (optional explicit endpoint)
app.patch('/api/mail/:id/read', async (req, res) => {
    const id = req.params.id;
    const { error } = await db.markMailRead(id);
    if (error) {
        res.status(500).json({ error: error.message });
    } else {
        res.json({ success: true });
    }
});

// Stats for an address (email count)
app.get('/api/stats/:email', async (req, res) => {
    const email = decodeURIComponent(req.params.email);
    const { count, error } = await db.getMailCount(email);
    if (error) {
        res.status(500).json({ error: error.message });
    } else {
        res.json({ emailCount: count ?? 0 });
    }
});

// ============================================
// EMAIL ADDRESS PARSING
// ============================================
// Handle formats: "Name" <user@domain.com>, user@domain.com, etc.

function extractAddresses(addrObj) {
    if (!addrObj) return [];
    if (Array.isArray(addrObj.value) && addrObj.value.length > 0) {
        return addrObj.value
            .map((v) => (v && typeof v === 'object' ? v.address : null))
            .filter(Boolean);
    }
    const fromText = extractEmailFromText(addrObj.text);
    return fromText ? [fromText] : [];
}

function extractEmailFromText(text) {
    if (!text || typeof text !== 'string') return null;
    const t = text.trim();
    if (!t) return null;
    // Match <email@domain.com> or <Email <email@domain.com>>
    const angleMatch = t.match(/<([^<>]+@[^<>]+)>/);
    if (angleMatch) return angleMatch[1].trim().toLowerCase();
    // Plain email
    const emailMatch = t.match(/[\w.+-]+@[\w.-]+\.\w+/);
    return emailMatch ? emailMatch[0].toLowerCase() : t.toLowerCase();
}

function getPrimaryAddress(addrObj) {
    const addrs = extractAddresses(addrObj);
    return addrs[0] || null;
}

function formatSenderDisplay(addrObj) {
    if (!addrObj) return '';
    if (Array.isArray(addrObj.value) && addrObj.value[0]) {
        const v = addrObj.value[0];
        if (v.name && v.address) return `${v.name} <${v.address}>`;
        return v.address || addrObj.text || '';
    }
    return addrObj.text || '';
}

// ============================================
// SMTP SERVER
// ============================================

const smtpOptions = {
    authOptional: true,
    onConnect(session, callback) {
        console.log("Client connected:", session.remoteAddress);
        callback();
    },
    onData(stream, session, callback) {
        simpleParser(stream)
            .then(async parsed => {
                // Receiver: canonical email for inbox lookup. Prefer envelope, then To, then Cc.
                const envelopeTo = Array.isArray(session?.envelope?.recipients)
                    ? session.envelope.recipients.map((r) => String(r).toLowerCase())
                    : [];
                const headerTo = [
                    ...extractAddresses(parsed.to),
                    ...extractAddresses(parsed.cc)
                ].map((a) => a.toLowerCase());
                const allRecipients = [...envelopeTo, ...headerTo];
                const domainSuffix = `@${EMAIL_DOMAIN.toLowerCase()}`;
                const ours = allRecipients.find((a) => a.endsWith(domainSuffix));
                const receiverEmail = (ours || allRecipients[0] || extractEmailFromText(parsed.to?.text) || '');

                // Sender: display format for UI (e.g. "Figma" <support@figma.com>)
                const senderDisplay = formatSenderDisplay(parsed.from);
                const senderEmail = getPrimaryAddress(parsed.from) || extractEmailFromText(parsed.from?.text) || senderDisplay;

                console.log("From:", senderDisplay || senderEmail);
                console.log("To:", receiverEmail);
                console.log("Subject:", parsed.subject || 'No Subject');
                console.log("Body:", String(parsed.html || parsed.text || 'No Body').slice(0, 80) + '...');

                const { error } = await db.insertMail({
                    sender: senderDisplay || senderEmail,
                    receiver: receiverEmail,
                    header: parsed.subject || 'No Subject',
                    body: parsed.html || parsed.text || 'No Body'
                });

                if (error) {
                    console.error("Error saving email to database:", error);
                    callback(error);
                } else {
                    console.log("Email saved to database");
                    callback();
                }
            })
            .catch(err => {
                console.error("Error parsing email:", err);
                callback(err);
            });
    }
};

const server = new SMTPServer(smtpOptions);

// Prevent TLS handshake errors from crashing the server (e.g. ERR_SSL_NO_SUITABLE_SIGNATURE_ALGORITHM
// when clients/certs use deprecated algorithms). Log and continue; server stays up.
server.on('error', (err) => {
    console.error('SMTP server error (connection rejected):', err.message);
    if (err.code === 'ERR_SSL_NO_SUITABLE_SIGNATURE_ALGORITHM') {
        console.error('Tip: Use a certificate with SHA-256. Older SHA-1 certs are rejected by Node 22 / OpenSSL 3.');
    }
});

server.listen(SMTP_PORT, () => {
    console.log(`SMTP Server is listening on port ${SMTP_PORT}`);
});

app.listen(API_PORT, () => {
    console.log(`Mailflow API listening on port ${API_PORT}`);
});