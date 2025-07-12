import axios from "axios";
import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FiFilter } from "react-icons/fi";
import debounce from "lodash.debounce";

const QUESTIONS_PER_PAGE = 5;

const Overview = () => {
  const [questions, setQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("Newest");
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const API_URL = import.meta.env.VITE_AUTH_URL;
  const navigate = useNavigate();

  axios.defaults.withCredentials = true;

  const slugify = (title) => title.toLowerCase().split(" ").join("-");

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

  const debouncedSearch = useMemo(
    () =>
      debounce((query) => {
        setSearchQuery(query);
        setCurrentPage(1); // Reset page on new search
      }, 300),
    []
  );

  const handleSearchChange = (e) => {
    debouncedSearch(e.target.value);
  };

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
    setCurrentPage(1); // Reset page on filter change
  }, [questions, searchQuery, filterType]);

  // Pagination logic
  const totalPages = Math.ceil(filteredQuestions.length / QUESTIONS_PER_PAGE);
  const startIndex = (currentPage - 1) * QUESTIONS_PER_PAGE;
  const currentQuestions = filteredQuestions.slice(
    startIndex,
    startIndex + QUESTIONS_PER_PAGE
  );

  return (
    <div className="container mt-4">
      <h3 className="mb-4">Latest Questions</h3>

      {/* Search + Filter UI */}
      <div className="row g-2 align-items-center mb-3">
        {/* Search Input */}
        <div className="col-9">
          <input
            type="text"
            className="form-control"
            placeholder="Search by question title..."
            onChange={handleSearchChange}
          />
        </div>

        {/* Desktop Filter Dropdown */}
        <div className="col-3 d-none d-md-block flex-grow-1">
          <select
            className="form-select"
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
        </div>

        {/* Mobile Filter Button */}
        <div className="col-3 d-block d-md-none text-end">
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
      {currentQuestions.length === 0 ? (
        <div className="alert alert-warning">
          No questions found matching{" "}
          <strong>"{searchQuery.trim() || "your criteria"}"</strong>
        </div>
      ) : (
        <>
          <ul className="list-group">
            {currentQuestions.map((question) => (
              <li
                key={question._id}
                className="list-group-item shadow-sm rounded mb-3"
                onClick={() =>
                  navigate(`/questions/${slugify(question.title)}`)
                }
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-center align-items-center mt-4">
              <nav>
                <ul className="pagination">
                  <li
                    className={`page-item ${currentPage === 1 && "disabled"}`}
                  >
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage((prev) => prev - 1)}
                      disabled={currentPage === 1}
                    >
                      Prev
                    </button>
                  </li>

                  {Array.from({ length: totalPages }, (_, i) => (
                    <li
                      key={i}
                      className={`page-item ${
                        currentPage === i + 1 ? "active" : ""
                      }`}
                    >
                      <button
                        className="page-link"
                        onClick={() => setCurrentPage(i + 1)}
                      >
                        {i + 1}
                      </button>
                    </li>
                  ))}

                  <li
                    className={`page-item ${
                      currentPage === totalPages && "disabled"
                    }`}
                  >
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage((prev) => prev + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Overview;
