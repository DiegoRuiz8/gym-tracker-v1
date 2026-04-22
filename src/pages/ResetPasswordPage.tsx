import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setIsValidSession(true);
      } else {
        navigate("/login", { replace: true });
      }
    });
  }, [navigate]);

  async function handleSubmit() {
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setIsLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
      setIsLoading(false);
      return;
    }

    navigate("/", { replace: true });
  }

  if (!isValidSession) return null;

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />

      <div style={{
        height: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        backgroundColor: "#0f1117",
        backgroundImage: "radial-gradient(at 0% 0%, rgba(79,110,247,0.08) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(79,110,247,0.05) 0px, transparent 50%)",
        fontFamily: "Inter, sans-serif",
        boxSizing: "border-box",
      }}>
        <div style={{ width: "100%", maxWidth: "400px" }}>
          <div style={{
            backgroundColor: "#1a1d27",
            border: "1px solid rgba(255,255,255,0.05)",
            borderRadius: "16px",
            boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
          }}>
            <div style={{
              padding: "28px 24px 24px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}>
              {/* Logo */}
              <div style={{ marginBottom: "12px" }}>
                <img
                  src="/barbell.png"
                  alt="Lift Log"
                  style={{
                    width: "64px",
                    height: "64px",
                    filter: "drop-shadow(0 0 12px rgba(79,110,247,0.4))",
                  }}
                />
              </div>

              {/* Header */}
              <div style={{ textAlign: "center", marginBottom: "20px", width: "100%" }}>
                <h1 style={{
                  fontFamily: "Lexend, sans-serif",
                  fontSize: "22px",
                  fontWeight: "700",
                  color: "#ffffff",
                  margin: "0 0 6px 0",
                }}>
                  Set new password
                </h1>
                <p style={{ color: "#8e90a0", fontSize: "13px", margin: 0 }}>
                  Choose a strong password for your account.
                </p>
              </div>

              {/* Form */}
              <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "14px" }}>

                {/* New password */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{
                    fontSize: "11px",
                    fontWeight: "600",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "rgba(142,144,160,0.8)",
                  }}>
                    New Password
                  </label>
                  <div style={{ position: "relative" }}>
                    <span className="material-symbols-outlined" style={{
                      position: "absolute", left: "14px", top: "50%",
                      transform: "translateY(-50%)", color: "#8e90a0", fontSize: "18px",
                    }}>lock</span>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                      style={{
                        width: "100%",
                        backgroundColor: "#0c0e15",
                        border: "1px solid rgba(255,255,255,0.05)",
                        borderRadius: "12px",
                        padding: "12px 44px 12px 44px",
                        color: "#e2e1ed",
                        fontSize: "14px",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      style={{
                        position: "absolute", right: "14px", top: "50%",
                        transform: "translateY(-50%)", background: "none",
                        border: "none", color: "#8e90a0", cursor: "pointer",
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                        {showPassword ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Confirm password */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{
                    fontSize: "11px",
                    fontWeight: "600",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "rgba(142,144,160,0.8)",
                  }}>
                    Confirm Password
                  </label>
                  <div style={{ position: "relative" }}>
                    <span className="material-symbols-outlined" style={{
                      position: "absolute", left: "14px", top: "50%",
                      transform: "translateY(-50%)", color: "#8e90a0", fontSize: "18px",
                    }}>lock</span>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                      style={{
                        width: "100%",
                        backgroundColor: "#0c0e15",
                        border: "1px solid rgba(255,255,255,0.05)",
                        borderRadius: "12px",
                        padding: "12px 20px 12px 44px",
                        color: "#e2e1ed",
                        fontSize: "14px",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                </div>

                {/* Error */}
                {error ? (
                  <p style={{
                    margin: 0, fontSize: "13px", color: "#f87171",
                    padding: "8px 12px", backgroundColor: "rgba(248,113,113,0.1)",
                    borderRadius: "8px", border: "1px solid rgba(248,113,113,0.2)",
                  }}>{error}</p>
                ) : null}

                {/* Submit */}
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading || !password || !confirmPassword}
                  style={{
                    width: "100%",
                    backgroundColor: "#4f6ef7",
                    color: "#ffffff",
                    fontFamily: "Lexend, sans-serif",
                    fontSize: "15px",
                    fontWeight: "700",
                    padding: "13px",
                    borderRadius: "12px",
                    border: "none",
                    cursor: isLoading ? "not-allowed" : "pointer",
                    opacity: isLoading || !password || !confirmPassword ? 0.6 : 1,
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                  }}
                >
                  {isLoading ? "Saving..." : "Update Password"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}