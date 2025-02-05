import React, { ReactNode } from "react";
import { Sidebar } from "../ui/sidebar/Sidebar";
import "../../styles/components/sidebarLayout.css";

interface SidebarLayoutProps {
    children: ReactNode;
    sidebarWidthPx: string;
}

export const SidebarLayout: React.FC<SidebarLayoutProps> = ({ children, sidebarWidthPx }) => {
    return (
        <div className="page">
            <Sidebar />
            <div className="page-content" style={{ marginLeft: sidebarWidthPx }}>
                {children}
            </div>
        </div>
    );
};
