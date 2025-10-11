
// lib/email-templates/verification.ts

export function verificationEmailTemplate(code: string) {
  return {
    subject: "Verify your Library Account",
    text: `Welcome to the GwenBooks!\n\nUse this code to verify your account: ${code}\n\nThis code will expire in 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
        <h2>Welcome to GwenBooks 📚</h2>
        <p>Please use the code below to verify your account:</p>
        <div style="font-size: 24px; font-weight: bold; background: #f4f4f4; padding: 10px; border-radius: 8px; text-align: center;">
          ${code}
        </div>
        <p>This code will expire in <b>10 minutes</b>.</p>
        <p>If you did not request this, you can ignore this email.</p>
      </div>
    `,
  };
}

