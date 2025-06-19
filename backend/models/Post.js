const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "A post must belong to a user"],
    },
    content: {
      type: String,
      required: [true, "A post must have content"],
      trim: true,
      maxlength: [500, "A post cannot exceed 500 characters"],
    },
    image: {
      type: String,
      default: null,
    },
    likes: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "User",
      },
    ],
    comments: [
      {
        user: {
          type: mongoose.Schema.ObjectId,
          ref: "User",
          required: [true, "A comment must belong to a user"],
        },
        text: {
          type: String,
          required: [true, "A comment must have text"],
          trim: true,
          maxlength: [200, "A comment cannot exceed 200 characters"],
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
      select: false,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
postSchema.index({ user: 1, createdAt: -1 });

// Populate user fields in posts and comments
postSchema.pre(/^find/, function (next) {
  this.populate({
    path: "user",
    select: "name profilePicture",
  }).populate({
    path: "comments.user",
    select: "name profilePicture",
  });
  next();
});

const Post = mongoose.model("Post", postSchema);

module.exports = Post;
