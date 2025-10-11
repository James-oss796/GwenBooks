import nodemailer from "nodemailer";
import config from "./config"; // your env variables

export async function sendEmail({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}) {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com", // you can use Gmail, Outlook, etc.
      port: 465,
      secure: true,
      auth: {
        user: config.env.email.emailUser, // put your email in .env
        pass: config.env.email.emailPass, // app password for Gmail
      },
    });

    const info = await transporter.sendMail({
      from: `"Library App" <${config.env.email.emailUser}>`,
      to,
      subject,
      text,
      html,
    });

    console.log("Email sent:", info.messageId);
  } catch (err) {
    console.error("Send email failed:", err);
    throw err;
  }
}
