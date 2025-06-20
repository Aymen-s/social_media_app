const express = require("express");
const {
  sendMessage,
  getMessages,
} = require("../controllers/messageController");
const { protect } = require("../controllers/authController");

const router = express.Router();

// Protect all routes
router.use(protect);

// Message Routes
router.post("/", sendMessage);
router.get("/:userId", getMessages);

module.exports = router;
