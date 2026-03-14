import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import App from "./App.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#1a1a24",
            color: "#e5e7eb",
            border: "1px solid #3d3d52",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "14px",
          },
          success: { iconTheme: { primary: "#f59e0b", secondary: "#1a1a24" } },
          error:   { iconTheme: { primary: "#ef4444", secondary: "#1a1a24" } },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
);