import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import JoditEditor from "jodit-react";

const AskQuestions = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [userId, setUserId] = useState(null);

  const [input, setInput] = useState("");
  const [selectedSkills, setSelectedSkills] = useState([]);

  const navigate = useNavigate();
  const editor = useRef(null);

  const API_URL = import.meta.env.VITE_AUTH_URL;

  axios.defaults.withCredentials = true;

  // Fetch logged-in user ID
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await axios.get(`${API_URL}/current-user`, {
          withCredentials: true,
        });
        setUserId(res.data.user._id);
      } catch (error) {
        toast.error("Please login to ask a question.");
        navigate("/login");
      }
    };

    fetchCurrentUser();
  }, [navigate]);

  // Submit handler (optional if you're saving to backend)
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title || !description) {
      toast.error("Title and description are required.");
      return;
    }

    try {
      const res = await axios.post(
        `${API_URL}/ask-question`,
        {
          userId,
          title,
          description,
          tags: selectedSkills,
        },
        { withCredentials: true }
      );

      if (res.data.success) {
        toast.success("Question posted successfully!");
        navigate("/");
      }
    } catch (err) {
      toast.error("Failed to post question.");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const value = input.trim();
      if (value) {
        setSelectedSkills([...selectedSkills, value]);
        setInput("");
      }
    }
  };

  const removeSkill = (skillToRemove) => {
    setSelectedSkills(selectedSkills.filter((s) => s !== skillToRemove));
  };

  return (
    <div className="container my-4">
      <h3 className="text-center">
        Have any doubts? Post your question here..
      </h3>
      <p className="text-center">
        Our community has more than 10,000 talents who can solve your problem
        easily.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="modern-input mt-4">
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input-field"
            placeholder=" "
          />
          <label className="input-label">
            Write a title for your problem...
          </label>
        </div>

        <div className="mt-4">
          <label className="form-label fw-semibold mb-2">
            Description (rich text):
          </label>
          <JoditEditor
            ref={editor}
            value={description}
            tabIndex={1}
            onChange={(newContent) => setDescription(newContent)}
          />
        </div>

        {/* Tags */}
        <div className="mt-4">
          <div className="modern-input mt-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="input-field"
              placeholder=" "
            />
            <label className="input-label">
              Tags: (Type and press Enter...)
            </label>
          </div>

          <div className="selected-skills my-2">
            {selectedSkills.map((skill, index) => (
              <span key={index} className="skill-tag">
                {skill}
                <button
                  className="remove-btn"
                  type="button"
                  onClick={() => removeSkill(skill)}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="text-center mt-4">
          <button
            className="login-button border-0 px-5"
            style={{ fontSize: "16px" }}
            type="submit"
          >
            Post Question
          </button>
        </div>
      </form>
    </div>
  );
};

export default AskQuestions;
