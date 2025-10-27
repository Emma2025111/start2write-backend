import "dotenv/config";

const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  clientUrl: process.env.CLIENT_URL ?? "http://localhost:3000",
  mongoUri: process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/start2write",
  sessionSecret: process.env.SESSION_SECRET ?? "change-me-session-secret",
  jwtSecret: process.env.JWT_SECRET ?? "change-me-jwt-secret",
  adminEmail: process.env.ADMIN_EMAIL ?? "zohaibch100@yopmail.com",
  adminPassword: process.env.ADMIN_PASSWORD ?? "ChangeMe123!",
  requireOtp: process.env.REQUIRE_OTP !== "false",
  otpExpiryMinutes: Number(process.env.OTP_EXPIRY_MINUTES ?? 10),
  otpResendWindowSeconds: Number(process.env.OTP_RESEND_WINDOW_SECONDS ?? 60),
  smtpHost: process.env.SMTP_HOST ?? "smtp.gmail.com",
  smtpPort: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
  smtpUser: process.env.SMTP_USER,
  smtpPass: process.env.SMTP_PASS,
  bravoApiKey: process.env.BRAVO_API_KEY,
  bravoSender: process.env.BRAVO_SENDER,
  cookieDomain: process.env.COOKIE_DOMAIN,
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60000),
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX ?? 60),
};

export default env;
