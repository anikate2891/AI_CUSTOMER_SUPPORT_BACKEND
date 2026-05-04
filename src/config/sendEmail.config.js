import transporter from "../services/email.services.js";
import nodemailer from 'nodemailer';
import { config } from './config.js';

// Function to send email
const sendEmail = async (to, subject, text, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"SupportAI" <${config.GOOGLE_EMAIL_USER}>`, // sender address
      to, // list of receivers
      subject, // Subject line
      text, // plain text body
      html, // html body
    });

    console.log('[EMAIL] Message sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('[EMAIL] Error sending email:', error);
    throw error; // throw so the background catch can log it
  }
};

export default sendEmail;