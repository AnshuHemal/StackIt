import axios from "axios";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/worksyde.png";
import toast from "react-hot-toast";

const AdminHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const API_URL = "http://localhost:5000/api/auth";

  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `${API_URL}/logout`,
        {},
        { withCredentials: true }
      );
      if (response?.data?.success) {
        navigate("/");
        toast.success("Successfully Logged out..");
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  // Helper function to check active route
  const isActive = (path) => location.pathname.includes(path);

  return (
    <nav className="navbar navbar-expand-lg fixed-top">
      <div className="container-fluid">
        <Link className="navbar-brand me-auto" to="overview">
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
                    isActive("overview") ? "active" : ""
                  }`}
                  to="overview"
                >
                  Home
                </Link>
              </li>
              <li className="nav-item">
                <Link
                  className={`nav-link mx-lg-2 ${
                    isActive("freelancers") ? "active" : ""
                  }`}
                  to="freelancers"
                >
                  Freelancers
                </Link>
              </li>
              <li className="nav-item">
                <Link
                  className={`nav-link mx-lg-2 ${
                    isActive("clients") ? "active" : ""
                  }`}
                  to="clients"
                >
                  Clients
                </Link>
              </li>
              <li className="nav-item">
                <Link
                  className={`nav-link mx-lg-2 ${
                    isActive("requests") ? "active" : ""
                  }`}
                  to="requests"
                >
                  Requests
                </Link>
              </li>
              <li className="nav-item">
                <Link
                  className={`nav-link mx-lg-2 ${
                    isActive("specialities") ? "active" : ""
                  }`}
                  to="specialities"
                >
                  Specialities
                </Link>
              </li>
              <li className="nav-item">
                <Link
                  className={`nav-link mx-lg-2 ${
                    isActive("skills") ? "active" : ""
                  }`}
                  to="skills"
                >
                  Skills
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <button className="post-button me-3" onClick={handleLogout}>
          Logout
        </button>

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

export default AdminHeader;
