import Mail from 'nodemailer/lib/mailer';
import transporter from '../config/smtp.config';

class MailService {
  public sendMail = async (mailOptions: Mail.Options) => {
    // Never let a mail failure crash the server (fire-and-forget in callers).
    try {
      await transporter.sendMail(mailOptions);
    } catch (err) {
      console.error('[mail] sendMail failed:', (err as Error).message);
    }
  };
}
const mailService = new MailService();

export { mailService };
