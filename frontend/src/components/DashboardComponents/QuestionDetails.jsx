import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import JoditEditor from "jodit-react";
import toast from "react-hot-toast";

const QuestionDetails = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [question, setQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const [answer, setAnswer] = useState("");
  const [editingAnswerId, setEditingAnswerId] = useState(null);

  const editor = useRef(null);
  const API_URL = import.meta.env.VITE_AUTH_URL;

  axios.defaults.withCredentials = true;

  // Fetch question
  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        const res = await axios.get(`${API_URL}/question/${slug}`);
        if (res.data.success) {
          setQuestion(res.data.data);
        } else {
          setQuestion(null);
        }
      } catch (err) {
        console.error("Failed to fetch question:", err);
        setQuestion(null);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestion();
  }, [slug]);

  // Fetch user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(`${API_URL}/current-user`);
        setUser(res.data.user);
      } catch (error) {
        setUser(null);
      }
    };

    fetchUser();
  }, []);

  const fetchAnswers = async () => {
    try {
      const res = await axios.get(`${API_URL}/answers/${question._id}`);
      if (res.data.success) {
        setAnswers(res.data.answers);

        const existing = res.data.answers.find(
          (a) => a.userId?._id === user?._id
        );

        if (existing) {
          setAnswer(existing.content);
          setEditingAnswerId(existing._id);
        }
      }
    } catch (err) {
      console.error("Failed to fetch answers", err);
    }
  };

  useEffect(() => {
    if (question?._id) {
      fetchAnswers();
    }
  }, [question]);

  const handleSubmitAnswer = async () => {
    if (!answer || answer.trim() === "") {
      toast.error("Answer cannot be empty.");
      return;
    }

    try {
      const res = await axios.post(`${API_URL}/answer`, {
        questionId: question._id,
        userId: user._id,
        answer,
      });

      if (res.data.success) {
        toast.success("Answer saved!");
        setAnswer("");
        setEditingAnswerId(null);
        fetchAnswers();
      }
    } catch (error) {
      toast.error("Failed to save answer.");
    }
  };

  const handleUpvote = async (answerId) => {
    if (!user) {
      toast.error("Please login to vote.");
      navigate("/login");
      return;
    }

    try {
      const res = await axios.post(`${API_URL}/vote-answer`, {
        questionId: question._id,
        answerId,
        userId: user._id,
      });

      if (res.data.success) {
        fetchAnswers();
      } else {
        toast.error(res.data.message || "Already voted");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Vote failed");
    }
  };

  if (loading) return <div className="text-center mt-5">Loading...</div>;
  if (!question)
    return (
      <div className="text-center mt-5 text-danger">Question not found.</div>
    );

  return (
    <>
      <div className="container">
        <p>
          <span
            role="button"
            style={{
              cursor: "pointer",
              textDecoration: "none",
              color: "#007476",
            }}
            onClick={() => navigate("/")}
          >
            Questions
          </span>{" "}
          &gt; {question.title}
        </p>
      </div>
      <div className="container mt-4">
        <h3>{question.title}</h3>

        <div
          className="my-3"
          dangerouslySetInnerHTML={{ __html: question.description }}
        ></div>

        <div className="mt-3">
          <strong>Tags:</strong>{" "}
          {question.tags.map((tag, index) => (
            <span key={index} className="badge login-button me-2">
              {tag}
            </span>
          ))}
        </div>

        <div className="text-muted mt-3 mb-5">
          Asked by {question.userId?.username || "Unknown"} on{" "}
          {new Date(question.createdAt).toLocaleString()}
        </div>

        {/* Answer List */}
        <h5 className="mb-3">Answers ({answers.length})</h5>
        {answers.length === 0 ? (
          <p>No answers yet. Be the first to answer!</p>
        ) : (
          answers.map((ans, index) => {
            const alreadyVoted = ans.votesBy?.includes(user?._id);

            return (
              <div key={index} className="card p-3 mb-3">
                <div
                  className="answer-content"
                  dangerouslySetInnerHTML={{ __html: ans.content }}
                ></div>

                <div className="d-flex justify-content-between align-items-center mt-3">
                  <small className="text-muted">
                    Answered by {ans.userId?.username || "Anonymous"} on{" "}
                    {new Date(ans.createdAt).toLocaleString()}
                  </small>

                  <button
                    className={`btn btn-sm ${
                      alreadyVoted ? "btn-secondary" : "btn-outline-primary"
                    }`}
                    onClick={() => handleUpvote(ans._id)}
                    disabled={alreadyVoted}
                  >
                    👍 {ans.votes} {alreadyVoted ? "(Voted)" : ""}
                  </button>
                </div>
              </div>
            );
          })
        )}

        {/* Answer Editor */}
        <h5 className="mt-5 mb-2">
          {editingAnswerId ? "Edit your answer:" : "Write your answer:"}
        </h5>
        <JoditEditor
          ref={editor}
          value={answer}
          tabIndex={1}
          onChange={(newContent) => setAnswer(newContent)}
        />

        {editingAnswerId && (
          <div className="text-end mt-2 d-flex gap-3">
            <button
              className="post-button"
              onClick={() => {
                setEditingAnswerId(null);
                setAnswer("");
              }}
            >
              Cancel Edit
            </button>
          </div>
        )}

        <div className="text-center my-3">
          <button
            className="login-button border-0 px-5"
            onClick={handleSubmitAnswer}
            disabled={!user}
            style={{ fontSize: "16px" }}
          >
            {user
              ? editingAnswerId
                ? "Update Answer"
                : "Submit Answer"
              : "Login to answer"}
          </button>
        </div>
      </div>
    </>
  );
};

export default QuestionDetails;
