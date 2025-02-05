import { useState } from "react";
import { toast } from "react-toastify";
import { PopupModal } from "../PopupModal";
import { SidebarLink } from "./SidebarLink";
import { useNavigate } from "react-router-dom";
import "../../../styles/components/sidebar.css";
import { useSidebarStore } from "../../../stores/sidebarStore";

export const Sidebar: React.FC = () => {
    // Inicializar estados y funciones del store
    const { collapsed, toggleSidebar } = useSidebarStore();
    const [showModal, setShowModal] = useState(false);

    const navigate = useNavigate();

    const logout = () => {
        // TODO: Implementar lógica de logout
        toast.warning("Has cerrado sesión...");
        navigate("/auth/login");
    };

    return (
        <div className="sidebar" style={{ width: collapsed ? "60px" : "250px" }}>
            <SidebarLink to="/home" icon="bi bi-house">Home</SidebarLink>
            <SidebarLink to="/dashboard" icon="bi bi-columns">Dashboard</SidebarLink>
            <SidebarLink to="/analytics" icon="bi bi-bar-chart">Analytics</SidebarLink>
            <SidebarLink to="/friends" icon="bi bi-people">Friends</SidebarLink>
            <SidebarLink to="/image" icon="bi bi-image">Images</SidebarLink>

            {/* Logout */}
            <span className="logout-icon" onClick={() => setShowModal(true)}>
                <i className="bi bi-box-arrow-right"></i>
                {!collapsed && <span style={{ fontWeight: '500' }}>Cerrar Sesión</span>}
            </span>

            {/* Colapsar */}
            <span className={`collapse-icon ${collapsed ? "rotate-180" : ""}`} onClick={toggleSidebar}>
                <i className="bi bi-chevron-double-left"></i>
            </span>

            {/* Modal de Logout */}
            {showModal && (
                <PopupModal show={showModal} onClose={() => setShowModal(false)}>
                    <div className="modal-header">
                        <h3>¡Espera!</h3>
                        <span className="scale" onClick={() => setShowModal(false)}>
                            <i className="bi bi-x-circle"></i>
                        </span>
                    </div>
                    <p style={{ fontSize: "large", color: "black" }}>¿De verdad quieres cerrar sesión?</p>
                    <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
                        <button className="btn btn-danger" style={{ width: "45%" }} onClick={() => setShowModal(false)}>Cancelar</button>
                        <button className="btn btn-primary" style={{ width: "45%" }} onClick={logout}>Confirmar</button>
                    </div>
                </PopupModal>
            )}
        </div>
    );
};
