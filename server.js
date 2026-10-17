require('dotenv').config();

const path = require('node:path');
const express = require('express');
const nodemailer = require('nodemailer');

const app = express();
const port = Number(process.env.PORT) || 3000;
const recipient = 'tiktok@prizmamedia.net';
const experienceOptions = new Set(['Hiç yok', '0–6 ay', '6–12 ay', '1 yıldan fazla']);
const outputDirectory = path.join(__dirname, 'outputs');
const recentSubmissions = new Map();
const rateWindowMs = 10 * 60 * 1000;
const maxSubmissionsPerWindow = 10;

app.disable('x-powered-by');
app.use(express.json({ limit: '20kb' }));
app.use(express.static(outputDirectory, { extensions: ['html'] }));

function cleanText(value, maxLength) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const smtpPort = Number(process.env.SMTP_PORT);
  if (!host || !user || !pass || !smtpPort) return null;
  return nodemailer.createTransport({
    host,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: { user, pass }
  });
}

const transporter = createTransporter();

app.post('/api/applications', async (request, response) => {
  if (!transporter) {
    return response.status(503).json({ error: 'Başvuru e-posta servisi şu anda yapılandırılamadı. Lütfen daha sonra tekrar deneyin.' });
  }

  const now = Date.now();
  const clientKey = request.ip;
  const recent = (recentSubmissions.get(clientKey) || []).filter(time => now - time < rateWindowMs);
  if (recent.length >= maxSubmissionsPerWindow) {
    return response.status(429).json({ error: 'Kısa sürede çok fazla başvuru gönderildi. Lütfen daha sonra tekrar deneyin.' });
  }
  recent.push(now);
  recentSubmissions.set(clientKey, recent);

  const name = cleanText(request.body?.name, 120).replace(/[\r\n\t]+/g, ' ');
  const age = Number(request.body?.age);
  const handle = cleanText(request.body?.handle, 40).replace(/^@+/, '');
  const experience = cleanText(request.body?.experience, 40);
  const email = cleanText(request.body?.email, 254);
  const phone = cleanText(request.body?.phone, 40);
  const notes = cleanText(request.body?.notes, 3000);
  const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  if (name.length < 2 || !Number.isInteger(age) || age < 18 || age > 99 ||
      !/^[A-Za-z0-9._]{1,24}$/.test(handle) || !experienceOptions.has(experience) ||
      !emailIsValid || phone.length < 7) {
    return response.status(400).json({ error: 'Lütfen zorunlu alanları kontrol edip tekrar deneyin.' });
  }

  const submittedAt = new Date();
  const timestamp = new Intl.DateTimeFormat('tr-TR', {
    dateStyle: 'long', timeStyle: 'short', timeZone: 'Europe/Istanbul'
  }).format(submittedAt);
  const fields = [
    ['Ad Soyad', name],
    ['Yaş', String(age)],
    ['TikTok Kullanıcı Adı', `@${handle}`],
    ['Canlı Yayın Deneyimi', experience],
    ['E-Posta Adresi', email],
    ['Telefon / WhatsApp', phone],
    ['Ek Notlar / Detaylar', notes || '—'],
    ['Başvuru Tarihi', timestamp]
  ];
  const text = fields.map(([label, value]) => `${label}: ${value}`).join('\n');
  const htmlRows = fields.map(([label, value]) =>
    `<tr><th style="padding:10px 14px;text-align:left;border-bottom:1px solid #e5e7eb;color:#4b5563;white-space:nowrap">${escapeHtml(label)}</th><td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;color:#111827">${escapeHtml(value)}</td></tr>`
  ).join('');

  try {
    await transporter.sendMail({
      from: { name: 'Prizma Medya Başvuru Formu', address: process.env.SMTP_USER },
      to: recipient,
      replyTo: email,
      subject: `[Prizma Medya] Yeni Yayıncı Başvurusu - ${name}`,
      text,
      html: `<div style="font-family:Arial,sans-serif;max-width:720px;margin:0 auto;color:#111827"><h2 style="font-size:20px">Yeni Yayıncı Başvurusu</h2><table style="border-collapse:collapse;width:100%;font-size:14px"><tbody>${htmlRows}</tbody></table></div>`
    });
    return response.status(200).json({ ok: true });
  } catch (error) {
    console.error('Application email delivery failed:', error.code || error.name || 'SMTP_ERROR');
    return response.status(502).json({ error: 'E-posta gönderilemedi. Lütfen birkaç dakika sonra tekrar deneyin veya bize WhatsApp üzerinden ulaşın.' });
  }
});

app.use((error, request, response, next) => {
  if (error?.type === 'entity.too.large') {
    return response.status(413).json({ error: 'Başvuru notları çok uzun. Lütfen kısaltıp tekrar deneyin.' });
  }
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return response.status(400).json({ error: 'Başvuru bilgileri okunamadı. Lütfen tekrar deneyin.' });
  }
  return next(error);
});

app.listen(port, () => {
  console.log(`Prizma Medya website is running on port ${port}.`);
});
