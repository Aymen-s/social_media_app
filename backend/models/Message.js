const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "A message must have a sender"],
    },
    recipient: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "A message must have a recipient"],
    },
    content: {
      type: String,
      trim: true,
      maxlength: [1000, "A message cannot exceed 1000 characters"],
    },
    image: {
      type: String,
      default: null, // Placeholder for Cloudinary URL
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Ensure at least one of content or image is provided
messageSchema.pre("save", function (next) {
  if (!this.content && !this.image) {
    return next(new Error("A message must have content or an image"));
  }
  next();
});

// Indexes for faster queries
messageSchema.index({ sender: 1, recipient: 1, createdAt: -1 });

// Populate sender and recipient details
messageSchema.pre(/^find/, function (next) {
  this.populate({
    path: "sender",
    select: "name profilePicture",
  }).populate({
    path: "recipient",
    select: "name profilePicture",
  });
  next();
});

const Message = mongoose.model("Message", messageSchema);

module.exports = Message;
