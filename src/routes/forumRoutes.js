import express from "express";
import { body, query } from "express-validator";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  postQuestion,
  editQuestion,
  deleteQuestion,
  postReply,
  editReply,
  deleteReply,
  getQuestionWithReplies,
  getAllQuestionsWithReplies,
  toggleUpvoteQuestion,
  toggleUpvoteReply,
} from "../controllers/forumController.js";

const router = express.Router();

// ✅ Create question (junior only)
router.post(
  "/questions",
  authMiddleware,
  [body("title").notEmpty(), body("description").notEmpty()],
  postQuestion
);

// ✅ Edit / Delete question
router.put("/questions/:id", authMiddleware, editQuestion);
router.delete("/questions/:id", authMiddleware, deleteQuestion);

// ✅ Get questions
router.get("/questions", getAllQuestionsWithReplies);
router.get("/questions/:id", getQuestionWithReplies);

// ✅ Replies (⚡ fixed role logic)
router.post(
  "/questions/:questionId/replies",
  authMiddleware,
  [body("content").trim().notEmpty()],
  async (req, res, next) => {
    try {
      const { parentReply } = req.body;

      // If reply is to the question (no parentReply), only seniors can do this
      if (!parentReply && req.user.role !== "senior") {
        return res.status(403).json({ message: "Only seniors can reply directly to questions." });
      }

      // If reply is nested (has parentReply), allow any role
      next();
    } catch (err) {
      console.error("Role check failed:", err);
      res.status(500).json({ message: "Internal role validation error" });
    }
  },
  postReply
);

// ✅ Edit/Delete reply
router.put("/replies/:id", authMiddleware, editReply);
router.delete("/replies/:id", authMiddleware, deleteReply);

// ✅ Upvotes
router.post("/questions/:id/upvote", authMiddleware, toggleUpvoteQuestion);
router.post("/replies/:id/upvote", authMiddleware, toggleUpvoteReply);

export default router;
