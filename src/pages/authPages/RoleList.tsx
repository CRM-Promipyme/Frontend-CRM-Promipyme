import { toast } from "react-toastify";
import { Role } from "../../types/authTypes";
import { fetchRoles } from '../../utils/authUtils';
import { useEffect, useState, useRef } from "react";
import { useAuthStore } from "../../stores/authStore";
import { Spinner } from "../../components/ui/Spinner";
import { useSidebarStore } from "../../stores/sidebarStore"
import { PopupModal } from "../../components/ui/PopupModal";
import { SidebarLayout } from "../../components/layouts/SidebarLayout"
import { AnimatedNumberCounter } from "../../components/ui/AnimatedNumberCounter";

export function RoleList() {
    // Estados globales
    const sidebarWidthPx = useSidebarStore((state) => state.sidebarWidthPx)
    const accessToken = useAuthStore((state) => state.accessToken);

    // Estados locales
    const [loading, setLoading] = useState<boolean>(false);
    const [roles, setRoles] = useState<Role[]>([]);
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    const [showModal, setShowModal] = useState<boolean>(false);
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

    const handleEditModal = async (role: Role) => {
        setModalType("update");
        setSelectedRole(role);

        if (!accessToken) {
            toast.error("Tu sesión ha caducado. Por favor, inicia sesión nuevamente para continuar.");
            return;
        }

        setShowModal(true);
    };

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

    const handleEdit = async () => {
        if (!selectedRole) return;

        try {
            const response = await fetch(`${import.meta.env.VITE_REACT_APP_DJANGO_API_URL}/auth/manage/system-roles/${selectedRole.id_rol}/`, {
                method: "PUT",
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

            toast.success("Nueva información de rol guardada exitosamente.");
            setShowModal(false);
            
            // Re-fetch roles
            setLoading(true);
            await loadRoles();
            setLoading(false);
            
        } catch (error) {
            if (error instanceof Error) {
                toast.error(`${error.message}`);
            } else {
                toast.error("Ha ocurrido un error al guardar la información del rol, por favor, intente más tarde...");
            }
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

    return (
        <SidebarLayout sidebarWidthPx={sidebarWidthPx}>
            <h1 className="page-title">
                Roles Registrados en el Sistema

                <span className="badge bg-promipyme ms-2">
                    <AnimatedNumberCounter value={roles.length} />
                </span>
            </h1>

            <div className="table-actions-container">
                <button className="btn btn-primary" onClick={() => { setModalType("create"); setSelectedRole({ id_rol: 0, nombre_rol: "" }); setShowModal(true); }}>
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
                <div className="table-responsive">
                    <table className="table table-bordered rounded-borders">
                        {/* TODO: Consider adding more information: Last updated at, etc. */}
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th><i className="bi bi-type"></i> Nombre</th>
                                <th>Permisos</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRoles.length > 0 ? (
                                filteredRoles.map((role) => (
                                    <tr key={role.id_rol}>
                                        <td>{role.id_rol}</td>
                                        <td>{role.nombre_rol || "—"}</td>
                                        <td></td>
                                        {/* TODO: Permisos de rol */}
                                        <td className="row-action-container">
                                            <button className="btn btn-sm btn-outline-primary" onClick={() => handleEditModal(role)}>
                                                <i className="bi bi-pencil"></i> Editar
                                            </button>
                                            <button className="btn btn-sm btn-outline-danger" onClick={() => { setModalType("delete"); setSelectedRole(role); setShowModal(true); }}>
                                                <i className="bi bi-trash"></i> Eliminar
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan={7} className="text-center">No hay cuentas actualmente.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {showModal && (
                <PopupModal show={showModal} onClose={() => setShowModal(false)}>
                    <div className="modal-header" style={{ marginBottom: '15px'}}>
                        {modalType === "create" && (
                            <h3>Crear Nuevo Rol</h3>
                        )}
                        {modalType === "update" && (
                            <h3>Editar Rol</h3>
                        )}
                        {modalType === "delete" && (
                            <h3>Eliminar Rol</h3>
                        )}
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
                                style={{ marginTop: '5px'}}
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
                        <div className="modal-actions" style={{ marginTop: "20px", display: 'flex', justifyContent: 'space-around' }}>
                            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                            <button className="btn btn-primary" onClick={handleCreate}>Crear</button>
                        </div>
                    )}
                
                    {modalType === "update" && (
                        <div className="modal-actions" style={{ marginTop: "20px", display: 'flex', justifyContent: 'space-around' }}>
                            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                            <button className="btn btn-primary" onClick={handleEdit}>Guardar</button>
                        </div>
                    )} 
                    
                    {modalType === "delete" && (
                        <>
                            <p>¿Estás seguro de que deseas eliminar este rol?</p>
                            <div className="modal-actions" style={{ marginTop: "20px", display: 'flex', justifyContent: 'space-around' }}>
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