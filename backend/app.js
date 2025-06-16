const express = require("express");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const cors = require("cors");
const path = require("path");

const AppError = require("./config/appError");

const app = express();

// Global Middlewares
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173" }));
app.use(express.static(path.join(__dirname, "public")));

// Set security HTTP headers
app.use(helmet());

// Development logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Limit requests from same IP
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: "Too many requests from this IP, please try again in an hour!",
});
app.use("/api", limiter);

// Body parser
app.use(express.json({ limit: "10kb" }));

// Data sanitization
app.use(mongoSanitize());
app.use(xss());

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: ["content", "likes", "comments", "timestamp"],
  })
);

// Add request time
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// Routes (to be implemented)
app.get("/", (req, res) => {
  res.status(200).json({ status: "success", message: "Server is running" });
});
// TODO: Implement auth routes (/api/v1/auth for register, login)
// TODO: Implement post routes (/api/v1/posts for create, get, like, comment)
// TODO: Implement user routes (/api/v1/users for follow, unfollow)
// TODO: Implement message routes (/api/v1/messages for chat history)

// Handle undefined routes
app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }
  res.status(500).json({
    status: "error",
    message: "Internal server error",
  });
});

module.exports = app;
