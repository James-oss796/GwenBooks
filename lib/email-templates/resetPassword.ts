// lib/email-templates/resetPassword.ts

export const resetPasswordEmailTemplate = (resetLink: string) => {
  const subject = "GwenBooks: Reset Your Password";
  
  const html = `
  <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color:#1c1c1c; padding:20px; max-width:600px; margin:auto; border:1px solid #e5e5e5; border-radius:10px; background-color:#f9f9f9;">
    <div style="text-align:center; margin-bottom:20px;">
      <img src="https://yourdomain.com/logo.png" alt="GwenBooks" style="width:120px;"/>
    </div>
    <h2 style="text-align:center; color:#1D4ED8;">Password Reset Request</h2>
    <p style="font-size:16px;">You requested to reset your password for your GwenBooks account.</p>
    <p style="font-size:16px;">Click the button below to set a new password. This link is valid for 10 minutes only.</p>
    <div style="text-align:center; margin:30px 0;">
      <a href="${resetLink}" style="
        display:inline-block;
        padding:12px 24px;
        background-color:#1D4ED8;
        color:white;
        font-weight:bold;
        text-decoration:none;
        border-radius:6px;
        font-size:16px;
      ">Reset Password</a>
    </div>
    <p style="font-size:14px; color:#555;">If you didn't request this, you can safely ignore this email.</p>
    <p style="font-size:14px; color:#555;">GwenBooks Team</p>
  </div>
  `;

  const text = `You requested to reset your GwenBooks password. Use this link: ${resetLink} (Valid for 10 minutes)`;

  return { subject, html, text };
};
