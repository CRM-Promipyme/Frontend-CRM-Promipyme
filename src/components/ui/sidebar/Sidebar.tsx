import { useState } from "react";
import { toast } from "react-toastify";
import { PopupModal } from "../PopupModal";
import { SidebarLink } from "./SidebarLink";
import { useNavigate } from "react-router-dom";
import "../../../styles/components/sidebar.css";
import { useAuthStore } from "../../../stores/authStore";
import { useSidebarStore } from "../../../stores/sidebarStore";

export const Sidebar: React.FC = () => {
    // Inicializar estados y funciones del store
    const { collapsed, toggleSidebar } = useSidebarStore();
    const [showModal, setShowModal] = useState(false);
    const authStore = useAuthStore();
    const userId = authStore.userId;
    const navigate = useNavigate();

    const logout = () => {
        toast.warning("Has cerrado sesión...");

        // Cerrar sesión
        authStore.logout();

        navigate("/auth/login");
    };

    const sidebarItems = [
        { to: "/auth/auth-menu", icon: "bi bi-people", text: "Usuarios" },
        { to: `/auth/user/profile/${userId}`, icon: "bi bi-person-circle", text: "Mi Perfil" }
    ];

    return (
        <div className="sidebar shadow-lg" style={{ width: collapsed ? "60px" : "250px" }}>
            {/* Logo */}
            {!collapsed && (
                <div className="logo" style={{ marginBottom: "20px" }}>
                    <img src="/assets/logo_promipyme_white.png" alt="Logo" style={{ width: '235px' }} />
                </div>
            )}

            {/* Links */}
            {sidebarItems.map((item, index) => (
                <SidebarLink key={index} to={item.to} icon={item.icon}>
                    {item.text}
                </SidebarLink>
            ))}
            
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
