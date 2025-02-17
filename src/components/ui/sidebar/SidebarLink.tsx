import "../../../styles/components/sidebar.css";
import { Link, useLocation } from "react-router-dom";
import { useSidebarStore } from "../../../stores/sidebarStore";

interface SidebarLinkProps {
    to: string;
    icon: string;
    children: React.ReactNode;
}

export const SidebarLink: React.FC<SidebarLinkProps> = ({ to, icon, children }) => {
    const { collapsed } = useSidebarStore();

    const location = useLocation();
    const isActive = location.pathname === to;

    return (
        <Link to={to} className={`sidebar-link ${isActive ? "active" : ""}`} style={{ marginTop: "6px", marginBottom: "6px" }}>
            <i className={icon}></i>

            {/* Mostrar texto condicionalmente */}
            {!collapsed && <span>{children}</span>}
        </Link>
    );
};
