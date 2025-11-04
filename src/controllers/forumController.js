import { ForumQuestion, ForumReply } from "../models/forum.js";
import { validationResult } from "express-validator";

// ✅ Create a new question
export const postQuestion = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { title, description, tags } = req.body;
    const question = await ForumQuestion.create({
      askedBy: req.user._id,
      title,
      description,
      tags,
    });

    res.status(201).json(question);
  } catch (err) {
    console.error("Error posting question:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Edit question
export const editQuestion = async (req, res) => {
  try {
    const question = await ForumQuestion.findById(req.params.id);
    if (!question) return res.status(404).json({ message: "Not found" });

    if (question.askedBy.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Unauthorized" });

    Object.assign(question, req.body, { editedAt: new Date() });
    await question.save();
    res.json(question);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Delete question
export const deleteQuestion = async (req, res) => {
  try {
    const question = await ForumQuestion.findById(req.params.id);
    if (!question) return res.status(404).json({ message: "Not found" });

    if (question.askedBy.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Unauthorized" });

    await ForumReply.deleteMany({ question: question._id });
    await question.deleteOne();
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Get all questions (search + pagination)
export const getAllQuestionsWithReplies = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, tag } = req.query;
    const query = {};

    if (search?.trim()) query.$text = { $search: search.trim() };
    if (tag?.trim()) query.tags = tag.toLowerCase();

    const questions = await ForumQuestion.find(query)
      .populate("askedBy", "name picture")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const count = await ForumQuestion.countDocuments(query);

    res.json({
      questions,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
    });
  } catch (err) {
    console.error("❌ Error fetching forum questions:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Get a single question + nested replies
export const getQuestionWithReplies = async (req, res) => {
  try {
    const question = await ForumQuestion.findById(req.params.id)
      .populate("askedBy", "name email");

    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    const replies = await ForumReply.find({ question: question._id })
      .populate("repliedBy", "name email role")
      .sort({ createdAt: 1 });

    // Build nested tree
    const replyMap = {};
    replies.forEach((r) => {
      replyMap[r._id] = { ...r.toObject(), children: [] };
    });

    const rootReplies = [];
    replies.forEach((r) => {
      if (r.parentReply) {
        replyMap[r.parentReply]?.children.push(replyMap[r._id]);
      } else {
        rootReplies.push(replyMap[r._id]);
      }
    });

    res.json({ question, replies: rootReplies });
  } catch (err) {
    console.error("Error fetching question:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Post reply (🔥 everyone can reply anywhere)
export const postReply = async (req, res) => {
  try {
    const { questionId } = req.params;
    const { content, parentReply } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({ message: "Reply content required" });
    }

    const reply = await ForumReply.create({
      question: questionId,
      repliedBy: req.user._id,
      content,
      parentReply: parentReply || null,
    });

    res.status(201).json({ message: "Reply posted successfully", reply });
  } catch (err) {
    console.error("Error posting reply:", err);
    res.status(500).json({ message: "Server error posting reply" });
  }
};

// ✅ Edit reply
export const editReply = async (req, res) => {
  try {
    const reply = await ForumReply.findById(req.params.id);
    if (!reply) return res.status(404).json({ message: "Not found" });

    if (reply.repliedBy.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Unauthorized" });

    Object.assign(reply, req.body, { editedAt: new Date() });
    await reply.save();
    res.json(reply);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Delete reply
export const deleteReply = async (req, res) => {
  try {
    const reply = await ForumReply.findById(req.params.id);
    if (!reply) return res.status(404).json({ message: "Not found" });

    if (reply.repliedBy.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Unauthorized" });

    await reply.deleteOne();
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Toggle upvote for question
export const toggleUpvoteQuestion = async (req, res) => {
  try {
    const question = await ForumQuestion.findById(req.params.id);
    if (!question) return res.status(404).json({ message: "Not found" });

    const index = question.upvotes.indexOf(req.user._id);
    if (index === -1) question.upvotes.push(req.user._id);
    else question.upvotes.splice(index, 1);

    await question.save();
    res.json({ upvotes: question.upvotes.length });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Toggle upvote for reply
export const toggleUpvoteReply = async (req, res) => {
  try {
    const reply = await ForumReply.findById(req.params.id);
    if (!reply) return res.status(404).json({ message: "Not found" });

    const index = reply.upvotes.indexOf(req.user._id);
    if (index === -1) reply.upvotes.push(req.user._id);
    else reply.upvotes.splice(index, 1);

    await reply.save();
    res.json({ upvotes: reply.upvotes.length });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
