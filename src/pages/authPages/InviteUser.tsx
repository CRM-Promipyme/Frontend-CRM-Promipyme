import axios from 'axios';
import { toast } from 'react-toastify';
import { useState, useEffect } from 'react';
import { Role } from '../../types/authTypes';
import { fetchRoles } from '../../utils/authUtils';
import { useAuthStore } from '../../stores/authStore';
import { Spinner } from '../../components/ui/Spinner';
import { Multiselect } from "multiselect-react-dropdown"; // Import the multiselect
import { useSidebarStore } from '../../stores/sidebarStore';
import { SidebarLayout } from '../../components/layouts/SidebarLayout';

export function InviteUser() {
    // Estados globales
    const sidebarWidthPx = useSidebarStore((state) => state.sidebarWidthPx);
    const accessToken = useAuthStore((state) => state.accessToken);

    // Estados locales 
    const [loading, setLoading] = useState(false);
    const [roles, setRoles] = useState<Role[]>([]);
    const [selectedRoles, setSelectedRoles] = useState<Role[]>([]);
    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        email: "",
    });
    const BASE_URL = import.meta.env.VITE_REACT_APP_DJANGO_API_URL;

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    }

    // Fetch roles al cargar el componente
    useEffect(() => {
        if (!accessToken) {
            toast.error("Tu sesión ha caducado. Por favor, inicia sesión nuevamente para continuar.");
            return;
        }
    
        // No hacer nada si ya se cargaron los roles
        if (roles.length > 0) return;
    
        const loadRoles = async () => {
            try {
                const rolesData = await fetchRoles(accessToken);
                setRoles(rolesData);
                setSelectedRoles([]);
            } catch {
                toast.error("No se pudieron obtener los roles.");
            }
        };
    
        loadRoles();
    }, [accessToken, roles.length]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Map an array of role IDs from the selected roles
        const rol_ids = selectedRoles.map((role) => role.id_rol);

        axios.post(
            `${BASE_URL}/auth/accounts/invite/`,
            { ...formData, rol_ids: rol_ids },
            { headers: { "Authorization": `Bearer ${accessToken}` } }
        )
            .then(() => {
                toast.success("¡Usuario invitado exitosamente!");
                
                // Limpiar el formulario después de enviar la solicitud
                setFormData({
                    first_name: "",
                    last_name: "",
                    email: "",
                });
                setSelectedRoles([]);
            })
            .catch((error) => {
                // Mostrar mensajes de error
                const data = error.response?.data;

                // Verificar si hubieron errores puntuales en la solicitud
                if (data?.errors) {
                    const errorMap = data.errors as Record<string, string[]>;
                        Object.values(errorMap).forEach((errorArray) => {
                        errorArray.forEach((errMsg) => toast.error(errMsg));
                    });
                } else if (data?.message) {
                    // Mostrar un mensaje de error genérico
                    toast.error(data.message);
                } else {
                    toast.error("Ha ocurrido un error al invitar este usuario. Por favor, intenta más tarde.");
                }
            })
            .finally(() => {
                setLoading(false);
            });
    }

    return (
        // TODO: Re-visit styling for this form
        <SidebarLayout sidebarWidthPx={sidebarWidthPx}>
            <h1 className="page-title" style={{ marginBottom: '0px' }}>Invitar un Nuevo Usuario al Sistema</h1>
            <div className="invite-user-form-card card-body">
                <p>Por favor, ingresa los datos del usuario que deseas invitar al sistema:</p>

                <form
                    className="auth-login-form"
                    style={{ textAlign: "left", lineHeight: '2', width: '100%' }}
                    onSubmit={handleSubmit}
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
                    <Multiselect
                        options={roles}
                        selectedValues={selectedRoles}
                        onSelect={setSelectedRoles}
                        onRemove={setSelectedRoles}
                        displayValue="nombre_rol"
                        placeholder="Selecciona sus roles"
                        showArrow
                        closeOnSelect={false}
                        className="multi-select-dropdown"
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
                        className="btn btn-primary"
                    >
                        {loading ? <Spinner /> : "Invitar Usuario"}
                    </button>
                </form>
            </div>
        </SidebarLayout>
    )
}