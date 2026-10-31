import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import App from "./App.jsx";
import { AppDataProvider } from "./AppData.jsx";
import { LangProvider } from "./LangContext.jsx";
import { ToastProvider } from "./Toast.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <LangProvider>
      <AppDataProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AppDataProvider>
    </LangProvider>
  </StrictMode>,
);
