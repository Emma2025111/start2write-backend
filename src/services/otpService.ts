import crypto from "node:crypto";
import nodemailer from "nodemailer";
import env from "../config/env";

interface OtpDeliveryOptions {
  email: string;
  otp: string;
  context: "login" | "reset";
}

export function generateOtp(): string {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
}

export function hashOtp(otp: string): string {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

// Create nodemailer transporter for Gmail
const createGmailTransport = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass,
    },
  });
};

export async function deliverOtp({ email, otp, context }: OtpDeliveryOptions): Promise<void> {
  const subject = `Your Start2Write admin ${context === "login" ? "login" : "reset"} code`;
  const htmlContent = `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1e3a8a; margin-bottom: 20px;">Start2Write - Verification Code</h2>
          
          <p>Hello,</p>
          
          <p>Your verification code for ${context === "login" ? "admin login" : "password reset"} is:</p>
          
          <div style="background-color: #f3f4f6; border: 2px solid #3b82f6; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
            <h1 style="color: #3b82f6; margin: 0; letter-spacing: 2px;">${otp}</h1>
          </div>
          
          <p><strong>This code expires in ${env.otpExpiryMinutes} minutes.</strong></p>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            If you didn't request this code, please ignore this email.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px;">
            © 2025 Start2Write. All rights reserved.
          </p>
        </div>
      </body>
    </html>
  `;

  try {
    // Use Gmail via nodemailer as primary method
    if (env.smtpUser && env.smtpPass) {
      console.info(`Attempting to send OTP via Gmail to ${email}...`);

      const transport = createGmailTransport();

      await transport.sendMail({
        to: email,
        from: env.smtpUser,
        subject,
        text: `Your verification code is ${otp}. It expires in ${env.otpExpiryMinutes} minutes.`,
        html: htmlContent,
      });

      console.info(`✅ OTP sent successfully to ${email} via Gmail`);
      return;
    }

    // Fallback to Brevo API if Gmail is not configured
    if (env.bravoApiKey && env.bravoSender) {
      console.info(`Attempting to send OTP via Brevo to ${email}...`);

      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": env.bravoApiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sender: {
            name: "Start2Write",
            email: env.bravoSender,
          },
          to: [
            {
              email,
            },
          ],
          subject,
          htmlContent,
          textContent: `Your verification code is ${otp}. It expires in ${env.otpExpiryMinutes} minutes.`,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Brevo API error:", error);
        throw new Error(`Failed to send OTP via Brevo: ${JSON.stringify(error)}`);
      }

      console.info(`✅ OTP sent successfully to ${email} via Brevo`);
      return;
    }

    // Dev mode fallback
    console.info(`[DEV] OTP for ${email}: ${otp}`);
  } catch (error) {
    console.error("❌ Error sending OTP:", error);
    throw error;
  }
}
