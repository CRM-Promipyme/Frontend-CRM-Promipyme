import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Role } from "../../types/authTypes";
import '../../styles/auth/profileViewStyles.css';
import { fetchRoles } from '../../utils/authUtils';
import { formatKey } from "../../utils/formatUtils";
import Multiselect from "multiselect-react-dropdown";
import { useAuthStore } from "../../stores/authStore";
import { Spinner } from "../../components/ui/Spinner";
import { useSidebarStore } from "../../stores/sidebarStore";
import { SidebarLayout } from "../../components/layouts/SidebarLayout";

interface UserProfile {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    username: string;
    is_active: boolean;
    roles: { nombre_rol: string; id_rol: number }[];
    profile_data: Record<string, unknown>;
}

export function UserProfileView() {
    // Estados Globales
    const sidebarWidthPx = useSidebarStore((state) => state.sidebarWidthPx);
    const authStore = useAuthStore();
    const accessToken = authStore.accessToken;

    // Get the user ID from the route params
    const { userId } = useParams<{ userId: string; }>();

    // Estados Locales
    const [loading, setLoading] = useState<boolean>(true);
    const [userData, setUserData] = useState<UserProfile | null>(null);
    const [editMode, setEditMode] = useState<boolean>(false);
    const [formData, setFormData] = useState<Record<string, unknown>>({});
    const [profilePicture, setProfilePicture] = useState<string | null>(null);
    const [roles, setRoles] = useState<Role[]>([]);
    const [selectedRoles, setSelectedRoles] = useState<Role[]>([]);

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

    // Show edit functionality only if the user is the same as the logged in user, or if the user is an admin
    const canEdit = userId && (authStore.userId === parseInt(userId) || authStore.isAdmin());

    useEffect(() => {
        if (!userId || !accessToken) return;
    
        const fetchUserData = async () => {
            try {
                const response = await fetch(
                    `${import.meta.env.VITE_REACT_APP_DJANGO_API_URL}/auth/users/detail/${userId}`,
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                            "Content-Type": "application/json",
                        },
                    }
                );
    
                if (!response.ok) throw new Error("Failed to fetch user data");
    
                const data: UserProfile = await response.json();
                setUserData(data);
    
                setFormData({
                    first_name: data.first_name,
                    last_name: data.last_name,
                    email: data.email,
                    username: data.username,
                    profile_data_update: { ...data.profile_data },
                    role_ids: data.roles.map((role) => role.id_rol),
                });

                // Track selected roles with current user roles
                setSelectedRoles(data.roles);
    
                const fotoPerfil = data.profile_data?.foto_perfil;
                if (typeof fotoPerfil === "string" && fotoPerfil.startsWith("http")) {
                    setProfilePicture(fotoPerfil);
                } else {
                    setProfilePicture(null); // Use default image if missing or invalid
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
            } finally {
                setLoading(false);
            }
        };
    
        fetchUserData();
    }, [userId, accessToken]);

    // Handle input changes
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        if (id in (formData.profile_data_update as Record<string, unknown>)) {
            setFormData((prev) => ({
                ...prev,
                profile_data_update: { ...(prev.profile_data_update as Record<string, unknown>), [id]: value },
            }));
        } else {
            setFormData((prev) => ({ ...prev, [id]: value }));
        }
    };

    // Handle Profile Picture Upload
    const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const base64String = event.target?.result as string;
                setProfilePicture(base64String);
                setFormData((prev) => ({
                    ...prev,
                    profile_data_update: {
                        ...(prev.profile_data_update as Record<string, unknown>),
                        foto_perfil: base64String,
                    },
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const toggleEditMode = () => {
        setEditMode((prev) => !prev);
    };

    // Submit para formulario de actualización de perfil
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const newRoleIds = selectedRoles.map((role) => role.id_rol);
            // Create a separate object to send in the request
            const updatedFormData = {
                ...formData,
                role_ids: newRoleIds,
            };

            console.log(updatedFormData);

            const response = await fetch(
                `${import.meta.env.VITE_REACT_APP_DJANGO_API_URL}/auth/users/detail/${userId}/`,
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(updatedFormData),
                }
            );

            if (!response.ok) throw new Error("Error updating profile");

            const updatedData = await response.json();
            setUserData(updatedData);
            toast.success("Perfil actualizado correctamente.");
            setEditMode(false);

            // Update authStore roles if the user is updating their own profile
            if (authStore.userId === parseInt(userId)) {
                authStore.updateRoles(updatedData.roles);
            }
        } catch (error) {
            console.error("Error updating user data:", error);
            toast.error("Hubo un error al actualizar el perfil.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SidebarLayout sidebarWidthPx={sidebarWidthPx}>
            <div className="user-profile-content" style={{ padding: "50px"}}>
                {loading ? (
                    <Spinner />
                ) : (
                    userData && (
                        <motion.form
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className="user-profile-form"
                            onSubmit={handleSubmit}
                            style={{ textAlign: "left", lineHeight: "2" }}
                        >
                            <div className="user-profile-form-col" style={{ width: "70%" }}>
                                {/* Información de la cuenta */}
                                <motion.div 
                                    initial={{ opacity: 0 }} 
                                    animate={{ opacity: 1 }} 
                                    transition={{ duration: 0.5 }} 
                                    className="card-body shadow"
                                >
                                    <h4 style={{ marginBottom: "25px" }}>Información de mi Cuenta</h4>

                                    <div className="user-profile-info">
                                        <div className="user-profile-col">
                                            <label htmlFor="first_name">Nombres</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                id="first_name"
                                                value={formData.first_name as string}
                                                onChange={handleChange}
                                                disabled={!editMode}
                                            />

                                            <label htmlFor="last_name" style={{ marginTop: '15px' }}>Apellidos</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                id="last_name"
                                                value={formData.last_name as string}
                                                onChange={handleChange}
                                                disabled={!editMode}
                                            />
                                        </div>

                                        <div className="user-profile-col">
                                            <label htmlFor="email">Correo Electrónico</label>
                                            <input
                                                type="email"
                                                className="form-control"
                                                id="email"
                                                value={formData.email as string}
                                                onChange={handleChange}
                                                disabled={!editMode}
                                            />

                                            <label htmlFor="username" style={{ marginTop: '15px' }}>Nombre de Usuario</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                id="username"
                                                value={formData.username as string}
                                                onChange={handleChange}
                                                disabled={!editMode}
                                            />
                                        </div>
                                    </div>

                                    {/* TODO: Update role functionality */}
                                    <div className="mt-3">
                                        <label>Roles:</label>
                                        <div>
                                            {userData?.roles?.length > 0 ? (
                                                userData.roles.map((role) => (
                                                    <span key={role.id_rol} style={{ fontSize: '14px' }} className="badge bg-primary me-2">
                                                        {role.nombre_rol}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="badge bg-secondary">Sin rol</span>
                                            )}
                                        </div>
                                    </div>
                                    {editMode && (
                                        // TODO: Only edit roles if user is admin
                                        <div className="mt-3">
                                            <label htmlFor="roles">Roles del Usuario</label>
                                            <Multiselect
                                                options={roles}
                                                selectedValues={selectedRoles}
                                                onSelect={setSelectedRoles}
                                                onRemove={setSelectedRoles}
                                                displayValue="nombre_rol"
                                                placeholder="Selecciona los roles"
                                                showArrow
                                                closeOnSelect={false}
                                                className="multi-select-dropdown"
                                            />
                                        </div>
                                    )}
                                </motion.div>

                                {/* Información del Perfil */}
                                <motion.div 
                                    initial={{ scale: 0.95 }} 
                                    animate={{ scale: 1 }} 
                                    transition={{ duration: 0.4 }} 
                                    className="card-body shadow"
                                >
                                    <h4 style={{ marginBottom: "25px" }}>Información de mi Perfil</h4>
                                    <div className="user-profile-info">
                                        {Object.entries(formData.profile_data_update as Record<string, unknown> || {}).map(([key, value]) =>
                                            key !== "foto_perfil" ? (
                                                <div key={key}>
                                                    <label htmlFor={key}>{formatKey(key)}</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        id={key}
                                                        value={value ? String(value) : ""}
                                                        onChange={handleChange}
                                                        disabled={!editMode}
                                                    />
                                                </div>
                                            ) : null
                                        )}
                                    </div>
                                </motion.div>

                                {canEdit && (
                                    <div className="user-profile-action-btns">
                                        <button type="button" className="btn btn-outline-primary mt-3" style={{ width: '25%' }} onClick={toggleEditMode}>
                                            {editMode ? "Cancelar" : "Editar"}
                                        </button>

                                        {editMode && (
                                            <button type="submit" className="btn btn-primary mt-3" style={{ width: '25%' }}>
                                                Guardar
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Foto de Perfil */}
                            <div className="user-profile-form-col" style={{ width: "30%", height: "fit-content" }}>
                                <div className="card-body shadow" style={{ alignItems: "center", justifyContent: "center", textAlign: 'center' }}>
                                    <img 
                                        src={profilePicture || "/assets/default_profile_picture.jpg"}
                                        style={{ width: '200px'}} 
                                        alt="Foto de perfil" 
                                        className="user-profile-picture" 
                                    />
                                    <h4 style={{ marginTop: '15px' }}>{userData?.first_name || ""} {userData?.last_name || ""}</h4>
                                    {editMode && (
                                        <input type="file" className="form-control mt-3" accept="image/*" onChange={handleProfilePictureChange} />
                                    )}
                                </div>
                            </div>

                            {/* TODO: Display user activity logs */}
                        </motion.form>
                    )
                )}
            </div>
        </SidebarLayout>
    );
}
