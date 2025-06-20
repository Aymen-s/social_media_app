const Message = require("../models/Message");
const catchAsync = require("../config/catchAsync");
const AppError = require("../config/appError");

exports.sendMessage = catchAsync(async (req, res, next) => {
  const { recipient, content, image } = req.body;
  const sender = req.user._id;

  // Validate recipient and inputs
  if (!recipient) {
    return next(new AppError("Recipient is required", 400));
  }

  if (!content && !image) {
    return next(new AppError("Message must have content or an image", 400));
  }

  if (sender.toString() === recipient) {
    return next(new AppError("You cannot send a message to yourself", 400));
  }

  // Create message
  const message = await Message.create({
    sender,
    recipient,
    content,
    image, // Placeholder for Cloudinary URL
  });

  // Emit Socket.IO event to both sender and recipient
  const io = req.app.get("socketio");
  const messagePayload = {
    _id: message._id,
    sender: {
      _id: sender,
      name: req.user.name,
      profilePicture: req.user.profilePicture,
    },
    recipient,
    content,
    image,
    createdAt: message.createdAt,
  };

  io.to(`user:${recipient}`).emit("newMessage", messagePayload);
  io.to(`user:${sender}`).emit("newMessage", messagePayload);

  res.status(201).json({
    status: "success",
    data: { message },
  });
});

exports.getMessages = catchAsync(async (req, res, next) => {
  const currentUser = req.user._id;
  const otherUser = req.params.userId;

  // Pagination
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  // Fetch messages between current user and other user
  const messages = await Message.find({
    $or: [
      { sender: currentUser, recipient: otherUser },
      { sender: otherUser, recipient: currentUser },
    ],
  })
    .sort("createdAt")
    .skip(skip)
    .limit(limit);

  const totalMessages = await Message.countDocuments({
    $or: [
      { sender: currentUser, recipient: otherUser },
      { sender: otherUser, recipient: currentUser },
    ],
  });

  res.status(200).json({
    status: "success",
    results: messages.length,
    total: totalMessages,
    totalPages: Math.ceil(totalMessages / limit),
    currentPage: page,
    data: { messages },
  });
});
