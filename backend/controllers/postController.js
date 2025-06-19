const Post = require("../models/Post");
const factory = require("./handlerFactory");
const catchAsync = require("../config/catchAsync");
const AppError = require("../config/appError");

// Validate URL (optional, for safety)
const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Create a post
exports.createPost = catchAsync(async (req, res, next) => {
  const { content, image } = req.body;

  if (!content) {
    return next(new AppError("A post must have content", 400));
  }

  if (image && !isValidUrl(image)) {
    return next(new AppError("Invalid image URL", 400));
  }

  const post = await Post.create({
    user: req.user._id,
    content,
    image: image || null,
  });

  res.status(201).json({
    status: "success",
    data: {
      post,
    },
  });
});

// Get a post
exports.getPost = factory.getOne(Post);

// Get all posts
exports.getAllPosts = factory.getAll(Post);

// Update a post
exports.updatePost = catchAsync(async (req, res, next) => {
  const { content, image } = req.body;

  if (image && !isValidUrl(image)) {
    return next(new AppError("Invalid image URL", 400));
  }

  const post = await Post.findById(req.params.id);
  if (!post) {
    return next(new AppError("No post found with that ID", 404));
  }

  // Ensure the user can only update their own posts
  console.log("Post user ID:", post.user.toString());
  console.log("Request user ID:", req.user._id.toString());
  if (post.user._id.toString() !== req.user._id.toString()) {
    return next(new AppError("You can only update your own posts", 403));
  }

  const updatedPost = await Post.findByIdAndUpdate(
    req.params.id,
    { content, image: image || null, updatedAt: Date.now() },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    status: "success",
    data: {
      post: updatedPost,
    },
  });
});

// Delete a post
exports.deletePost = factory.deleteOne(Post);

// Like a post
exports.likePost = catchAsync(async (req, res, next) => {
  const post = await Post.findById(req.params.postId);
  if (!post) {
    return next(new AppError("No post found with that ID", 404));
  }

  const userId = req.user._id;
  if (post.likes.includes(userId)) {
    // Unlike post
    post.likes = post.likes.filter((id) => id.toString() !== userId.toString());
  } else {
    // Like post
    post.likes.push(userId);
  }

  await post.save();

  res.status(200).json({
    status: "success",
    data: {
      post,
    },
  });
});

// Add a comment to a post
exports.commentPost = catchAsync(async (req, res, next) => {
  const { text } = req.body;
  if (!text) {
    return next(new AppError("Comment text is required", 400));
  }

  const post = await Post.findById(req.params.postId);
  if (!post) {
    return next(new AppError("No post found with that ID", 404));
  }

  post.comments.push({
    user: req.user._id,
    text,
  });

  await post.save();

  res.status(201).json({
    status: "success",
    data: {
      post,
    },
  });
});
