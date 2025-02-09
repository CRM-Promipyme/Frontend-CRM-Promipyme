import React from "react";
import "../../../styles/components/filterSidebar.css";

interface FilterSidebarProps {
    show: boolean;
    onClose: () => void;
    children: React.ReactNode;
}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({ show, onClose, children }) => {
    return (
        <div className={`filter-sidebar shadow-lg ${show ? "open" : ""}`}>
            {/* Sidebar Header */}
            <div className="filter-sidebar-header">
                <h3>Filtros</h3>
                <button className="btn-close" onClick={onClose}>
                    <i className="bi bi-x"></i>
                </button>
            </div>

            {/* Sidebar Content */}
            <div className="filter-sidebar-content">{children}</div>

            {/* Sidebar Footer */}
            <div className="filter-sidebar-footer">
                <button className="btn btn-secondary" onClick={onClose}>Cerrar</button>
            </div>
        </div>
    );
};
