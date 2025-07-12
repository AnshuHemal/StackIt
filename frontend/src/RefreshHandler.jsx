import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

export const RefreshHandler = ({ setIsAuthenticated }) => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_AUTH_URL}/verify`,
          {
            withCredentials: true,
          }
        );

        if (response.data.success) {
          setIsAuthenticated(true);
          if (
            location.pathname === "/login" ||
            location.pathname === "/signup" ||
            location.pathname === "/home"
          ) {
            navigate("/", { replace: true });
          }
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        setIsAuthenticated(false);
      }
    };

    checkAuthentication();
  }, [location, navigate, setIsAuthenticated]);

  return null;
};
