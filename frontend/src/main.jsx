import React from "react";
import ReactDOM from "react-dom/client";

console.log("===== Signal_guinee FRONTEND =====");
import { BrowserRouter } from "react-router-dom";
import { ToastContainer } from "react-toastify";

import App from "./App";
import "./i18n"; // Configuration i18next

// ===============================
// Global Styles
// ===============================
import "./styles/variables.css";
import "./styles/global.css";
import "./styles/animations.css";
import "./styles/utilities.css";

// ===============================
// Third-party Styles
// ===============================
import "react-toastify/dist/ReactToastify.css";
import "leaflet/dist/leaflet.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        pauseOnHover
        draggable
        theme="colored"
      />
    </BrowserRouter>
  </React.StrictMode>
);
