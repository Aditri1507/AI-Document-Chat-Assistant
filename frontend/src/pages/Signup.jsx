import { useState } from "react";
import {
  Sparkles,
  Lock,
  Mail,
  User,
  FileText,
  Brain,
  MessageSquare,
} from "lucide-react";
import { signupUser } from "../services/authService";
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

export default function Signup() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();

    try {
      const data = await signupUser(
        name,
        email,
        password
      );

      localStorage.setItem(
        "token",
        data.token
      );

      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      navigate("/chat");
    } catch (error) {
      alert(
        error?.response?.data?.message ||
        "Signup Failed"
      );
    }
  };

  return (
    <main className="login-page">
      {/* LEFT SIDE SAME AS LOGIN */}

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
            information instantly using
            Retrieval-Augmented Generation (RAG).
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

      {/* RIGHT SIDE */}

      <section className="login-side">
        <div className="login-card">
          <div className="lock-badge">
            <User size={24} />
          </div>

          <h2>Create Account</h2>

          <p className="subtitle">
            Start chatting with your documents
          </p>

          <form
            onSubmit={onSubmit}
            autoComplete="off"
          >
            <label>
              Full Name

              <div className="input-wrap">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  placeholder="Enter your full name"
                />

                <User
                  size={16}
                  className="input-icon"
                />
              </div>
            </label>

            <label>
              Email

              <div className="input-wrap">
                <input
                  type="email"
                  required
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
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  placeholder="Create a password"
                />

                <Lock
                  size={16}
                  className="input-icon"
                />
              </div>
            </label>

            <button
              type="submit"
              className="submit-btn"
            >
              Create Account
            </button>

            <div className="divider">
              <span>or</span>
            </div>

            <p className="signup-line">
              Already have an account?{" "}
              <a href="/login">
                Login
              </a>
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}
