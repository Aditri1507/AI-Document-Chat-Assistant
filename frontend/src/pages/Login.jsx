import { loginUser } from "../services/authService";
import { useState } from "react";
import {
  Sparkles,
  Lock,
  Mail,
  FileText,
  Brain,
  MessageSquare,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

function Feature({ icon: Icon, title, desc }) {
  return (
    <div className="feature">
      <div className="feature-icon">
        <Icon size={20} />
      </div>

      <div>
        <h3>{title}</h3>
        <p>{desc}</p>
      </div>
    </div>
  );
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();

    try {
      const data = await loginUser(email, password);

      localStorage.setItem("token", data.token);
      localStorage.setItem("userName", data.user.name);   // ← add this
      localStorage.setItem("userEmail", data.user.email);

      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      navigate("/chat");
    } catch (error) {
      console.error(error);

      alert(
        error?.response?.data?.message ||
        "Login Failed"
      );
    }
  };

  return (
    <main className="login-page">
      {/* Left Side */}
      <section className="brand-side">
        <div className="brand-logo">
          <div className="logo-box">
            <Sparkles size={20} />
          </div>

          <span>DocuMind AI</span>
        </div>

        <div className="brand-content">
          <h1>
            AI Document{" "}
            <span className="gradient-text">
              Assistant
            </span>
          </h1>

          <p className="lead">
            Upload documents, chat with AI, and retrieve
            information instantly using Retrieval-Augmented
            Generation (RAG).
          </p>

          <div className="features">
            <Feature
              icon={FileText}
              title="Upload PDFs and Documents"
              desc="Easily upload and manage your documents."
            />

            <Feature
              icon={Brain}
              title="AI-Powered Contextual Search"
              desc="Get precise answers from your documents."
            />

            <Feature
              icon={MessageSquare}
              title="Persistent Chat History"
              desc="Continue your conversations anytime."
            />
          </div>
        </div>

        <p className="copyright">
          © 2026 DocuMind AI. All rights reserved.
        </p>
      </section>

      {/* Right Side */}
      <section className="login-side">
        <div className="login-card">
          <div className="lock-badge">
            <Lock size={24} />
          </div>

          <h2>Welcome back</h2>

          <p className="subtitle">
            Login to continue to your account
          </p>

          <form
            onSubmit={onSubmit}
            autoComplete="off"
          >
            <label>
              Email

              <div className="input-wrap">
                <input
                  type="email"
                  required
                  autoComplete="off"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  placeholder="Enter your email"
                />

                <Mail
                  size={16}
                  className="input-icon"
                />
              </div>
            </label>

            <label>
              Password

              <div className="input-wrap">
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  placeholder="Enter your password"
                />

                <Lock
                  size={16}
                  className="input-icon"
                />
              </div>
            </label>

            <div className="forgot">
              <a href="#">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              className="submit-btn"
            >
              Login
            </button>

            <div className="divider">
              <span>or</span>
            </div>

            <p className="signup-line">
              Don't have an account?{" "}
              <a href="/signup">
                Sign up
              </a>
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}
