import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { AuthRoutes } from "./routes/authRoutes";


export const AppRouter: React.FC = () => {
    return (
        <Router>
            <>
                <ToastContainer />
                <Routes>
                <Route path="/" element={<h1>Home</h1>} />
                <Route path="/auth/*" element={<AuthRoutes />} />

                {/* 404 - Not Found | TODO: Create a component for it */}
                <Route path="*" element={<h1>404 - Not Found</h1>} />
                </Routes>
            </>
        </Router>
    );
};
