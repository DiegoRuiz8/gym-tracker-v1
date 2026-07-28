import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";

type AuthMode = "login" | "signup" | "forgot";

export default function LoginPage() {
  const navigate = useNavigate();
  const signIn = useAuthStore((state) => state.signIn);
  const signUp = useAuthStore((state) => state.signUp);
  const signInWithGoogle = useAuthStore((state) => state.signInWithGoogle);
  const enterDemo = useAuthStore((state) => state.enterDemo);

  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit() {
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    if (mode === "forgot") {
      const { error } = await import("../lib/supabase").then(({ supabase }) =>
        supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        }),
      );
      if (error) {
        setError(error.message);
      } else {
        setSuccessMessage("Check your email for a password reset link.");
      }
      setIsLoading(false);
      return;
    }

    if (mode === "login") {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error);
        setIsLoading(false);
        return;
      }
      navigate("/", { replace: true });
    } else {
      const { error } = await signUp(email, password);
      if (error) {
        setError(error);
        setIsLoading(false);
        return;
      }
      setSuccessMessage("Account created! Check your email to confirm your account.");
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSubmit();
  }

  function switchMode(newMode: AuthMode) {
    setMode(newMode);
    setError(null);
    setSuccessMessage(null);
  }

  function handleTryDemo() {
    enterDemo();
    navigate("/", { replace: true });
  }

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
        overflowY: "auto",
      }}>
        <div style={{ width: "100%", maxWidth: "400px" }}>
          <div style={{
            backgroundColor: "#1a1d27",
            border: "1px solid rgba(255,255,255,0.05)",
            borderRadius: "16px",
            overflow: "hidden",
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
              <div style={{ textAlign: "center", marginBottom: "20px" }}>
                <h1 style={{
                  fontFamily: "Lexend, sans-serif",
                  fontSize: "26px",
                  fontWeight: "700",
                  color: "#ffffff",
                  letterSpacing: "-0.02em",
                  margin: "0 0 4px 0",
                }}>
                  LIFT LOG
                </h1>
                <p style={{
                  color: "#8e90a0",
                  fontSize: "13px",
                  margin: 0,
                  opacity: 0.7,
                }}>
                  Log it. Track it. Get stronger.
                </p>
              </div>

              {/* Tabs */}
              {mode !== "forgot" ? (
                <div style={{
                  width: "100%",
                  backgroundColor: "#161923",
                  padding: "4px",
                  borderRadius: "9999px",
                  display: "flex",
                  marginBottom: "20px",
                  border: "1px solid rgba(255,255,255,0.05)",
                }}>
                  {(["login", "signup"] as AuthMode[]).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => switchMode(tab)}
                      style={{
                        flex: 1,
                        padding: "8px 16px",
                        borderRadius: "9999px",
                        border: "none",
                        fontSize: "14px",
                        fontWeight: "600",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        backgroundColor: mode === tab ? "#4f6ef7" : "transparent",
                        color: mode === tab ? "#ffffff" : "#8e90a0",
                      }}
                    >
                      {tab === "login" ? "Log in" : "Sign up"}
                    </button>
                  ))}
                </div>
              ) : (
                <div style={{ width: "100%", marginBottom: "16px" }}>
                  <button
                    type="button"
                    onClick={() => switchMode("login")}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#4f6ef7",
                      fontSize: "14px",
                      cursor: "pointer",
                      padding: 0,
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    ← Back to log in
                  </button>
                  <p style={{
                    color: "#ffffff",
                    fontWeight: "600",
                    fontSize: "17px",
                    margin: "10px 0 4px 0",
                    fontFamily: "Lexend, sans-serif",
                  }}>
                    Reset password
                  </p>
                  <p style={{ color: "#8e90a0", fontSize: "13px", margin: 0 }}>
                    Enter your email and we'll send you a reset link.
                  </p>
                </div>
              )}

              {/* Form */}
              <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "14px" }}>

                {/* Email */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{
                    fontSize: "11px",
                    fontWeight: "600",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "rgba(142,144,160,0.8)",
                  }}>
                    Email Address
                  </label>
                  <div style={{ position: "relative" }}>
                    <span className="material-symbols-outlined" style={{
                      position: "absolute",
                      left: "14px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#8e90a0",
                      fontSize: "18px",
                    }}>mail</span>
                    <input
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={handleKeyDown}
                      autoComplete="email"
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

                {/* Password */}
                {mode !== "forgot" ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <label style={{
                        fontSize: "11px",
                        fontWeight: "600",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: "rgba(142,144,160,0.8)",
                      }}>
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => switchMode("forgot")}
                        style={{
                          background: "none",
                          border: "none",
                          color: "rgba(79,110,247,0.8)",
                          fontSize: "11px",
                          cursor: "pointer",
                          padding: 0,
                        }}
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div style={{ position: "relative" }}>
                      <span className="material-symbols-outlined" style={{
                        position: "absolute",
                        left: "14px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#8e90a0",
                        fontSize: "18px",
                      }}>lock</span>
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={handleKeyDown}
                        autoComplete={mode === "login" ? "current-password" : "new-password"}
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
                          position: "absolute",
                          right: "14px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "none",
                          border: "none",
                          color: "#8e90a0",
                          cursor: "pointer",
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                          {showPassword ? "visibility_off" : "visibility"}
                        </span>
                      </button>
                    </div>
                  </div>
                ) : null}

                {/* Error / Success */}
                {error ? (
                  <p style={{
                    margin: 0,
                    fontSize: "13px",
                    color: "#f87171",
                    padding: "8px 12px",
                    backgroundColor: "rgba(248,113,113,0.1)",
                    borderRadius: "8px",
                    border: "1px solid rgba(248,113,113,0.2)",
                  }}>{error}</p>
                ) : null}

                {successMessage ? (
                  <p style={{
                    margin: 0,
                    fontSize: "13px",
                    color: "#4ade80",
                    padding: "8px 12px",
                    backgroundColor: "rgba(74,222,128,0.1)",
                    borderRadius: "8px",
                    border: "1px solid rgba(74,222,128,0.2)",
                  }}>{successMessage}</p>
                ) : null}

                {/* Submit */}
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading || !email || (mode !== "forgot" && !password)}
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
                    opacity: isLoading || !email || (mode !== "forgot" && !password) ? 0.6 : 1,
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                  }}
                >
                  {isLoading ? "Loading..." : mode === "login" ? "Sign In" : mode === "signup" ? "Create Account" : "Send Reset Link"}
                </button>

                {mode !== "forgot" ? (
                  <div style={{ textAlign: "center" }}>
                    <button
                      type="button"
                      onClick={handleTryDemo}
                      style={{
                        width: "100%",
                        backgroundColor: "rgba(79,110,247,0.12)",
                        color: "#cdd7ff",
                        fontFamily: "Lexend, sans-serif",
                        fontSize: "14px",
                        fontWeight: "700",
                        padding: "12px",
                        borderRadius: "12px",
                        border: "1px solid rgba(79,110,247,0.9)",
                        cursor: "pointer",
                        letterSpacing: "0.04em",
                        textTransform: "uppercase",
                      }}
                    >
                      Explore Demo
                    </button>
                    <p style={{ margin: "7px 0 0", color: "rgba(142,144,160,0.72)", fontSize: "12px" }}>
                      No account required
                    </p>
                  </div>
                ) : null}

                {/* Google + footer */}
                {mode !== "forgot" ? (
                  <>
                    <div style={{ display: "flex", alignItems: "center", margin: "2px 0" }}>
                      <div style={{ flex: 1, height: "1px", backgroundColor: "rgba(255,255,255,0.05)" }} />
                      <span style={{
                        padding: "0 12px",
                        fontSize: "10px",
                        color: "rgba(255,255,255,0.2)",
                        letterSpacing: "0.2em",
                        textTransform: "uppercase",
                      }}>Or continue with</span>
                      <div style={{ flex: 1, height: "1px", backgroundColor: "rgba(255,255,255,0.05)" }} />
                    </div>

                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <button
                        type="button"
                        onClick={async () => {
                          const { error } = await signInWithGoogle();
                          if (error) setError(error);
                        }}
                        title="Sign in with Google"
                        style={{
                          width: "48px",
                          height: "48px",
                          backgroundColor: "#161923",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "9999px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                        }}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                      </button>
                    </div>

                    <p style={{
                      textAlign: "center",
                      margin: "2px 0 0 0",
                      fontSize: "13px",
                      color: "rgba(142,144,160,0.5)",
                    }}>
                      {(mode as string) === "login" ? (
                        <>Don't have an account?{" "}
                          <button type="button" onClick={() => switchMode("signup")} style={{
                            background: "none", border: "none", color: "#4f6ef7",
                            fontWeight: "600", cursor: "pointer", fontSize: "13px", padding: 0,
                          }}>Create an account</button>
                        </>
                      ) : (
                        <>Already have an account?{" "}
                          <button type="button" onClick={() => switchMode("login")} style={{
                            background: "none", border: "none", color: "#4f6ef7",
                            fontWeight: "600", cursor: "pointer", fontSize: "13px", padding: 0,
                          }}>Log in</button>
                        </>
                      )}
                    </p>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
