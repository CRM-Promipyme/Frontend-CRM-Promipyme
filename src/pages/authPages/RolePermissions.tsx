import api from "../../controllers/api";
import { toast } from "react-toastify";
import { useState, useEffect } from "react";
import { Role } from "../../types/authTypes";
import { Proceso } from "../../types/workflowTypes";
import { motion, AnimatePresence } from "framer-motion";
import { PopupModal } from "../../components/ui/PopupModal";

interface RolePermissionsProps {
    selectedRole: Role;
    onClose: () => void;
}

interface BasePermissions {
    id: number;
    rol: string;
    visualize_reports: boolean;
    export_reports: boolean;
    modify_contact_fields: boolean;
    create_contacts: boolean;
    delete_contacts: boolean;
    invite_users: boolean;
    see_user_list: boolean;
    approve_accounts: boolean;
    deny_accounts: boolean;
    create_roles: boolean;
    update_roles: boolean;
    delete_roles: boolean;
    create_branches: boolean;
    update_branches: boolean;
    delete_branches: boolean;
}

interface WorkflowPermission {
    id: number;
    rol: string;
    proceso: number;
    etapa: number[];
}

export function RolePermissions({ selectedRole, onClose }: RolePermissionsProps) {
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<string>("base-permissions");
    const [processes, setProcesses] = useState<Proceso[]>([]);
    const [basePermissions, setBasePermissions] = useState<BasePermissions | null>(null);
    const [workflowPermissions, setWorkflowPermissions] = useState<WorkflowPermission[]>([]);

    useEffect(() => {
        const fetchPermissions = async () => {
            try {
                const response = await api.get(`/auth/manage/system-roles/${selectedRole.id_rol}/permissions/`);
                if (response.status === 200) {
                    setBasePermissions(response.data.base_permissions);
                    setWorkflowPermissions(response.data.workflow_permissions);
                }
            } catch (error) {
                toast.error("Error al obtener los permisos del rol.");
                
                // close modal if error occurs
                onClose();
                console.error("Error fetching permissions:", error);
            }
        };
        
        const fetchWorkflows = async () => {
            try {
                const response = await api.get("/workflows/procesos/list");
                if (response.status === 200) {
                    setProcesses(response.data.processes);
                }
            } catch (error) {
                console.error("Error fetching workflows:", error);
            }
        }
        
        fetchPermissions();
        fetchWorkflows();
    }, [selectedRole.id_rol, onClose]);

    const handleUpdate = async () => {
        if (!basePermissions) return;
        setLoading(true);
        try {
            await api.put(`/auth/manage/system-roles/${selectedRole.id_rol}/permissions/`, {
                base_permissions: {
                    visualize_reports: basePermissions.visualize_reports,
                    export_reports: basePermissions.export_reports,
                    modify_contact_fields: basePermissions.modify_contact_fields,
                    create_contacts: basePermissions.create_contacts,
                    delete_contacts: basePermissions.delete_contacts,
                    invite_users: basePermissions.invite_users,
                    see_user_list: basePermissions.see_user_list,
                    approve_accounts: basePermissions.approve_accounts,
                    deny_accounts: basePermissions.deny_accounts,
                    create_roles: basePermissions.create_roles,
                    update_roles: basePermissions.update_roles,
                    delete_roles: basePermissions.delete_roles,
                    create_branches: basePermissions.create_branches,
                    update_branches: basePermissions.update_branches,
                    delete_branches: basePermissions.delete_branches,
                },
                workflow_permissions: workflowPermissions.map(wp => ({
                    proceso: wp.proceso,
                    etapa: wp.etapa
                }))
            });
            toast.success("Permisos actualizados correctamente.");
            onClose();
        } catch {
            toast.error("Error al actualizar los permisos.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <PopupModal show={true} onClose={onClose}>
            <div className="modal-header" style={{ marginBottom: '15px' }}>
                <h3>Editar Rol</h3>
                <span className="scale" onClick={() => onClose()}>
                    <i className="bi bi-x-circle"></i>
                </span>
            </div>
            
            <div className="modal-body">
                <div className="mb-3">
                    <label htmlFor="first_name">Nombre del Rol</label>
                    <input
                        style={{ marginTop: '5px' }}
                        type="text"
                        className="form-control"
                        placeholder="Escribe el nombre del rol aquí..."
                        value={selectedRole?.nombre_rol}
                        readOnly
                    />
                </div>
                
                <div className="user-profile-tabs d-flex bg-light">
                    <button
                        className={`flex-grow-1 btn py-2 ${activeTab === "base-permissions" ? "bg-white" : "secondary-bg"}`}
                        onClick={(e) => {
                            e.preventDefault();
                            setActiveTab("base-permissions");
                        }}
                    >
                        <i className="bi bi-shield-lock"></i> Permisos Base
                    </button>
                    <button
                        className={`flex-grow-1 btn py-2 ${activeTab === "workflow-permissions" ? "bg-white" : "secondary-bg"}`}
                        onClick={(e) => {
                            e.preventDefault();
                            setActiveTab("workflow-permissions");
                        }}
                    >
                        <i className="bi bi-gear"></i> Permisos de Procesos
                    </button>
                </div>
                
                {activeTab === "base-permissions" && basePermissions && (
                    <AnimatePresence mode="wait">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            transition={{ duration: 0.5 }} 
                        >
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "24px", marginTop: "24px", maxWidth: "800px" }}>
                                {/* Reportes */}
                                <div style={{ border: "1px solid #e5e7eb", borderRadius: "12px", padding: "18px", minWidth: "220px" }}>
                                    <div style={{ fontWeight: 500, marginBottom: 8 }}>
                                        <i className="bi bi-file-earmark-bar-graph" style={{ marginRight: 6 }} /> Reportes
                                    </div>
                                    <div>
                                        <div>
                                            <input
                                                type="checkbox"
                                                checked={!!basePermissions.visualize_reports}
                                                onChange={e =>
                                                    setBasePermissions(bp =>
                                                        bp ? { ...bp, visualize_reports: e.target.checked } : bp
                                                    )
                                                }
                                            />{" "}
                                            <span>Visualizar reportes</span>
                                        </div>
                                        <div>
                                            <input
                                                type="checkbox"
                                                checked={!!basePermissions.export_reports}
                                                onChange={e =>
                                                    setBasePermissions(bp =>
                                                        bp ? { ...bp, export_reports: e.target.checked } : bp
                                                    )
                                                }
                                            />{" "}
                                            <span>Exportar reportes</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Contactos */}
                                <div style={{ border: "1px solid #e5e7eb", borderRadius: "12px", padding: "18px", minWidth: "220px" }}>
                                    <div style={{ fontWeight: 500, marginBottom: 8 }}>
                                        <i className="bi bi-people" style={{ marginRight: 6 }} /> Contactos
                                    </div>
                                    <div>
                                        <div>
                                            <input
                                                type="checkbox"
                                                checked={!!basePermissions.modify_contact_fields}
                                                onChange={e =>
                                                    setBasePermissions(bp =>
                                                        bp ? { ...bp, modify_contact_fields: e.target.checked } : bp
                                                    )
                                                }
                                            />{" "}
                                            <span>Modificar campos</span>
                                        </div>
                                        <div>
                                            <input
                                                type="checkbox"
                                                checked={!!basePermissions.create_contacts}
                                                onChange={e =>
                                                    setBasePermissions(bp =>
                                                        bp ? { ...bp, create_contacts: e.target.checked } : bp
                                                    )
                                                }
                                            />{" "}
                                            <span>Crear contactos</span>
                                        </div>
                                        <div>
                                            <input
                                                type="checkbox"
                                                checked={!!basePermissions.delete_contacts}
                                                onChange={e =>
                                                    setBasePermissions(bp =>
                                                        bp ? { ...bp, delete_contacts: e.target.checked } : bp
                                                    )
                                                }
                                            />{" "}
                                            <span>Eliminar contactos</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Gestión de usuarios */}
                                <div style={{ border: "1px solid #e5e7eb", borderRadius: "12px", padding: "18px", minWidth: "220px" }}>
                                    <div style={{ fontWeight: 500, marginBottom: 8 }}>
                                        <i className="bi bi-person-gear" style={{ marginRight: 6 }} /> Gestión de usuarios
                                    </div>
                                    <div>
                                        <div>
                                            <input
                                                type="checkbox"
                                                checked={!!basePermissions.invite_users}
                                                onChange={e =>
                                                    setBasePermissions(bp =>
                                                        bp ? { ...bp, invite_users: e.target.checked } : bp
                                                    )
                                                }
                                            />{" "}
                                            <span>Invitar usuarios</span>
                                        </div>
                                        <div>
                                            <input
                                                type="checkbox"
                                                checked={!!basePermissions.see_user_list}
                                                onChange={e =>
                                                    setBasePermissions(bp =>
                                                        bp ? { ...bp, see_user_list: e.target.checked } : bp
                                                    )
                                                }
                                            />{" "}
                                            <span>Ver lista de usuarios</span>
                                        </div>
                                        <div>
                                            <input
                                                type="checkbox"
                                                checked={!!basePermissions.approve_accounts}
                                                onChange={e =>
                                                    setBasePermissions(bp =>
                                                        bp ? { ...bp, approve_accounts: e.target.checked } : bp
                                                    )
                                                }
                                            />{" "}
                                            <span>Aprobar cuentas</span>
                                        </div>
                                        <div>
                                            <input
                                                type="checkbox"
                                                checked={!!basePermissions.deny_accounts}
                                                onChange={e =>
                                                    setBasePermissions(bp =>
                                                        bp ? { ...bp, deny_accounts: e.target.checked } : bp
                                                    )
                                                }
                                            />{" "}
                                            <span>Denegar cuentas</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Gestión de roles */}
                                <div style={{ border: "1px solid #e5e7eb", borderRadius: "12px", padding: "18px", minWidth: "220px" }}>
                                    <div style={{ fontWeight: 500, marginBottom: 8 }}>
                                        <i className="bi bi-shield-lock" style={{ marginRight: 6 }} /> Gestión de roles
                                    </div>
                                    <div>
                                        <div>
                                            <input
                                                type="checkbox"
                                                checked={!!basePermissions.create_roles}
                                                onChange={e =>
                                                    setBasePermissions(bp =>
                                                        bp ? { ...bp, create_roles: e.target.checked } : bp
                                                    )
                                                }
                                            />{" "}
                                            <span>Crear roles</span>
                                        </div>
                                        <div>
                                            <input
                                                type="checkbox"
                                                checked={!!basePermissions.update_roles}
                                                onChange={e =>
                                                    setBasePermissions(bp =>
                                                        bp ? { ...bp, update_roles: e.target.checked } : bp
                                                    )
                                                }
                                            />{" "}
                                            <span>Actualizar roles</span>
                                        </div>
                                        <div>
                                            <input
                                                type="checkbox"
                                                checked={!!basePermissions.delete_roles}
                                                onChange={e =>
                                                    setBasePermissions(bp =>
                                                        bp ? { ...bp, delete_roles: e.target.checked } : bp
                                                    )
                                                }
                                            />{" "}
                                            <span>Eliminar roles</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Gestión de sucursales */}
                                <div style={{ border: "1px solid #e5e7eb", borderRadius: "12px", padding: "18px", minWidth: "220px" }}>
                                    <div style={{ fontWeight: 500, marginBottom: 8 }}>
                                        <i className="bi bi-building" style={{ marginRight: 6 }} /> Gestión de sucursales
                                    </div>
                                    <div>
                                        <div>
                                            <input
                                                type="checkbox"
                                                checked={!!basePermissions.create_branches}
                                                onChange={e =>
                                                    setBasePermissions(bp =>
                                                        bp ? { ...bp, create_branches: e.target.checked } : bp
                                                    )
                                                }
                                            />{" "}
                                            <span>Crear sucursales</span>
                                        </div>
                                        <div>
                                            <input
                                                type="checkbox"
                                                checked={!!basePermissions.update_branches}
                                                onChange={e =>
                                                    setBasePermissions(bp =>
                                                        bp ? { ...bp, update_branches: e.target.checked } : bp
                                                    )
                                                }
                                            />{" "}
                                            <span>Actualizar sucursales</span>
                                        </div>
                                        <div>
                                            <input
                                                type="checkbox"
                                                checked={!!basePermissions.delete_branches}
                                                onChange={e =>
                                                    setBasePermissions(bp =>
                                                        bp ? { ...bp, delete_branches: e.target.checked } : bp
                                                    )
                                                }
                                            />{" "}
                                            <span>Eliminar sucursales</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                )}
                
                {activeTab === "workflow-permissions" && (
                    <AnimatePresence mode="wait">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                            <div style={{ marginTop: 24 }}>
                                {/* Add Process Dropdown */}
                                <div style={{ marginBottom: 24 }}>
                                    <label style={{ fontWeight: 500, marginRight: 12 }}>Agregar proceso:</label>
                                    <select
                                        style={{ minWidth: 220, marginRight: 12 }}
                                        value=""
                                        onChange={e => {
                                            const processId = parseInt(e.target.value, 10);
                                            const process = processes.find(p => p.id_proceso === processId);
                                            if (process && !workflowPermissions.some(wp => wp.proceso === processId)) {
                                                setWorkflowPermissions(prev => [
                                                    ...prev,
                                                    {
                                                        id: Date.now(), // temp id for frontend
                                                        rol: selectedRole.nombre_rol,
                                                        proceso: processId,
                                                        etapa: []
                                                    }
                                                ]);
                                            }
                                        }}
                                    >
                                        <option value="">Selecciona un proceso...</option>
                                        {processes
                                            .filter(p => !workflowPermissions.some(wp => wp.proceso === p.id_proceso))
                                            .map(p => (
                                                <option key={p.id_proceso} value={p.id_proceso}>
                                                    {p.nombre_proceso}
                                                </option>
                                            ))}
                                    </select>
                                </div>

                                {/* List of Workflow Permissions */}
                                {workflowPermissions.length === 0 && (
                                    <div className="text-muted" style={{ marginTop: 16 }}>
                                        No hay permisos de procesos agregados.
                                    </div>
                                )}
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "24px" }}>
                                    {workflowPermissions.map((perm, idx) => {
                                        const process = processes.find(p => p.id_proceso === perm.proceso);
                                        if (!process) return null;
                                        return (
                                            <div
                                                key={perm.proceso}
                                                style={{
                                                    border: "1px solid #e5e7eb",
                                                    borderRadius: "12px",
                                                    padding: "18px",
                                                    minWidth: "260px",
                                                    background: "#fafbfc",
                                                    position: "relative"
                                                }}
                                            >
                                                <div style={{ fontWeight: 500, marginBottom: 8, color: process.color }}>
                                                    <i className="bi bi-diagram-3" style={{ marginRight: 6 }} />
                                                    {process.nombre_proceso}
                                                </div>
                                                <div style={{ marginBottom: 8, fontSize: 13, color: "#888" }}>
                                                    Selecciona las etapas permitidas:
                                                </div>
                                                <div style={{ marginBottom: 8 }}>
                                                    {process.etapas.map(etapa => (
                                                        <div key={etapa.id_etapa}>
                                                            <input
                                                                type="checkbox"
                                                                checked={perm.etapa.includes(etapa.id_etapa)}
                                                                onChange={e => {
                                                                    setWorkflowPermissions(prev =>
                                                                        prev.map((wp, i) =>
                                                                            i === idx
                                                                                ? {
                                                                                    ...wp,
                                                                                    etapa: e.target.checked
                                                                                        ? [...wp.etapa, etapa.id_etapa]
                                                                                        : wp.etapa.filter(id => id !== etapa.id_etapa)
                                                                                }
                                                                                : wp
                                                                        )
                                                                    );
                                                                }}
                                                            />{" "}
                                                            <span>{etapa.nombre_etapa}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                                <button
                                                    className="btn btn-sm btn-outline-danger"
                                                    style={{ position: "absolute", top: 10, right: 10 }}
                                                    onClick={() => {
                                                        setWorkflowPermissions(prev =>
                                                            prev.filter((_, i) => i !== idx)
                                                        );
                                                    }}
                                                >
                                                    <i className="bi bi-trash"></i>
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                )}
            </div>

            <div className="modal-actions" style={{ marginTop: "20px", gap: '15px', display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn-secondary" onClick={onClose} disabled={loading}>
                    Cancelar
                </button>
                <button className="btn btn-primary" onClick={handleUpdate} disabled={loading}>
                    {loading ? <span className="spinner-border spinner-border-sm" /> : "Actualizar"}
                </button>
            </div>
        </PopupModal>
    );
}