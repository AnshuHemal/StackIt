import mongoose, { Schema } from "mongoose";

// User model
const UserSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: { type: String, required: true },
  name: { type: String, required: true },
  username: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  isverified: { type: Boolean, default: false },
  lastLogin: { type: Date, default: Date.now },
});

// OTP model
const OtpSchema = new Schema(
  {
    email: { type: String, required: true },
    code: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, expires: 300 },
  },
  { timestamps: true }
);

const QuestionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    tags: {
      type: [String],
      default: [],
    },
    answers: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "User" },
        content: String,
        votes: { type: Number, default: 0 },
        votesBy: [{ type: Schema.Types.ObjectId, ref: "User" }], // NEW
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export const User = mongoose.model("User", UserSchema);
export const Otp = mongoose.model("Otp", OtpSchema);
export const Question = mongoose.model("Question", QuestionSchema);
