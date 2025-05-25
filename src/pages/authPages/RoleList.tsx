import { toast } from "react-toastify";
import { BasePermissions, Role, RolePermission } from "../../types/authTypes";
import { fetchRoles } from '../../utils/authUtils';
import { useEffect, useState, useRef } from "react";
import { RolePermissions } from "./RolePermissions";
import { useAuthStore } from "../../stores/authStore";
import { Spinner } from "../../components/ui/Spinner";
import { useSidebarStore } from "../../stores/sidebarStore"
import { PopupModal } from "../../components/ui/PopupModal";
import { SidebarLayout } from "../../components/layouts/SidebarLayout"
import { AnimatedNumberCounter } from "../../components/ui/AnimatedNumberCounter";

export function RoleList() {
    // Estados globales
    const sidebarWidthPx = useSidebarStore((state) => state.sidebarWidthPx)
    const authStore = useAuthStore();
    const accessToken = useAuthStore((state) => state.accessToken);

    // Estados locales
    const [loading, setLoading] = useState<boolean>(false);
    const [roles, setRoles] = useState<Role[]>([]);
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    const [showModal, setShowModal] = useState<boolean>(false);
    const [showPermissionsModal, setShowPermissionsModal] = useState(false);
    const [modalType, setModalType] = useState<"update" | "delete" | "create">("update");

    const [searchName, setSearchName] = useState<string>("");
    const [filteredRoles, setFilteredRoles] = useState<Role[]>([]);
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);

    // Fetch Roles only once
    useEffect(() => {
        if (!accessToken || roles.length > 0) return;
        setLoading(true);

        const loadRoles = async () => {
            try {
                const rolesData = await fetchRoles(accessToken);
                setRoles(rolesData);
                setFilteredRoles(rolesData);
            } catch {
                toast.error("No se pudieron obtener los roles.");
            }
        };

        loadRoles();
        setLoading(false);
    }, [accessToken, roles]);

    // Filter roles on search input change
    useEffect(() => {
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }
        debounceTimer.current = setTimeout(() => {
            const filtered = roles.filter((role) => role.nombre_rol.toLowerCase().includes(searchName.toLowerCase()));
            setFilteredRoles(filtered);
        }, 500);
        
        return () => {
            if (debounceTimer.current) clearTimeout(debounceTimer.current);
        };
    }, [searchName, roles]);

    const loadRoles = async () => {
        try {
            const rolesData = await fetchRoles(accessToken || '');
            setRoles(rolesData);
            setFilteredRoles(rolesData);
        } catch {
            toast.error("No se pudieron obtener los roles.");
        }
    };

    const handleDelete = async () => {
        if (!selectedRole) return;

        try {
            const response = await fetch(`${import.meta.env.VITE_REACT_APP_DJANGO_API_URL}/auth/manage/system-roles/${selectedRole.id_rol}/`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message);
            }

            toast.warning("Rol eliminado.");
            setShowModal(false);

            // Re-fetch roles
            setLoading(true);
            await loadRoles();
            setLoading(false);
        } catch (error) {
            if (error instanceof Error) {
                toast.error(`${error.message}`);
            } else {
                toast.error("Ha ocurrido un error al eliminar el rol, por favor, intente más tarde...");
            }
        }
    };

    const handleCreate = async () => {
        if (!selectedRole) return;

        try {
            const response = await fetch(`${import.meta.env.VITE_REACT_APP_DJANGO_API_URL}/auth/manage/system-roles/create/`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ 
                    nombre_rol: selectedRole.nombre_rol
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message);
            }

            toast.success("Nuevo rol creado exitosamente.");
            setShowModal(false);

            // Re-fetch roles
            setLoading(true);
            await loadRoles();
            setLoading(false);
        } catch (error) {
            if (error instanceof Error) {
                toast.error(`${error.message}`);
            } else {
                toast.error("Ha ocurrido un error al crear el rol, por favor, intente más tarde...");
            }
        }
    };

    const handleModalTypeChange = async (requiredPermission: keyof BasePermissions, modalType: "update" | "delete" | "create") => {
        // Allow admins to always proceed
        if (authStore.isAdmin && authStore.isAdmin()) {
            if (modalType === "update") {
                return true;
            } else {
                setModalType(modalType);
                setShowModal(true);
                return true;
            }
        }
        
        const permissions = await authStore.retrievePermissions();
        const hasPermission = permissions.some((perm: RolePermission) =>
            perm.base_permissions &&
            perm.base_permissions[requiredPermission] === true
        );
        if (!hasPermission) {
            toast.warning("No tienes permisos para realizar esta acción.");
            return false;
        } else {
            if (modalType === "update") {
                return true;
            } else {
                setModalType(modalType);
                setShowModal(true);
                return true;
            }
        }
    };

    return (
        <SidebarLayout sidebarWidthPx={sidebarWidthPx}>
            <h1 className="page-title">
                Roles Registrados en el Sistema

                <span className="badge bg-promipyme ms-2">
                    <AnimatedNumberCounter value={roles.length} />
                </span>
            </h1>

            <div className="table-actions-container">
                <button className="btn btn-primary" onClick={() => { 
                        handleModalTypeChange("create_roles", "create");
                        setSelectedRole({ id_rol: 0, nombre_rol: "" });
                    }}
                >
                    <i className="bi bi-plus"></i> Crear Nuevo Rol
                </button>
                <input
                    type="text"
                    className="form-control text-search"
                    placeholder="Filtrar por nombre..."
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                />
            </div>

            {loading ? (
                <Spinner />
            ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "24px", marginTop: "24px", marginLeft: "30px" }}>
                    {filteredRoles.length > 0 ? (
                        filteredRoles.map((role) => (
                            <div
                                key={role.id_rol}
                                style={{
                                    border: "1px solid #e5e7eb",
                                    borderRadius: "12px",
                                    padding: "24px",
                                    minWidth: "260px",
                                    background: "#fff",
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "space-between"
                                }}
                            >
                                <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>
                                    {role.nombre_rol || "—"}
                                </div>
                                <div style={{ color: "#888", fontSize: 13, marginBottom: 16 }}>
                                    ID: {role.id_rol}
                                </div>
                                <div style={{ display: "flex", gap: "10px" }}>
                                    <button
                                        className="btn btn-sm btn-outline-primary"
                                        // onClick={() => { setSelectedRole(role); setShowPermissionsModal(true); }}
                                        onClick={async () => {
                                            if (await handleModalTypeChange("update_roles", "update")) {
                                                setSelectedRole(role);
                                                setShowPermissionsModal(true);
                                            }
                                        }}
                                    >
                                        <i className="bi bi-pencil"></i> Editar
                                    </button>
                                    <button
                                        className="btn btn-sm btn-outline-danger"
                                        // onClick={() => { setModalType("delete"); setSelectedRole(role); setShowModal(true); }}
                                        onClick={() => {
                                            handleModalTypeChange("delete_roles", "delete");
                                            setSelectedRole(role);
                                        }}
                                    >
                                        <i className="bi bi-trash"></i> Eliminar
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center w-100">No hay roles actualmente.</div>
                    )}
                </div>
            )}

            {/* Modal de permisos */}
            {showPermissionsModal && selectedRole && (
                <RolePermissions
                    selectedRole={selectedRole}
                    onClose={() => setShowPermissionsModal(false)}
                />
            )}

            {/* Modal de edición */}

            {showModal && (
                <PopupModal show={showModal} onClose={() => setShowModal(false)}>
                    <div className="modal-header" style={{ marginBottom: '15px' }}>
                        { modalType === "create" ? <h3>Crear Rol</h3> : null }
                        { modalType === "delete" ? <h3>Eliminar Rol</h3> : null }
                        <span className="scale" onClick={() => setShowModal(false)}>
                            <i className="bi bi-x-circle"></i>
                        </span>
                    </div>

                    {/* Información del rol */}
                    <div className="modal-body">
                        {modalType === "create" && (
                            <p>Llena el siguiente formulario para crear un rol.</p>
                        )}

                        <div className="mb-3">
                            <label htmlFor="first_name">Nombre del Rol</label>
                            <input
                                style={{ marginTop: '5px' }}
                                type="text"
                                className="form-control"
                                placeholder="Escribe el nombre del rol aquí..."
                                value={selectedRole?.nombre_rol}
                                onChange={(e) => setSelectedRole({ ...selectedRole!, nombre_rol: e.target.value })}
                                disabled={modalType === "delete"}
                            />
                        </div>
                    </div>

                    {modalType === "create" && (
                        <div className="modal-actions" style={{ marginTop: "20px", gap: '15px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                            <button className="btn btn-primary" onClick={handleCreate}>Crear</button>
                        </div>
                    )}

                    {modalType === "delete" && (
                        <>
                            <p>¿Estás seguro de que deseas eliminar este rol?</p>
                            <div className="modal-actions" style={{ marginTop: "20px", gap: '15px', display: 'flex', justifyContent: 'flex-end' }}>
                                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                                <button className="btn btn-danger" onClick={handleDelete}>Eliminar</button>
                            </div>
                        </>
                    )}
                </PopupModal>
            )}
        </SidebarLayout>
    )
}