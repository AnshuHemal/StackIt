import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/worksyde.png";
import { BsBell } from "react-icons/bs";
import { FiLogOut } from "react-icons/fi";
import axios from "axios";
import toast from "react-hot-toast";

const Header2 = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const [user, setUser] = useState(null); 
  const API_URL = "http://localhost:5000/api/auth";

  const toggleDropdown = () => setShowDropdown((prev) => !prev);

  // Fetch current user status
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await axios.get(`${API_URL}/current-user`, {
          withCredentials: true,
        });

        if (res.data?.success && res.data?.user) {
          setUser(res.data.user);
        } else {
          setUser(false);
        }
      } catch (error) {
        setUser(false);
      }
    };

    fetchCurrentUser();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        `${API_URL}/logout`,
        {},
        { withCredentials: true }
      );

      if (response?.data?.success) {
        setUser(false);
        navigate("/");
        toast.success("Successfully Logged out.");
      }
    } catch (error) {
      console.log(error);
      toast.error("Logout failed. Please try again.");
    }
  };

  if (user === null) return null; 

  return (
    <nav className="navbar navbar-expand-lg fixed-top shadow-sm">
      <div className="container-fluid">
        <Link className="navbar-brand me-auto" to={"/"}>
          <img src={logo} alt="Worksyde Logo" height={40} />
        </Link>

        <div
          className="offcanvas offcanvas-end"
          tabIndex="-1"
          id="offcanvasNavbar"
          aria-labelledby="offcanvasNavbarLabel"
        >
          <div className="offcanvas-header">
            <h5 className="offcanvas-title" id="offcanvasNavbarLabel">
              <img src={logo} alt="Worksyde Logo" height={40} />
            </h5>
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="offcanvas"
              aria-label="Close"
            ></button>
          </div>
          <div className="offcanvas-body">
            <ul className="navbar-nav justify-content-center flex-grow-1 pe-3">
              <li className="nav-item">
                <Link
                  className={`nav-link mx-lg-2 ${
                    location.pathname === "/" ? "active" : ""
                  }`}
                  to={"/"}
                >
                  Home
                </Link>
              </li>
              <li className="nav-item">
                <span
                  className={`nav-link mx-lg-2 ${
                    location.pathname === "/questions/ask" ? "active" : ""
                  }`}
                  role="button"
                  style={{ cursor: "pointer" }}
                  onClick={() => {
                    if (!user) {
                      toast.error("Please login to ask a question.");
                      return;
                    }
                    navigate("/questions/ask");
                  }}
                >
                  Ask Questions
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="d-flex align-items-center gap-4 me-3">
          <BsBell className="icon-hover" size={20} />

          {/* Profile Image */}
          <img
            src={logo}
            alt="Profile"
            className="rounded-circle"
            height={32}
            width={32}
            style={{ objectFit: "cover", cursor: "pointer" }}
            onClick={toggleDropdown}
          />

          {/* Dropdown */}
          {showDropdown && (
            <div ref={dropdownRef} className="profile-dropdown shadow-sm">
              <div className="profile-header d-flex align-items-center gap-3">
                <img
                  src={logo}
                  className="rounded-circle"
                  height={40}
                  width={40}
                />
                <div>
                  <div>
                    <div className="text-muted" style={{ fontSize: "18px" }}>
                      {user ? user.username : "User4548"}
                    </div>
                    <div className="text-muted" style={{ fontSize: "14px" }}>
                      {user ? user.email : "Guest User"}
                    </div>
                  </div>
                </div>
              </div>

              {user ? (
                <a className="dropdown-item text-danger" onClick={handleLogout}>
                  <FiLogOut className="me-2 logout-icon" />
                  Log out
                </a>
              ) : (
                <Link className="dropdown-item" to="/login">
                  Login / Signup
                </Link>
              )}
            </div>
          )}
        </div>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="offcanvas"
          data-bs-target="#offcanvasNavbar"
          aria-controls="offcanvasNavbar"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
      </div>
    </nav>
  );
};

export default Header2;
