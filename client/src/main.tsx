/**
    * @description      : 
    * @author           : 
    * @group            : 
    * @created          : 05/06/2025 - 13:57:31
    
    * 
    * MODIFICATION LOG
    * - Version         : 1.0.0
    * - Date            : 05/06/2025
    * - Author          : 
    * - Modification    : 
**/
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
