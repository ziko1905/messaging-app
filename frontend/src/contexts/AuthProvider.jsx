import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "./AuthContext";
import { config } from "../Constants";
import customFetch from "../utils/customFetch";

function AuthProvider({ children }) {
  const [user, setUser] = useState();
  const [token, setToken] = useState(localStorage.getItem("site") || "");
  const navigate = useNavigate();

  useEffect(() => {
    const controller = new AbortController();
    if (!token) return;
    customFetch("/validate", {
      method: "POST",
      headers: { Authorization: token },
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((okRes) => setUser(okRes.user))
      .catch((error) => {
        localStorage.removeItem("site");
        setUser(null);
        console.log(error);
      });
  }, [token]);

  const loginAction = async (username, password) => {
    const response = await fetch(`${config.url.BACKEND_URL}/login`, {
      method: "post",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    const res = await response.json();

    if (response.status !== 200 && response.status !== 401) {
      throw new Error(
        `Error while fetching: ${response.url} - ${response.status}: ${
          res.error || response.statusText
        }`
      );
    }

    if (res.token) {
      console.log(res.user, "weird");
      localStorage.setItem("site", `Bearer ${res.token}`);
      setUser(res.user);
      setToken(`Bearer ${res.token}`);
    }

    if (res.messages) return res.messages;
  };

  const logout = () => {
    setToken("");
    setUser(null);
    localStorage.removeItem("site");
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ user, token, loginAction, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

AuthProvider.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]).isRequired,
};

export default AuthProvider;
