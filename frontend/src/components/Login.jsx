import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import UserContext from "../userContext";
import "../styles/styles.css";

function Login() {
  const { setUserId } = useContext(UserContext);
  const [form, setForm] = useState({ email: "" });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/api/user/login", form);
      if (res.data.user?.id) {
        setUserId(res.data.user.id);
        localStorage.setItem('userId', res.data.user.id);
        navigate("/");
      } else {
        alert("Login failed. Please check your email.");
      }
    } catch (err) {
      alert("Error: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="auth-form">
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <input
            type="email"
            className="form-control"
            placeholder="Email"
            required
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <button type="submit" className="button button-primary" style={{ width: '100%' }}>
          Login
        </button>
      </form>
      <div className="form-footer">
        <p>
          New User?{" "}
          <span className="link" onClick={() => navigate("/register")}>
            Register Here!
          </span>
        </p>
      </div>
    </div>
  );
}

export default Login;
