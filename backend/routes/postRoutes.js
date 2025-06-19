const express = require("express");
const postController = require("../controllers/postController");
const authController = require("../controllers/authController");

const router = express.Router();

// Protect all routes
router.use(authController.protect);

// CRUD Routes
router.route("/create").post(postController.createPost);

router.route("/get").get(postController.getAllPosts);

router.route("/update/:id").patch(postController.updatePost);

router.route("/delete/:id").delete(postController.deletePost);

// Single Post Routes
router.route("/:id").get(postController.getPost);

// Like and Comment Routes
router.route("/:postId/like").post(postController.likePost);

router.route("/:postId/comment").post(postController.commentPost);

module.exports = router;
