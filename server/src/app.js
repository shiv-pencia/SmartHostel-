
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";

import env from "./config/env.js";

import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";

import csrfProtection from "./middlewares/csrf.middleware.js";
import notFoundMiddleware from "./middlewares/notFound.middleware.js";
import errorMiddleware from "./middlewares/error.middleware.js";

const app = express();

/*
 * Security
 */
app.use(helmet());

app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,
    allowedHeaders: [
      "Content-Type",
      "X-Requested-With",
    ],
    methods: [
      "GET",
      "POST",
      "PATCH",
      "PUT",
      "DELETE",
    ],
  })
);

/*
 * General API rate limiting
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

app.use("/api", apiLimiter);

/*
 * Request parsing
 */
app.use(express.json({ limit: "10kb" }));

app.use(
  express.urlencoded({
    extended: true,
    limit: "10kb",
  })
);

app.use(cookieParser());

/*
 * Development logging
 */
if (env.nodeEnv === "development") {
  app.use(morgan("dev"));
}

/*
 * CSRF protection for API requests
 */
app.use("/api/v1", csrfProtection);

/*
 * Health check
 */
app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Smart Hostel API is running",
  });
});

/*
 * Application routes
 */
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);

/*
 * Error handlers
 */
app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
