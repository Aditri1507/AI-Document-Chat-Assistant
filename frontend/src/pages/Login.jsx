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

function Feature({ icon: Icon, title, desc }) {
  return (
    <div className="flex gap-4 items-start p-3 rounded-xl transition-all duration-250 hover:bg-white/[0.03]">
      <div className="w-14 h-14 flex items-center justify-center bg-[#1a1a2e] border border-[#2a2a44] rounded-xl text-violet-400 shadow-[0_0_20px_rgba(124,58,237,0.25),0_0_40px_rgba(124,58,237,0.08)] shrink-0">
        <Icon size={24} />
      </div>
      <div>
        <h3 className="m-0 text-lg font-semibold text-[#e6e6f0]">{title}</h3>
        <p className="mt-1 mb-0 text-[#9090a8] text-base">{desc}</p>
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
      localStorage.setItem("userName", data.user.name);
      localStorage.setItem("userEmail", data.user.email);
      localStorage.setItem("user", JSON.stringify(data.user));

      navigate("/chat");
    } catch (error) {
      console.error(error);
      alert(error?.response?.data?.message || "Login Failed");
    }
  };

  return (
    <main
      className="h-screen overflow-hidden grid gap-8 px-12 py-8 bg-[#0a0a14] text-[#e6e6f0] font-sans relative"
      style={{ gridTemplateColumns: "1.2fr 1.2fr" }}
    >
      {/* Background glows */}
      <div className="pointer-events-none absolute w-[500px] h-[500px] -top-[150px] -left-[150px] rounded-full bg-violet-600/15 blur-[120px]" />
      <div className="pointer-events-none absolute w-[500px] h-[500px] -bottom-[150px] -right-[150px] rounded-full bg-indigo-600/15 blur-[120px]" />

      {/* Left — Brand Side */}
      <section className="flex flex-col justify-between relative z-10">
        {/* Logo */}
        <div className="flex items-center gap-3 font-semibold">
          <div className="w-11 h-11 flex items-center justify-center bg-[#1a1a2e] border border-[#2a2a44] rounded-xl text-violet-400 shadow-[0_0_20px_rgba(124,58,237,0.25),0_0_40px_rgba(124,58,237,0.08)]">
            <Sparkles size={20} />
          </div>
          <span className="text-[#e6e6f0]">DocuMind AI</span>
        </div>

        {/* Main content */}
        <div className="max-w-[32rem] mt-12 mb-auto">
          <h1 className="text-[3.2rem] leading-[1.05] font-bold m-0 mb-5 whitespace-nowrap">
            AI Document{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: "linear-gradient(135deg, #c4b5fd, #7c3aed)",
              }}
            >
              Assistant
            </span>
          </h1>

          <p className="text-[#9090a8] text-xl leading-relaxed">
            Upload documents, chat with AI, and retrieve information instantly
            using Retrieval-Augmented Generation (RAG).
          </p>

          <div className="mt-12 flex flex-col gap-8">
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

        <p className="text-[#6a6a82] text-sm">
          © 2026 DocuMind AI. All rights reserved.
        </p>
      </section>

      {/* Right — Login Side */}
      <section className="flex items-center justify-center relative z-10">
        <div className="w-full max-w-[33rem] bg-[rgba(17,17,28,0.65)] backdrop-blur-[18px] border border-[#2a2a44] rounded-2xl p-6 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)]">
          {/* Lock badge */}
          <div className="w-14 h-14 rounded-full mx-auto flex items-center justify-center bg-violet-500/10 border border-violet-500/40 text-violet-400 shadow-[0_0_40px_rgba(124,58,237,0.25)]">
            <Lock size={24} />
          </div>

          <h2 className="text-center mt-4 mb-1 text-[#e6e6f0] font-semibold text-xl">
            Welcome back
          </h2>

          <p className="text-center text-[#9090a8] text-sm mb-5">
            Login to continue to your account
          </p>

          <form onSubmit={onSubmit} autoComplete="off">
            {/* Email */}
            <label className="block text-sm font-medium mb-[0.85rem]">
              Email
              <div className="relative mt-2 w-full">
                <input
                  type="email"
                  required
                  autoComplete="off"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full box-border py-[14px] pl-4 pr-12 bg-[rgba(26,26,46,0.85)] border border-[#2a2a44] rounded-xl text-[#e6e6f0] text-[15px] font-normal outline-none transition-all duration-200 focus:border-violet-600 focus:shadow-[0_0_0_3px_rgba(124,58,237,0.2)] placeholder:text-[#6a6a82] [&:-webkit-autofill]:bg-[rgba(26,26,46,0.85)] [&:-webkit-autofill]:[-webkit-text-fill-color:#e6e6f0] [&:-webkit-autofill]:[transition:background-color_0s_99999s,color_0s_99999s]"
                />
                <Mail
                  size={16}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6a6a82]"
                />
              </div>
            </label>

            {/* Password */}
            <label className="block text-sm font-medium mb-[0.85rem]">
              Password
              <div className="relative mt-2 w-full">
                <input
                  type="password"
                  required
                  autoComplete="off"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full box-border py-[14px] pl-4 pr-12 bg-[rgba(26,26,46,0.85)] border border-[#2a2a44] rounded-xl text-[#e6e6f0] text-[15px] font-normal outline-none transition-all duration-200 focus:border-violet-600 focus:shadow-[0_0_0_3px_rgba(124,58,237,0.2)] placeholder:text-[#6a6a82] [&:-webkit-autofill]:bg-[rgba(26,26,46,0.85)] [&:-webkit-autofill]:[-webkit-text-fill-color:#e6e6f0] [&:-webkit-autofill]:[transition:background-color_0s_99999s,color_0s_99999s]"
                />
                <Lock
                  size={16}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6a6a82]"
                />
              </div>
            </label>

            {/* Forgot password */}
            <div className="text-right mb-4">
              <a
                href="#"
                className="text-violet-400 no-underline text-sm hover:underline"
              >
                Forgot password?
              </a>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full py-[0.95rem] border-none rounded-[10px] text-white font-semibold cursor-pointer transition-all duration-250 shadow-[0_0_60px_rgba(124,58,237,0.25)] hover:-translate-y-0.5 hover:shadow-[0_0_80px_rgba(124,58,237,0.4)]"
              style={{
                background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
              }}
            >
              Login
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-4 text-[#6a6a82] text-xs before:content-[''] before:flex-1 before:h-px before:bg-[#2a2a44] after:content-[''] after:flex-1 after:h-px after:bg-[#2a2a44]">
              <span>or</span>
            </div>

            {/* Sign up */}
            <p className="text-center text-[#9090a8] text-sm m-0">
              Don't have an account?{" "}
              <a
                href="/signup"
                className="text-violet-400 no-underline hover:underline"
              >
                Sign up
              </a>
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}
