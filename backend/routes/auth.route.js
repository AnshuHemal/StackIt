import express from "express";
import {
  askQuestion,
  currentUser,
  getAnswerOfQuestion,
  getLatestQuestions,
  getQuestionDetail,
  login,
  logout,
  postAnswerOfQuestion,
  sendOTP,
  signup,
  verifyOTP,
  verifyToken,
  voteAnswer,
} from "../controllers/auth.controller.js";
import { Question } from "../models/user.model.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);

router.get("/verify", verifyToken, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Token is valid, user is authenticated",
  });
});

router.get("/current-user", verifyToken, currentUser);
router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP);

router.post("/ask-question", askQuestion);
router.get("/questions", getLatestQuestions);
router.get("/question/:slug", getQuestionDetail);
router.post("/answer", postAnswerOfQuestion);
router.get("/answers/:questionId", getAnswerOfQuestion);
router.post("/vote-answer", voteAnswer);

router.put("/update-answer/:answerId", async (req, res) => {
  const { answerId } = req.params;
  const { answer } = req.body;

  try {
    const question = await Question.findOne({ "answers._id": answerId });
    const existingAnswer = question.answers.id(answerId);
    existingAnswer.content = answer;
    await question.save();

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
