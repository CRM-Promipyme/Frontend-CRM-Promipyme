import React, { ReactNode } from "react";
import { motion } from "framer-motion";
import { Sidebar } from "../ui/sidebar/Sidebar";
import "../../styles/components/sidebarLayout.css";

interface SidebarLayoutProps {
    children: ReactNode;
    sidebarWidthPx: string;
}

const pageVariants = {
    initial: {
        opacity: 0,
        y: 20,
    },
    animate: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.3,
            ease: "easeOut",
        },
    },
    exit: {
        opacity: 0,
        y: -20,
        transition: {
            duration: 0.2,
            ease: "easeIn",
        },
    },
};

export const SidebarLayout: React.FC<SidebarLayoutProps> = ({ children, sidebarWidthPx }) => {
    return (
        <div className="page">
            <Sidebar />

            <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
                <div className="page-content" style={{ marginLeft: sidebarWidthPx }}>
                    {children}
                </div>
            </motion.div>
        </div>
    );
};
