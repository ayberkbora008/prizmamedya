# Prizma Medya website

The application form is delivered by the Node server at `POST /api/applications`. The server validates each submission, creates a plain-text and HTML email, and sends it to `tiktok@prizmamedia.net` through SMTP. It also serves the site from `outputs/`.

## Run locally

Requirements: Node.js 18 or newer.

1. Install dependencies with `npm install`.
2. Add the SMTP server settings to the ignored `.env` file. The current local configuration uses Gmail SMTP (`smtp.gmail.com`, port `465`) with the `tiktok@prizmamedia.net` mailbox. If this mailbox is hosted by another provider, change `SMTP_HOST` and `SMTP_PORT` to that provider's SMTP settings.
3. Start the site with `npm start`.
4. Open `http://localhost:3000` in a browser. Opening `outputs/index.html` directly as a `file://` page will not connect to the API.

## Verify SMTP delivery

Run `npm run test-email` to send a one-time test message to `tiktok@prizmamedia.net`. The message confirms that SMTP and Nodemailer are configured. This command sends a real email; the server does not send one automatically at startup.

`.env.example` lists the required variables. Never commit `.env`; it is excluded by `.gitignore`.
