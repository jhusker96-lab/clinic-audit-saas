import { useEffect, useState } from "react";

function App() {
  const [message, setMessage] = useState("Loading...");

  useEffect(() => {
    fetch(process.env.REACT_APP_API_URL + "/health")
      .then(res => res.json())
      .then(data => {
        setMessage("Backend Connected ✅");
      })
      .catch(() => {
        setMessage("Backend NOT Connected ❌");
      });
  }, []);

  return (
    <div style={{ padding: 40 }}>
      <h1>Clinic Audit SaaS</h1>
      <h2>{message}</h2>
    </div>
  );
}

export default App;
