const mongoose = require("mongoose");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");

process.on("uncaughtException", (err) => {
  console.log("Uncaught Exception! Shutting down...");
  console.log(err.name, err.message, err.stack);
  process.exit(1);
});

dotenv.config({ path: "./.env" });
const app = require("./app");

// Connect to MongoDB
const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB)
  .then(() => console.log("DB connection successful!"))
  .catch((err) => {
    console.error("DB connection error:", err.message);
    process.exit(1);
  });

// Set up HTTP server and Socket.IO
const port = process.env.PORT || 5000;
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

// Store Socket.IO instance in app
app.set("socketio", io);

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Join user-specific room
  socket.on("joinRoom", (userId) => {
    if (!userId) {
      socket.emit("error", "User ID is required to join room");
      return;
    }
    socket.join(`user:${userId}`);
    console.log(`User ${userId} joined room user:${userId}`);
    socket.emit("roomJoined", `user:${userId}`);
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });

  // Error handling
  socket.on("error", (err) => {
    console.error("Socket.IO error:", err);
  });
});

server.listen(port, () => {
  console.log(`App running on port ${port}`);
});

process.on("unhandledRejection", (err) => {
  console.log("Unhandled Rejection! Shutting down...");
  console.log("Error:", err.name, err.message, err.stack);
  server.close(() => {
    process.exit(1);
  });
});
