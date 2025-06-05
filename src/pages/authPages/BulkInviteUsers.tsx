import Select from 'react-select';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useState, useEffect } from 'react';
import { Role } from '../../types/authTypes';
import { fetchRoles } from '../../utils/authUtils';
import { useAuthStore } from '../../stores/authStore';
import { Spinner } from '../../components/ui/Spinner';
import { useSidebarStore } from '../../stores/sidebarStore';
import { SidebarLayout } from '../../components/layouts/SidebarLayout';

export function BulkInviteUsers() {
    const sidebarWidthPx = useSidebarStore((state) => state.sidebarWidthPx);
    const accessToken = useAuthStore((state) => state.accessToken);

    const [loading, setLoading] = useState(false);
    const [roles, setRoles] = useState<Role[]>([]);
    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        email: "",
        roles: [] as Role[],
    });
    const [users, setUsers] = useState<any[]>([]);
    const BASE_URL = import.meta.env.VITE_VERCEL_REACT_APP_DJANGO_API_URL;

    useEffect(() => {
        if (!accessToken) {
            toast.error("Tu sesión ha caducado. Por favor, inicia sesión nuevamente para continuar.");
            return;
        }
        if (roles.length > 0) return;
        const loadRoles = async () => {
            try {
                const rolesData = await fetchRoles(accessToken);
                setRoles(rolesData);
            } catch {
                toast.error("No se pudieron obtener los roles.");
            }
        };
        loadRoles();
    }, [accessToken, roles.length]);

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    }

    function handleAddUser(e: React.FormEvent) {
        e.preventDefault();
        if (!formData.first_name || !formData.last_name || !formData.email || formData.roles.length === 0) {
            toast.error("Completa todos los campos y selecciona al menos un rol.");
            return;
        }
        setUsers([...users, { ...formData }]);
        setFormData({ first_name: "", last_name: "", email: "", roles: [] });
    }

    async function handleBulkInvite() {
        setLoading(true);
        let successCount = 0;
        for (const user of users) {
            try {
                await axios.post(
                    `${BASE_URL}/auth/accounts/invite/`,
                    {
                        first_name: user.first_name,
                        last_name: user.last_name,
                        email: user.email,
                        rol_ids: user.roles.map((role: Role) => role.id_rol),
                    },
                    { headers: { "Authorization": `Bearer ${accessToken}` } }
                );
                successCount++;
                toast.success(`Invitación enviada a ${user.email}`);
            } catch (error: any) {
                const data = error.response?.data;
                if (data?.errors) {
                    const errorMap = data.errors as Record<string, string[]>;
                    Object.values(errorMap).forEach((errorArray) => {
                        errorArray.forEach((errMsg) => toast.error(`${user.email}: ${errMsg}`));
                    });
                } else if (data?.message) {
                    toast.error(`${user.email}: ${data.message}`);
                } else {
                    toast.error(`Error al invitar a ${user.email}`);
                }
            }
        }
        setLoading(false);
        if (successCount > 0) {
            setUsers([]);
        }
    }

    return (
        <SidebarLayout sidebarWidthPx={sidebarWidthPx}>
            <h1 className="page-title" style={{ marginBottom: '0px' }}>Invitar Usuarios en Masa</h1>
            <div className="invite-user-form-card card-body">
                <p>Agrega los usuarios que deseas invitar, luego haz clic en "Enviar Invitaciones".</p>
                <form
                    className="auth-login-form"
                    style={{ textAlign: "left", lineHeight: '2', width: '100%' }}
                    onSubmit={handleAddUser}
                >
                    <label htmlFor="first_name">Nombres</label>
                    <input
                        style={{ marginBottom: "15px" }}
                        type="text"
                        name="first_name"
                        className="form-control"
                        id="first_name"
                        value={formData.first_name}
                        onChange={handleChange}
                        placeholder="Escribe sus nombres aquí..."
                        required
                    />

                    <label htmlFor="last_name">Apellidos</label>
                    <input
                        style={{ marginBottom: "15px" }}
                        type="text"
                        name="last_name"
                        className="form-control"
                        id="last_name"
                        value={formData.last_name}
                        onChange={handleChange}
                        placeholder="Escribe sus apellidos aquí..."
                        required
                    />

                    <label htmlFor="email">Correo Electrónico</label>
                    <input
                        style={{ marginBottom: "15px" }}
                        type="text"
                        name="email"
                        className="form-control"
                        id="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Escribe su correo electrónico aquí..."
                        required
                    />

                    <label htmlFor="roles">Roles del Usuario</label>
                    <Select
                        isMulti
                        options={roles}
                        value={formData.roles}
                        onChange={(selectedOptions) => {
                            setFormData(prev => ({ ...prev, roles: [...selectedOptions] }));
                        }}
                        getOptionLabel={(option: Role) => option.nombre_rol}
                        getOptionValue={(option: Role) => String(option.id_rol)}
                        placeholder="Selecciona sus roles"
                        className="react-select-container"
                        classNamePrefix="react-select"
                    />
                    <button
                        style={{
                            width: '100%',
                            height: '45px',
                            marginTop: '2rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px'
                        }}
                        type="submit"
                        className="btn btn-outline-primary"
                        disabled={loading}
                    >
                        Agregar Usuario a la Lista
                    </button>
                </form>

                {users.length > 0 && (
                    <div
                        style={{
                            marginTop: "2rem",
                            background: "#fff",
                            borderRadius: "12px",
                            boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
                            padding: "2rem",
                            border: "1px solid #e5e7eb"
                        }}
                    >
                        <div style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "10px" }}>
                            <i className="bi bi-people" style={{ fontSize: "1.5rem", color: "#0d6efd" }}></i>
                            <div>
                                <h5 style={{ margin: 0, fontWeight: 600 }}>Usuarios a Invitar</h5>
                                <span style={{ color: "#6c757d", fontSize: "0.95rem" }}>
                                    {users.length} usuario{users.length > 1 ? "s" : ""} listo{users.length > 1 ? "s" : ""} para invitar
                                </span>
                            </div>
                        </div>
                        <div style={{ overflowX: "auto" }}>
                            <table className="table" style={{ minWidth: 600 }}>
                                <thead>
                                    <tr style={{ background: "#f8fafc" }}>
                                        <th style={{ fontWeight: 700, fontSize: "1rem" }}>Nombres</th>
                                        <th style={{ fontWeight: 700, fontSize: "1rem" }}>Apellidos</th>
                                        <th style={{ fontWeight: 700, fontSize: "1rem" }}>Email</th>
                                        <th style={{ fontWeight: 700, fontSize: "1rem" }}>Roles</th>
                                        <th style={{ fontWeight: 700, fontSize: "1rem" }}>Acción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user, idx) => (
                                        <tr
                                            key={idx}
                                            style={{
                                                background: idx % 2 === 0 ? "#f9fafb" : "#fff",
                                                verticalAlign: "middle"
                                            }}
                                        >
                                            <td style={{ fontWeight: 500 }}>{user.first_name}</td>
                                            <td style={{ fontWeight: 500 }}>{user.last_name}</td>
                                            <td>
                                                <span
                                                    style={{
                                                        background: "#f1f5f9",
                                                        borderRadius: "6px",
                                                        padding: "2px 8px",
                                                        fontFamily: "monospace",
                                                        fontSize: "0.97em"
                                                    }}
                                                >
                                                    {user.email}
                                                </span>
                                            </td>
                                            <td>
                                                <span
                                                    style={{
                                                        background: "#f3e8ff",
                                                        color: "#a21caf",
                                                        borderRadius: "6px",
                                                        padding: "2px 10px",
                                                        fontWeight: 600,
                                                        fontSize: "0.97em"
                                                    }}
                                                >
                                                    {user.roles.map((r: Role) => r.nombre_rol).join(", ")}
                                                </span>
                                            </td>
                                            <td>
                                                <button
                                                    className="btn btn-sm"
                                                    style={{
                                                        background: "#fee2e2",
                                                        color: "#b91c1c",
                                                        borderRadius: "6px",
                                                        fontWeight: 600,
                                                        fontSize: "0.97em",
                                                        padding: "4px 12px"
                                                    }}
                                                    onClick={() => setUsers(users.filter((_, i) => i !== idx))}
                                                    disabled={loading}
                                                >
                                                    Quitar
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <button
                            className="btn btn-primary"
                            style={{ width: "100%", marginTop: "1rem" }}
                            onClick={handleBulkInvite}
                            disabled={loading}
                        >
                            {loading ? <Spinner /> : "Enviar Invitaciones"}
                        </button>
                    </div>
                )}
            </div>
        </SidebarLayout>
    );
}