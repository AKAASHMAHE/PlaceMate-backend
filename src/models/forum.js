import mongoose from "mongoose";

const { Schema } = mongoose;

const forumQuestionSchema = new Schema({
  askedBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  tags: [{ type: String, lowercase: true, trim: true }],
  upvotes: [{ type: Schema.Types.ObjectId, ref: "User" }],
  editedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

const forumReplySchema = new Schema({
  question: {
    type: Schema.Types.ObjectId,
    ref: "ForumQuestion",
    required: true,
  },
  repliedBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  parentReply: {
    type: Schema.Types.ObjectId,
    ref: "ForumReply", // 🔥 for nested replies
    default: null,
  },
  content: { type: String, required: true },
  upvotes: [{ type: Schema.Types.ObjectId, ref: "User" }],
  editedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

// Text index for search
forumQuestionSchema.index({ title: "text", description: "text", tags: "text" });

const ForumQuestion = mongoose.model("ForumQuestion", forumQuestionSchema);
const ForumReply = mongoose.model("ForumReply", forumReplySchema);

export { ForumQuestion, ForumReply };
export default { ForumQuestion, ForumReply };
