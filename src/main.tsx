import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AppRouter } from "./appRouter.tsx";
import "./index.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min";
import "react-toastify/dist/ReactToastify.css";
import "font-awesome/css/font-awesome.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
    <AppRouter />
    </StrictMode>
);
