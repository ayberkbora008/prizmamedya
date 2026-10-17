require('dotenv').config();

const nodemailer = require('nodemailer');

const recipient = 'tiktok@prizmamedia.net';
const smtpPort = Number(process.env.SMTP_PORT);
const { SMTP_HOST: host, SMTP_USER: user, SMTP_PASS: pass } = process.env;

if (!host || !smtpPort || !user || !pass) {
  console.error('SMTP ayarları eksik. .env dosyasındaki SMTP_HOST, SMTP_PORT, SMTP_USER ve SMTP_PASS değerlerini kontrol edin.');
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host,
  port: smtpPort,
  secure: smtpPort === 465,
  auth: { user, pass }
});

transporter.sendMail({
  from: { name: 'Prizma Medya Sistem Testi', address: user },
  to: recipient,
  subject: '[Prizma Medya] Test E-Postası - Sistem Başarılı!',
  text: 'Bu test e-postası, SMTP ayarlarının ve Nodemailer yapılandırmasının doğru çalıştığını doğrular.',
  html: '<div style="font-family:Arial,sans-serif;color:#111827"><h2>Prizma Medya e-posta sistemi başarılı</h2><p>Bu test e-postası, SMTP ayarlarının ve Nodemailer yapılandırmasının doğru çalıştığını doğrular.</p></div>'
}).then(info => {
  console.log(`Test e-postası ${recipient} adresine gönderildi. Message ID: ${info.messageId}`);
}).catch(error => {
  console.error(`Test e-postası gönderilemedi (${error.code || error.name || 'SMTP_ERROR'}). SMTP sunucusu ve kimlik bilgilerini kontrol edin.`);
  process.exitCode = 1;
});
