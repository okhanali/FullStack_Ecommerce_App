import express, { type Express, type Request, type Response } from "express";
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import mongoose from "mongoose";
import rateLimit from "express-rate-limit";
import compression from "compression";
import { mongoSanitize } from "./middleware/sanitizeMiddleware.js";
import { connectMongoDB } from "./config/db.js";
import { notFoundHandler } from "./middleware/notFoundHandler.js";
import { errorHandler } from "./middleware/errorMiddleware.js";

import { userRoutes } from "./routes/userRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import { reviewRouter } from "./routes/reviewRoutes.js";
import { adminRouter } from "./routes/adminRoutes.js";
import { courierRouter } from "./routes/courierRoutes.js";
import { vendorRouter } from "./routes/vendorRoutes.js";
import { couponRouter } from "./routes/couponRoutes.js";

dotenv.config();

process.on("uncaughtException", (err: Error) => {
  console.error("🔴 [UNCAUGHT EXCEPTION]:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason: unknown) => {
  console.error("🔴 [UNHANDLED REJECTION]:", reason);
  process.exit(1);
});

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Security & Optimization Middlewares
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        "img-src": ["'self'", "data:", "https://*.tile.openstreetmap.org"],
      },
    },
  }),
);

// Dynamic CORS configuration
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(",")
  : ["http://localhost:5173"];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS policy violation"));
      }
    },
    credentials: true,
  }),
);

// Rate Limiting (Using environment variables)
const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW) || 10 * 60 * 1000, // 10 dakika (600000 ms)
  max: Number(process.env.RATE_LIMIT_MAX_REQ) || 100, // IP başına max istek
  message: {
    status: "fail",
    message: "Çok fazla istek gönderildi. Lütfen daha sonra tekrar deneyin.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api", limiter);

// Body Parsers & Sanitization
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());
app.use(mongoSanitize);
app.use(compression()); //

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Healthcheck Endpoint
app.get("/health", (_req: Request, res: Response) => {
  const dbStatus =
    mongoose.connection.readyState === 1 ? "CONNECTED" : "DISCONNECTED";

  res.status(200).json({
    status: "UP",
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
});

//* Routes

app.use("/api/v1/users", userRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/carts", cartRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/reviews", reviewRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/courier", courierRouter);
app.use("/api/v1/vendor", vendorRouter);
app.use("/api/v1/coupons", couponRouter);
// Error Handling Middlewares
app.use(notFoundHandler);
app.use(errorHandler);

// Server Startup & Graceful Shutdown
const startServer = async (): Promise<void> => {
  await connectMongoDB();

  const server = app.listen(PORT, () => {
    console.log(`🟢 [Server]: ${PORT} portunu dinliyor.`);
  });

  const shutdown = async (signal: string) => {
    console.log(
      `\n[Server]: ${signal} sinyali alındı. Düzgün bir şekilde kapatılıyor...`,
    );
    server.close(async () => {
      await mongoose.connection.close();
      console.log("🔴 [Database]: MongoDB bağlantısı kapatıldı.");
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
};

startServer();

export default app;
