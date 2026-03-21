import { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

const overlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  backdropFilter: "blur(8px)",
  backgroundColor: "rgba(0,0,0,0.4)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 2000,
};

const modalStyle = {
  background: "white",
  padding: "30px",
  borderRadius: "12px",
  width: "300px",
  textAlign: "center",
};

const inputStyle = {
  width: "100%",
  padding: "10px",
  margin: "10px 0",
};

const buttonStyle = {
  padding: "10px 15px",
  background: "#0077b6",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
};

const linkButtonStyle = {
  background: "transparent",
  border: "none",
  color: "#0077b6",
  cursor: "pointer",
  marginTop: "8px",
};

export default function AuthModal({ isOpen, onClose }) {
  const [isRegister, setIsRegister] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");

  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  if (!isOpen) return null;

  const withTimeout = (promise, ms) => {
    return Promise.race([
      promise,
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Request timed out")), ms);
      }),
    ]);
  };

  const resetState = () => {
    setLoginEmail("");
    setLoginPassword("");
    setName("");
    setAge("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setPhone("");
    setMessage("");
    setIsLoading(false);
  };

  const handleLogin = async () => {
    if (!loginEmail.trim() || !loginPassword) {
      setMessage("Please enter email and password");
      return;
    }

    setIsLoading(true);
    setMessage("Logging in...");

    try {
      const normalizedEmail = loginEmail.trim().toLowerCase();
      const { data, error } = await withTimeout(
        supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password: loginPassword,
        }),
        15000,
      );

      if (error) {
        setMessage(`Login failed: ${error.message}`);
        return;
      }

      if (!data?.session) {
        setMessage("Please verify your email, then login again.");
        return;
      }

      setMessage("Login successful!");
      onClose();
      navigate("/risk-map");
    } catch (error) {
      setMessage(`Request failed: ${error.message || "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!name.trim() || !age.trim() || !email.trim() || !password || !confirmPassword || !phone.trim()) {
      setMessage("Please fill all required fields");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }

    setIsLoading(true);
    setMessage("Registering...");

    try {
      const normalizedEmail = email.trim().toLowerCase();

      const { data, error } = await withTimeout(
        supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            data: {
              name: name.trim(),
              age: age.trim(),
              phone: phone.trim(),
            },
          },
        }),
        15000,
      );

      if (error) {
        setMessage(`Register failed: ${error.message}`);
        return;
      }

      if (data?.session) {
        setMessage("Registered successfully!");
        onClose();
        navigate("/risk-map");
        return;
      }

      if (data?.user) {
        setMessage("Verification email sent! Please check your inbox");
        setIsRegister(false);
        setLoginEmail(normalizedEmail);
        setLoginPassword("");
      }
    } catch (error) {
      setMessage(`Request failed: ${error.message || "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuth = async () => {
    if (isLoading) return;
    if (isRegister) {
      await handleRegister();
      return;
    }
    await handleLogin();
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <h2>Welcome to NEER</h2>

        {!isRegister ? (
          <>
            <input
              placeholder="Email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              style={inputStyle}
            />
            <input
              type="password"
              placeholder="Password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              style={inputStyle}
            />
          </>
        ) : (
          <>
            <input
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={inputStyle}
            />
            <input
              placeholder="Age"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              style={inputStyle}
            />
            <input
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
            />
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={inputStyle}
            />
            <input
              placeholder="Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={inputStyle}
            />
          </>
        )}

        <button onClick={handleAuth} style={buttonStyle} disabled={isLoading}>
          {isLoading ? "Please wait..." : isRegister ? "Register" : "Login"}
        </button>

        <p>{message}</p>

        {!isRegister ? (
          <button
            type="button"
            style={linkButtonStyle}
            onClick={() => {
              setIsRegister(true);
              setMessage("");
            }}
          >
            New to NEER? Register
          </button>
        ) : (
          <button
            type="button"
            style={linkButtonStyle}
            onClick={() => {
              setIsRegister(false);
              setMessage("");
            }}
          >
            Already registered? Login
          </button>
        )}

        <button
          onClick={() => {
            resetState();
            onClose();
          }}
          style={{ marginTop: "10px" }}
        >
          Close
        </button>
      </div>
    </div>
  );
}