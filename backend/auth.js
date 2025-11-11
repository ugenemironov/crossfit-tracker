import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import db from './database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';
const OTP_EXPIRY_MINUTES = 10;

let emailTransporter = null;

export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendOTPEmail(email, code) {
  console.log(`\n📧 OTP Code for ${email}: ${code}\n`);
  
  try {
    if (!emailTransporter) {
      const testAccount = await nodemailer.createTestAccount();
      emailTransporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: { user: testAccount.user, pass: testAccount.pass }
      });
    }

    const info = await emailTransporter.sendMail({
      from: '"CrossFit Tracker" <noreply@crossfit.com>',
      to: email,
      subject: 'Your Login Code',
      html: `<p>Code: <strong>${code}</strong></p>`
    });

    console.log('Preview:', nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error('Email error:', error.message);
  }
}

export function saveOTP(email, phone, code) {
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();
  db.prepare(`INSERT INTO otp_codes (email, phone, code, expires_at) VALUES (?, ?, ?, ?)`)
    .run(email, phone, code, expiresAt);
}

export function verifyOTP(email, phone, code) {
  const now = new Date().toISOString();
  const row = db.prepare(`
    SELECT * FROM otp_codes
    WHERE (email = ? OR phone = ?) AND code = ? AND used = 0 AND expires_at > ?
    ORDER BY created_at DESC LIMIT 1
  `).get(email || null, phone || null, code, now);

  if (row) {
    db.prepare('UPDATE otp_codes SET used = 1 WHERE id = ?').run(row.id);
    return true;
  }
  return false;
}

export function createToken(userId) {
  return jwt.sign({ userId: parseInt(userId) }, JWT_SECRET, { expiresIn: '30d' });
}

export function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      console.error('❌ No token provided');
      return res.status(401).json({ error: 'No token' });
    }

    console.log('🔑 Verifying token...');
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('✅ Token decoded:', decoded);

    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(decoded.userId);
    
    if (!user) {
      console.error('❌ User not found for ID:', decoded.userId);
      console.log('Available users:', users); // Для дебага
      return res.status(403).json({ error: 'User not found' });
    }

    console.log('✅ User authenticated:', user.id);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    console.error('❌ Auth error:', error.message);
    return res.status(403).json({ error: 'Invalid token' });
  }
}


export function checkOTPRateLimit(email, phone) {
  const fiveMin = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const result = db.prepare(`
    SELECT COUNT(*) as count FROM otp_codes
    WHERE created_at > ? AND (email = ? OR phone = ?)
  `).get(fiveMin, email || null, phone || null);
  return result.count < 3;
}

export function initAuth() {
  console.log('🔐 Auth initialized');
  setInterval(() => {
    db.prepare('DELETE FROM otp_codes WHERE expires_at < ?').run(new Date().toISOString());
  }, 60 * 60 * 1000);
}
