import { useState } from "react";

export default function QueryBox() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState("explain");
  const [response, setResponse] = useState("");

  const handleQuery = async () => {
    const res = await fetch("http://localhost:8000/query", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: input, mode }),
    });
    const data = await res.json();
    setResponse(data.response);
  };

  return (
    <div>
      <textarea
        rows={4}
        placeholder="Paste something you just heard..."
        style={{ width: "100%", marginBottom: "1rem" }}
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <div style={{ marginBottom: "1rem" }}>
        <button onClick={() => setMode("explain")} disabled={mode === "explain"}>
          Explain
        </button>
        <button onClick={() => setMode("followup")} disabled={mode === "followup"} style={{ marginLeft: "1rem" }}>
          Follow-up
        </button>
        <button onClick={handleQuery} style={{ marginLeft: "2rem" }}>
          Submit
        </button>
      </div>
      <div style={{ whiteSpace: "pre-wrap", background: "#f4f4f4", padding: "1rem", borderRadius: "5px" }}>
        {response}
      </div>
    </div>
  );
}
