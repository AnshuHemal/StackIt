import { Otp, Question, User } from "../models/user.model.js";
import bcrypt from "bcrypt";
import { generateTokenAndSetCookie } from "../utils/generateTokenAndSetCookie.js";
import jwt from "jsonwebtoken";
import { sendOTPEmail } from "../utils/sendEmail.js";

// Sign Up
export const signup = async (req, res) => {
  const { fullname, email, password, username } = req.body;

  try {
    const userAlreadyExists = await User.findOne({ email });
    if (userAlreadyExists) {
      return res
        .status(400)
        .json({ success: false, message: "Account already exists.." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      email,
      password: hashedPassword,
      name: fullname,
      username: username,
      isverified: true,
    });

    generateTokenAndSetCookie(res, user._id);
    await user.save();

    res.status(201).json({
      success: true,
      message: "Account successfully created..",
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Login
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Credentials" });
    }

    generateTokenAndSetCookie(res, user._id);

    user.lastLogin = new Date();
    await user.save();

    res.status(200).json({
      success: true,
      message: "Successfully Logged In",
      user: {
        ...user._doc,
        password: undefined,
      },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Logout
export const logout = async (req, res) => {
  res.clearCookie("access_token");
  res.status(200).json({
    success: true,
    message: "Successfully Logged out..",
  });
};

// Verify Token
export const verifyToken = (req, res, next) => {
  const token = req.cookies.access_token;

  if (!token) {
    return res.status(403).json({ message: "Authentication required." });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: "Invalid token." });
    }
    req.user = decoded;
    next();
  });
};

// Get Current User
export const currentUser = async (req, res) => {
  const token = req.cookies.access_token;

  if (!token) {
    return res.status(403).json({ message: "Authentication required." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    User.findById(userId)
      .then((user) => {
        if (!user) {
          return res.status(404).json({ message: "User not found." });
        }
        return res.status(200).json({
          success: true,
          message: "User fetched..",
          user: {
            ...user._doc,
            password: undefined,
          },
        });
      })
      .catch((err) => res.status(500).json({ message: err.message }));
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error: " + error.message });
  }
};

// Send OTP
export const sendOTP = async (req, res) => {
  const { email } = req.body;

  try {
    const userAlreadyExists = await User.findOne({ email });

    if (userAlreadyExists) {
      return res
        .status(400)
        .json({ success: false, message: "Account already exists.." });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    await Otp.create({ email, code: otpCode });
    await sendOTPEmail(email, otpCode);

    res.status(201).json({
      success: true,
      message: "OTP sent to your email..",
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Verify OTP
export const verifyOTP = async (req, res) => {
  const { email, code } = req.body;
  try {
    const otpRecord = await Otp.findOne({ email, code });

    if (!otpRecord) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired OTP" });
    }

    await Otp.deleteOne({ email });

    res.json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "OTP verification failed",
      error: error.message,
    });
  }
};

export const askQuestion = async (req, res) => {
  try {
    const { userId, title, description, tags } = req.body;

    if (!userId || !title || !description) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields.",
      });
    }

    const newQuestion = await Question.create({
      userId,
      title,
      description,
      tags,
    });

    return res.status(201).json({
      success: true,
      message: "Question created successfully.",
      question: newQuestion,
    });
  } catch (error) {
    console.error("Ask Question Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};

export const getLatestQuestions = async (req, res) => {
  try {
    const questions = await Question.find()
      .sort({ createdAt: -1 }) // ✅ Latest first
      .populate("userId", "username email"); // Optional: populate user info

    res.status(200).json({
      success: true,
      data: questions,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch questions.",
    });
  }
};

export const getQuestionDetail = async (req, res) => {
  const { slug } = req.params;

  try {
    const questions = await Question.find().populate("userId");

    const matched = questions.find(
      (q) => q.title.toLowerCase().split(" ").join("-") === slug
    );

    if (!matched) {
      return res
        .status(404)
        .json({ success: false, message: "Question not found" });
    }

    res.json({ success: true, data: matched });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// POST /api/answer
export const postAnswerOfQuestion = async (req, res) => {
  try {
    const { questionId, userId, answer } = req.body;

    const question = await Question.findById(questionId);
    if (!question)
      return res
        .status(404)
        .json({ success: false, message: "Question not found" });

    const existing = question.answers.find(
      (a) => a.userId.toString() === userId.toString()
    );

    if (existing) {
      // Update
      existing.content = answer;
      existing.createdAt = new Date();
    } else {
      // Add new
      question.answers.push({ userId, content: answer });
    }

    await question.save();
    res.status(200).json({ success: true, message: "Answer saved" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/vote-answer
export const voteAnswer = async (req, res) => {
  try {
    const { questionId, answerId, userId } = req.body;

    const question = await Question.findById(questionId);
    if (!question)
      return res
        .status(404)
        .json({ success: false, message: "Question not found" });

    const answer = question.answers.id(answerId);
    if (!answer)
      return res
        .status(404)
        .json({ success: false, message: "Answer not found" });

    if (answer.votesBy.includes(userId)) {
      return res.status(400).json({ success: false, message: "Already voted" });
    }

    answer.votes += 1;
    answer.votesBy.push(userId);

    await question.save();
    res.status(200).json({ success: true, message: "Voted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/answers/:questionId
export const getAnswerOfQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.questionId).populate(
      "answers.userId",
      "username"
    );
    if (!question)
      return res
        .status(404)
        .json({ success: false, message: "Question not found" });

    res.json({ success: true, answers: question.answers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
