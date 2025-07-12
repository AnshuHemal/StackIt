import axios from "axios";
import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FiFilter } from "react-icons/fi";
import debounce from "lodash.debounce";

const Overview = () => {
  const [questions, setQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("Newest");
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  const API_URL = import.meta.env.VITE_AUTH_URL;
  const navigate = useNavigate();

  axios.defaults.withCredentials = true;

  const slugify = (title) => title.toLowerCase().split(" ").join("-");

  // Fetch questions
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await axios.get(`${API_URL}/questions`);
        if (res.data.success) {
          setQuestions(res.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch questions:", error);
      }
    };
    fetchQuestions();
  }, []);

  // Highlight search matches
  const highlightMatch = (text, query) => {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, "gi");
    const parts = text.split(regex);

    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={index} style={{ backgroundColor: "#fff3cd" }}>
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  // Debounced search
  const debouncedSearch = useMemo(
    () =>
      debounce((query) => {
        setSearchQuery(query);
      }, 300),
    []
  );

  const handleSearchChange = (e) => {
    debouncedSearch(e.target.value);
  };

  // Apply filters
  useEffect(() => {
    let filtered = [...questions];

    if (searchQuery.trim()) {
      filtered = filtered.filter((q) =>
        q.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    switch (filterType) {
      case "Unanswered":
        filtered = filtered.filter((q) => !q.answers || q.answers.length === 0);
        break;
      case "Most Answered":
        filtered.sort(
          (a, b) => (b.answers?.length || 0) - (a.answers?.length || 0)
        );
        break;
      case "Oldest":
        filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case "Title A-Z":
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "Title Z-A":
        filtered.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case "Newest":
      default:
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
    }

    setFilteredQuestions(filtered);
  }, [questions, searchQuery, filterType]);

  return (
    <div className="container mt-4">
      <h3 className="mb-4">Latest Questions</h3>

      {/* Search + Filter UI */}
      <div className="search-filter-row d-flex flex-wrap gap-2 mb-3 align-items-center">
        <input
          type="text"
          className="form-control"
          placeholder="Search by question title..."
          onChange={handleSearchChange}
        />

        {/* Desktop Filter */}
        <select
          className="form-select d-none d-md-block"
          style={{ maxWidth: "220px" }}
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="Newest">Newest</option>
          <option value="Oldest">Oldest</option>
          <option value="Unanswered">Unanswered Questions</option>
          <option value="Most Answered">Most Answered</option>
          <option value="Title A-Z">Title A-Z</option>
          <option value="Title Z-A">Title Z-A</option>
        </select>

        {/* Mobile Filter Toggle */}
        <div className="d-block d-md-none ms-auto">
          <button
            className="btn btn-outline-secondary"
            onClick={() => setShowMobileFilter(!showMobileFilter)}
          >
            <FiFilter />
          </button>

          {showMobileFilter && (
            <div className="mt-2">
              <select
                className="form-select"
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value);
                  setShowMobileFilter(false);
                }}
              >
                <option value="Newest">Newest</option>
                <option value="Oldest">Oldest</option>
                <option value="Unanswered">Unanswered Questions</option>
                <option value="Most Answered">Most Answered</option>
                <option value="Title A-Z">Title A-Z</option>
                <option value="Title Z-A">Title Z-A</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      {filteredQuestions.length === 0 ? (
        <div className="alert alert-warning">
          No questions found matching{" "}
          <strong>"{searchQuery.trim() || "your criteria"}"</strong>
        </div>
      ) : (
        <ul className="list-group">
          {filteredQuestions.map((question) => (
            <li
              key={question._id}
              className="list-group-item shadow-sm rounded mb-3"
              onClick={() => navigate(`/questions/${slugify(question.title)}`)}
              style={{ cursor: "pointer" }}
            >
              <div className="py-2">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">
                    {highlightMatch(question.title, searchQuery)}
                  </h5>
                  <span className="badge login-button text-white">
                    {question.answers?.length || 0} Answer
                    {question.answers?.length === 1 ? "" : "s"}
                  </span>
                </div>

                <p
                  className="mt-2"
                  dangerouslySetInnerHTML={{
                    __html: question.description.slice(0, 150) + "...",
                  }}
                ></p>

                <small className="text-muted">
                  Asked by {question.userId?.username || "Unknown"} •{" "}
                  {new Date(question.createdAt).toLocaleString()}
                </small>

                <div className="mt-2">
                  Tags:{" "}
                  {question.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="badge login-button me-2"
                      style={{
                        fontSize: "14px",
                        backgroundColor: "#eee",
                        color: "#333",
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Overview;
