import React from "react";
import { Error404 } from "./pages/Error404";
import { ToastContainer } from "react-toastify";
import { AuthRoutes } from "./routes/authRoutes";
import { AnimatePresence, motion } from "framer-motion";
import { ContactRoutes } from "./routes/contactRoutes";
import { WorkflowRoutes } from "./routes/workflowRoutes";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";

const pageVariants = {
    initial: { opacity: 0, x: -50 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, x: 50, transition: { duration: 0.3 } },
};

const AnimatedRoutes = () => {
    const location = useLocation();

    return (
        <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
                <Route
                    path="/"
                    element={
                        <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
                            <h1>Home</h1>
                        </motion.div>
                    }
                />
                <Route
                    path="/auth/*"
                    element={
                        <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
                            <AuthRoutes />
                        </motion.div>
                    }
                />
                <Route
                    path="/contacts/*"
                    element={
                        <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
                            <ContactRoutes />
                        </motion.div>
                    }
                />
                <Route
                    path="/workflows/*"
                    element={
                        <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
                            <WorkflowRoutes />
                        </motion.div>
                    }
                />
                {/* 404 - Not Found */}
                <Route
                    path="*"
                    element={
                        <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
                            <Error404 />
                        </motion.div>
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
