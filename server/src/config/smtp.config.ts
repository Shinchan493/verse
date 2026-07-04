import { createTransport } from 'nodemailer';
import env from './env.config';

// Port/secure are env-driven so local dev can use a plaintext mail catcher
// (e.g. maildev on 1025) while production stays on 465/TLS.
const smtpPort = Number(process.env.SMTP_PORT) || 465;
const smtpSecure = process.env.SMTP_SECURE !== 'false';

const transporter = createTransport({
  port: smtpPort,
  host: env.SMTP_HOST,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASSWORD,
  },
  secure: smtpSecure,
});

export default transporter;
