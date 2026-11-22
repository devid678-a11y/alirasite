"use client";

import React from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{ padding: "40px", backgroundColor: "#fff0f0", color: "#d32f2f", fontFamily: "sans-serif", minHeight: "100vh" }}>
      <h1 style={{ fontSize: "24px", marginBottom: "16px" }}>Критическая ошибка (Client Error)</h1>
      <p style={{ marginBottom: "16px", fontWeight: "bold" }}>{error.message}</p>
      <pre style={{ backgroundColor: "#ffcdd2", padding: "16px", borderRadius: "4px", overflow: "auto", fontSize: "12px" }}>
        {error.stack}
      </pre>
      <button 
        onClick={() => reset()}
        style={{ marginTop: "24px", padding: "8px 16px", backgroundColor: "#d32f2f", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
      >
        Попробовать снова
      </button>
    </div>
  );
}
