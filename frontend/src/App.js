import { useState, useEffect } from "react";

const API = process.env.REACT_APP_API_URL;

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");

  async function signup() {
    const res = await fetch(API + "/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clinicName: "Test Clinic",
        firstName: "Test",
        lastName: "User",
        email,
        password
      })
    });

    const data = await res.json();
    if (data.token) {
      localStorage.setItem("token", data.token);
      setToken(data.token);
      setStatus("Signed up ✅");
    } else {
      setStatus("Signup failed ❌");
    }
  }

  async function login() {
    const res = await fetch(API + "/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (data.token) {
      localStorage.setItem("token", data.token);
      setToken(data.token);
      setStatus("Logged in ✅");
    } else {
      setStatus("Login failed ❌");
    }
  }

  async function testProtected() {
    const res = await fetch(API + "/api/users/me", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();
    setStatus(JSON.stringify(data));
  }

  function logout() {
    localStorage.removeItem("token");
    setToken(null);
    setStatus("");
  }

  if (!token) {
    return (
      <div style={{ padding: 40 }}>
        <h1>Clinic Audit SaaS</h1>
        <input
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <br /><br />
        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <br /><br />
        <button onClick={signup}>Sign Up</button>
        <button onClick={login}>Login</button>
        <p>{status}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Authenticated ✅</h1>
      <button onClick={testProtected}>Test Protected Route</button>
      <button onClick={logout}>Logout</button>
      <p>{status}</p>
    </div>
  );
}

export default App;
