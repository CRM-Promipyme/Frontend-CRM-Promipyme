import React from "react";
import { Error404 } from "./pages/Error404";
import { ToastContainer } from "react-toastify";
import { AuthRoutes } from "./routes/authRoutes";
import { AnimatePresence } from "framer-motion";
import { ReportRoutes } from "./routes/reportRoutes";
import { ContactRoutes } from "./routes/contactRoutes";
import { WorkflowRoutes } from "./routes/workflowRoutes";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";

const AnimatedRoutes = () => {
    const location = useLocation();

    const routes = [
        {
            prefixedPath: "/auth",
            component: <AuthRoutes />,
        },
        {
            prefixedPath: "/contacts",
            component: <ContactRoutes />,
        },
        {
            prefixedPath: "/workflows",
            component: <WorkflowRoutes />,
        },
        {
            prefixedPath: "/reports",
            component: <ReportRoutes />,
        },
    ]

    return (
        <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
                <Route
                    path="/"
                    element={
                        <h1>Home</h1>
                    }
                />
                {routes.map((route, index) => (
                    <Route key={index} path={`${route.prefixedPath}/*`} element={route.component} />
                ))}
                {/* 404 - Not Found */}
                <Route
                    path="*"
                    element={
                            <Error404 />
                    }
                />
            </Routes>
        </AnimatePresence>
    );
};

export const AppRouter: React.FC = () => {
    return (
        <Router>
            <>
                <ToastContainer />
                <AnimatedRoutes />
            </>
        </Router>
    );
};
