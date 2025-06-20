const User = require("../models/User");
const AppError = require("../config/appError");
const catchAsync = require("../config/catchAsync");
const { deleteOne, updateOne, getOne, getAll } = require("./handlerFactory");

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        "This route is not for password updates. Please use /updateMyPassword",
        400
      )
    );
  }

  // 2) Filtered out unwanted field names that are not allowed to be updated
  const filteredBody = filterObj(req.body, "name", "email", "profilePicture");

  // 3) Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: "success",
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: "success",
    data: null,
  });
});

exports.createUser = (req, res) => {
  res.status(500).json({
    status: "error",
    message: "This route is not yet defined! Please use /signup instead!",
  });
};

exports.followUser = catchAsync(async (req, res, next) => {
  const userIdToFollow = req.params.userId;
  const currentUserId = req.user._id;

  // Prevent following self
  if (userIdToFollow === currentUserId.toString()) {
    return next(new AppError("You cannot follow yourself", 400));
  }

  // Find both users
  const userToFollow = await User.findById(userIdToFollow);
  const currentUser = await User.findById(currentUserId);

  if (!userToFollow) {
    return next(new AppError("User to follow not found", 404));
  }

  // Check if already following
  if (currentUser.following.includes(userIdToFollow)) {
    return next(new AppError("You are already following this user", 400));
  }

  // Update both users
  currentUser.following.push(userIdToFollow);
  userToFollow.followers.push(currentUserId);

  await currentUser.save({ validateBeforeSave: false });
  await userToFollow.save({ validateBeforeSave: false });

  res.status(200).json({
    status: "success",
    message: `You are now following ${userToFollow.name}`,
  });
});

exports.unfollowUser = catchAsync(async (req, res, next) => {
  const userIdToUnfollow = req.params.userId;
  const currentUserId = req.user._id;

  // Prevent unfollowing self
  if (userIdToUnfollow === currentUserId.toString()) {
    return next(new AppError("You cannot unfollow yourself", 400));
  }

  // Find both users
  const userToUnfollow = await User.findById(userIdToUnfollow);
  const currentUser = await User.findById(currentUserId);

  if (!userToUnfollow) {
    return next(new AppError("User to unfollow not found", 404));
  }

  // Check if not following
  if (!currentUser.following.includes(userIdToUnfollow)) {
    return next(new AppError("You are not following this user", 400));
  }

  // Update both users
  currentUser.following = currentUser.following.filter(
    (id) => id.toString() !== userIdToUnfollow
  );
  userToUnfollow.followers = userToUnfollow.followers.filter(
    (id) => id.toString() !== currentUserId
  );

  await currentUser.save({ validateBeforeSave: false });
  await userToUnfollow.save({ validateBeforeSave: false });

  res.status(200).json({
    status: "success",
    message: `You have unfollowed ${userToUnfollow.name}`,
  });
});

exports.getAllUsers = getAll(User);
exports.getUser = getOne(User, "followers following");
exports.updateUser = updateOne(User);
exports.deleteUser = deleteOne(User);
