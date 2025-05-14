import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { createWSConnection } from "./lib/websocket";

// Initialize WebSocket connection for real-time dice rolls
createWSConnection();

createRoot(document.getElementById("root")!).render(<App />);
