import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import env from "./config/env";
import { connectDatabase } from "./config/database";
import { ensureDefaultAdmin } from "./services/adminService";
import authRoutes from "./routes/authRoutes";
import adminRoutes from "./routes/adminRoutes";
import publicRoutes from "./routes/publicRoutes";
import errorHandler from "./middleware/errorHandler";

function bootstrap() {
  // Connect to database (async, but not awaited for serverless)
  connectDatabase();
  ensureDefaultAdmin();

  const app = express();

  app.set("trust proxy", 1);

  app.use(helmet());
  app.use(
    cors({
      origin: "*", // Allow requests from any origin
      credentials: false, // No need for credentials with token-based auth
    })
  );
  app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));

  const limiter = rateLimit({
    windowMs: env.rateLimitWindowMs,
    max: env.rateLimitMax,
  });
  app.use("/api/", limiter);

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/", (_req, res) => {
    res.json({ message: "Start2Write API", version: "1.0.0" });
  });

  app.use("/api/public", publicRoutes);
  app.use("/api/auth", authRoutes);
  app.use("/api/admin", adminRoutes);

  app.use(errorHandler);

  return app;
}

const app = bootstrap();

export default app;

if (!process.env.VERCEL) {
  // For local development
  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`API ready on http://localhost:${env.port}`);
  });
}
