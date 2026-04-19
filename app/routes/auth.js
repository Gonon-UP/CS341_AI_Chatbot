const express = require('express');
const router = express.Router();

const db = require('../dbms');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const path = require('path');

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function isUpEmail(email) {
  return email.endsWith('@up.edu');
}

function make6DigitCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60000);
}

// Convert JS Date -> MySQL DATETIME string "YYYY-MM-DD HH:MM:SS"
function toMySqlDateTime(d) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false, // 587 uses STARTTLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

function q(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.dbquery(sql, params, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
}

// Health check (optional)
router.get('/api/auth/status', (req, res) => {
  res.json({ loggedIn: !!(req.session && req.session.userId) });
});

router.get('/login', (req, res) => {
  if (req.session && req.session.userId) return res.redirect('/index.html');
  res.sendFile(path.join(__dirname, '..', 'public', 'login.html'));
});

/**
 * POST /api/auth/signup
 * body: { email }
 */
router.post('/api/auth/signup', async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    if (!email) return res.status(400).json({ error: 'Email required.' });
    if (!isUpEmail(email)) return res.status(400).json({ error: 'Only @up.edu emails allowed.' });

    const code = make6DigitCode();
    const codeHash = await bcrypt.hash(code, 10);

    const expiresAt = addMinutes(new Date(), 10);
    const now = new Date();

    // MySQL upsert: insert if new, otherwise update the verification code/expiry
    await q(
      `INSERT INTO users (email, email_verified, password_hash, verify_code_hash, verify_expires_at, created_at)
       VALUES (?, 0, NULL, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         email_verified = 0,
         verify_code_hash = VALUES(verify_code_hash),
         verify_expires_at = VALUES(verify_expires_at)`,
      [email, codeHash, toMySqlDateTime(expiresAt), toMySqlDateTime(now)]
    );

    await transporter.sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER, // should be "Name <email@...>"
      to: email,
      subject: 'Your verification code',
      text: `Your verification code is: ${code}\n\nIt expires in 10 minutes.`
    });

    // Keep response generic (doesn't reveal if email exists)
    res.json({ ok: true, message: 'If that email is eligible, a verification code was sent.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Signup failed.' });
  }
});

router.post('/api/auth/verify', async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const code = String(req.body.code || '').trim();
    if (!email || !code) return res.status(400).json({ error: 'Email and code required.' });

    const rows = await q(
      `SELECT id, verify_code_hash, verify_expires_at
       FROM users
       WHERE email = ?`,
      [email]
    );
    const user = rows && rows[0];
    if (!user) return res.status(400).json({ error: 'Invalid email or code.' });

    if (!user.verify_code_hash || !user.verify_expires_at) {
      return res.status(400).json({ error: 'No pending verification for this email.' });
    }

    // MySQL DATETIME comes back as a Date (often) or string depending on driver config.
    const exp = (user.verify_expires_at instanceof Date)
      ? user.verify_expires_at
      : new Date(user.verify_expires_at);

    if (Number.isNaN(exp.getTime()) || exp < new Date()) {
      return res.status(400).json({ error: 'Code expired. Please sign up again.' });
    }

    const ok = await bcrypt.compare(code, user.verify_code_hash);
    if (!ok) return res.status(400).json({ error: 'Invalid email or code.' });

    await q(`UPDATE users SET email_verified = 1 WHERE email = ?`, [email]);

    res.json({ ok: true, message: 'Email verified. Now set a password.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Verification failed.' });
  }
});

router.post('/api/auth/set-password', async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || '');

    if (!email || !password) return res.status(400).json({ error: 'Email and password required.' });
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });

    const rows = await q(`SELECT id, email_verified FROM users WHERE email = ?`, [email]);
    const user = rows && rows[0];
    if (!user) return res.status(400).json({ error: 'Unknown user.' });
    if (!user.email_verified) return res.status(403).json({ error: 'Email not verified.' });

    const passwordHash = await bcrypt.hash(password, 12);

    await q(
      `UPDATE users
       SET password_hash = ?, verify_code_hash = NULL, verify_expires_at = NULL
       WHERE email = ?`,
      [passwordHash, email]
    );

    // Log in (requires express-session configured in app.js)
    req.session.userId = user.id;
    req.session.email = email;

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Set password failed.' });
  }
});

router.post('/api/auth/login', async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || '');

    if (!email || !password) return res.status(400).json({ error: 'Email and password required.' });

    const rows = await q(
      `SELECT id, email_verified, password_hash
       FROM users
       WHERE email = ?`,
      [email]
    );
    const user = rows && rows[0];
    if (!user) return res.status(400).json({ error: 'Invalid credentials.' });
    if (!user.email_verified) return res.status(403).json({ error: 'Email not verified.' });
    if (!user.password_hash) return res.status(400).json({ error: 'No password set yet.' });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(400).json({ error: 'Invalid credentials.' });

    req.session.userId = user.id;
    req.session.email = email;

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed.' });
  }
});

/**
 * POST /api/auth/request-password-reset
 * body: { email }
 *
 * Always responds {ok:true} (generic) to avoid leaking whether the account exists.
 */
router.post('/api/auth/request-password-reset', async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    if (!email) return res.status(400).json({ error: 'Email required.' });
    if (!isUpEmail(email)) return res.status(400).json({ error: 'Only @up.edu emails allowed.' });

    // Generate and hash a 6-digit code
    const code = make6DigitCode();
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = addMinutes(new Date(), 10);

    // Only update if the user exists. (Response remains generic either way.)
    const rows = await q(`SELECT id FROM users WHERE email = ?`, [email]);
    const user = rows && rows[0];

    if (user) {
      await q(
        `UPDATE users
         SET reset_code_hash = ?, reset_expires_at = ?
         WHERE email = ?`,
        [codeHash, toMySqlDateTime(expiresAt), email]
      );

      await transporter.sendMail({
        from: process.env.MAIL_FROM || process.env.SMTP_USER,
        to: email,
        subject: 'Your password reset code',
        text: `Your password reset code is: ${code}\n\nIt expires in 10 minutes.`
      });
    }

    res.json({ ok: true, message: 'If that email exists, a reset code was sent.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Password reset request failed.' });
  }
});

/**
 * POST /api/auth/confirm-password-reset
 * body: { email, code, newPassword }
 */
router.post('/api/auth/confirm-password-reset', async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const code = String(req.body.code || '').trim();
    const newPassword = String(req.body.newPassword || '');

    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: 'Email, code, and new password required.' });
    }
    if (!isUpEmail(email)) return res.status(400).json({ error: 'Only @up.edu emails allowed.' });
    if (newPassword.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });

    const rows = await q(
      `SELECT id, email_verified, reset_code_hash, reset_expires_at
       FROM users
       WHERE email = ?`,
      [email]
    );
    const user = rows && rows[0];
    if (!user) return res.status(400).json({ error: 'Invalid email or code.' });
    if (!user.email_verified) return res.status(403).json({ error: 'Email not verified.' });

    if (!user.reset_code_hash || !user.reset_expires_at) {
      return res.status(400).json({ error: 'No password reset is pending for this email.' });
    }

    const exp = (user.reset_expires_at instanceof Date)
      ? user.reset_expires_at
      : new Date(user.reset_expires_at);

    if (Number.isNaN(exp.getTime()) || exp < new Date()) {
      return res.status(400).json({ error: 'Code expired. Please request a new reset code.' });
    }

    const ok = await bcrypt.compare(code, user.reset_code_hash);
    if (!ok) return res.status(400).json({ error: 'Invalid email or code.' });

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await q(
      `UPDATE users
       SET password_hash = ?, reset_code_hash = NULL, reset_expires_at = NULL
       WHERE email = ?`,
      [passwordHash, email]
    );

    // Optional: log them in immediately after reset
    req.session.userId = user.id;
    req.session.email = email;

    res.json({ ok: true, message: 'Password updated.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Password reset failed.' });
  }
});

router.post('/api/auth/logout', (req, res) => {
  if (!req.session) return res.json({ ok: true });
  req.session.destroy(() => res.json({ ok: true }));
});

module.exports = router;
