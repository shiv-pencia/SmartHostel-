
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";

import env from "./config/env.js";

import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import hostelRoutes from "./routes/hostel.routes.js";
import roomRoutes from "./routes/room.routes.js";
import bedRoutes from "./routes/bed.routes.js";
import reportRoutes from "./routes/report.routes.js";
import allocationRoutes from "./routes/allocation.routes.js";
import complaintRoutes from "./routes/complaint.routes.js";
import noticeRoutes from "./routes/notice.routes.js";
import visitorRoutes from "./routes/visitor.routes.js";

import csrfProtection from "./middlewares/csrf.middleware.js";
import notFoundMiddleware from "./middlewares/notFound.middleware.js";
import errorMiddleware from "./middlewares/error.middleware.js";

const app = express();

/*
 * Security headers
 */
app.use(helmet());

/*
 * Browser CORS configuration
 */
const allowedOrigins = [
  env.clientUrl,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, mobile, server-to-server) or in allowed list
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
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
 * General API rate limit (permissive in development)
 */
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: env.nodeEnv === "development" ? 3000 : 100,
    standardHeaders: "draft-8",
    legacyHeaders: false,
  })
);

/*
 * Request body parsing
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
 * Development request logging
 */
if (env.nodeEnv === "development") {
  app.use(morgan("dev"));
}

/*
 * CSRF protection for modifying requests
 */
app.use("/api/v1", csrfProtection);

/*
 * Health check
 */
app.get("/api/v1/health", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Smart Hostel API is running",
  });
});

/*
 * API routes
 */
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/hostels", hostelRoutes);
app.use("/api/v1/rooms", roomRoutes);
app.use("/api/v1/beds", bedRoutes);
app.use("/api/v1/reports", reportRoutes);
app.use("/api/v1/allocations", allocationRoutes);
app.use("/api/v1/complaints", complaintRoutes);
app.use("/api/v1/notices", noticeRoutes);
app.use("/api/v1/visitors", visitorRoutes);

/*
 * Error middleware
 */
app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
