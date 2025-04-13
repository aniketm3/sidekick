import { useState } from "react";

export default function QueryBox() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState("explain");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isRecording, setIsRecording] = useState(false);


  const recordAudio = async () => {
    console.log("🎤 Requesting mic access...");
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    console.log("Mic access granted.");
  
    const mediaRecorder = new MediaRecorder(stream);
    const audioChunks = [];
  
    mediaRecorder.ondataavailable = (event) => {
      console.log("Got audio data:", event.data);
      audioChunks.push(event.data);
    };
  
    mediaRecorder.onstop = async () => {
      console.log("⏹ Recording stopped.");
      setIsRecording(false);
      setSecondsLeft(0);
  
      const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
      console.log("Blob created. Size:", audioBlob.size);
  
      const formData = new FormData();
      formData.append("file", audioBlob, "audio.webm");
  
      console.log("Sending blob to backend...");
      const res = await fetch("http://localhost:8000/transcribe", {
        method: "POST",
        body: formData,
      });
  
      console.log("awaiting");
      const data = await res.json();
      console.log("Transcription received:", data);
  
      const transcribedText = data.text;
      setInput(transcribedText);
      handleQuery(transcribedText);
    };
  
    console.log("⏺ Starting recording...");
    mediaRecorder.start();
    setIsRecording(true);
    setSecondsLeft(8);
  
    const countdown = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(countdown);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  
    setTimeout(() => {
      console.log("Stopping after 8s...");
      mediaRecorder.stop();
    }, 8000);
  };
  
  
  const handleQuery = async (transcribedText) => {
    const query = (transcribedText ?? input).toString();
    if (!query.trim()) return;
    setLoading(true);
    setResponse("");

    const res = await fetch("http://localhost:8000/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: query, mode }),
    });

    const data = await res.json();
    setResponse(data.response);
    setLoading(false);
  };

  return (
    /* Outer container: fill viewport to center content vertically & horizontally */
    <div
      style={{
        width: "100%",
        // minHeight: "100vh",
        paddingTop: "6vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* Inner container: sets max width and padding */}
      <div
        style={{
          width: "100%",
          maxWidth: "700px",
          padding: "1.5rem",
        }}
      >
        {/* Recording button + subtext */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <button
                style={{
                padding: "0.75rem 1.5rem",
                background: "#4f46e5",
                color: "white",
                fontSize: "1.05rem",
                fontWeight: 500,
                borderRadius: "999px",
                border: "none",
                cursor: isRecording ? "default" : "pointer",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                transition: "background 0.3s ease",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.75rem",
                opacity: isRecording ? 0.8 : 1
                }}
                onClick={recordAudio}
                disabled={isRecording}
            >
                {isRecording ? "Recording..." : "Start Recording"}
                {isRecording && (
                <span style={{ fontSize: "1rem", fontWeight: 500 }}>
                    {secondsLeft}s
                </span>
                )}
            </button>

            <p style={{ marginTop: "0.5rem", fontSize: "0.9rem", color: "#666" }}>
                Or type below if you prefer
            </p>
        </div>


        {/* Text area for manual input */}
        <textarea
          rows={4}
          placeholder="Paste something you just heard..."
          style={{
            width: "100%",
            padding: "1rem",
            borderRadius: "12px",
            border: "1px solid #ddd",
            fontSize: "1rem",
            resize: "none",
            marginBottom: "1rem",
          }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />

        {/* Row with toggle on the left, big submit button on the right */}
        <div
          style={{
            marginBottom: "1rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Explain/Follow-Up toggle */}
          <div
            style={{
              display: "inline-flex",
              background: "#f1f1f1",
              borderRadius: "999px",
              overflow: "hidden",
            }}
          >
            {["explain", "followup"].map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                style={{
                  padding: "0.5rem 1.2rem",
                  background: mode === m ? "#000" : "transparent",
                  color: mode === m ? "white" : "#333",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: mode === m ? "600" : "400",
                }}
              >
                {m === "explain" ? "Explain" : "Follow-Up"}
              </button>
            ))}
          </div>

          {/* Submit button */}
          <button
            onClick={handleQuery}
            style={{
              background: "#111",
              color: "white",
              border: "none",
              padding: "0.75rem 1.75rem",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "1rem",
              fontWeight: 500,
            }}
          >
            Ask my sidekick!
          </button>
        </div>

        {/* Response box */}
        {response && (
          <div
            style={{
              background: "#fafafa",
              border: "1px solid #e4e4e4",
              borderRadius: "12px",
              padding: "1.25rem",
              fontSize: "1rem",
              lineHeight: "1.6",
              color: "#333",
              whiteSpace: "pre-wrap",
              minHeight: "80px",
            }}
          >
            {loading ? "⏳ Thinking..." : response}
          </div>
        )}
      </div>
    </div>
  );
}
