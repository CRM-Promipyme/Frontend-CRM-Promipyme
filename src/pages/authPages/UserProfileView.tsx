import Select from "react-select";
import { toast } from "react-toastify";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import '../../styles/auth/profileViewStyles.css';
import { fetchRoles } from '../../utils/authUtils';
import { formatKey } from "../../utils/formatUtils";
import { Activity } from "../../types/activityTypes";
import { useAuthStore } from "../../stores/authStore";
import { Spinner } from "../../components/ui/Spinner";
import { motion, AnimatePresence } from "framer-motion";
import { Role, UserProfile } from "../../types/authTypes";
import { useSidebarStore } from "../../stores/sidebarStore";
import { showResponseErrors } from "../../utils/formatUtils";
import { ActivityLog } from "../../components/ui/ActivityLog";
import { SidebarLayout } from "../../components/layouts/SidebarLayout";
import { fetchEntityActivities } from "../../controllers/activityControllers";

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
    const [userActivities, setUserActivities] = useState<Activity[]>([]);
    const [activeTab, setActiveTab] = useState<string>("cuenta");

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
    }, [accessToken, roles.length, userId]);

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

            if (!response.ok) {
                // Try extracting error response
                const errorData = await response.json().catch(() => null);
                throw { status: response.status, data: errorData };
            }

            const updatedData = await response.json();
            setUserData(updatedData);
            
            // Re-fetch user activities to update the log
            const activitiesResponse = await fetchEntityActivities("user", userId || "");
            if (activitiesResponse && activitiesResponse.results) {
                setUserActivities(activitiesResponse.results);
            }
            
            setEditMode(false);
            toast.success("Perfil actualizado correctamente.");
            
            // Update authStore roles if the user is updating their own profile
            if (userId && authStore.userId === parseInt(userId)) {
                authStore.updateRoles(updatedData.roles);
            }
        } catch (error: any) {
            if (error.data) {
                showResponseErrors(error.data); // Now correctly passing the API response
            } else {
                showResponseErrors("Hubo un error al actualizar el perfil.");
            };
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
                            <div className="user-profile-form-col">
                                {/* Información de la cuenta */}
                                <motion.div 
                                    initial={{ opacity: 0 }} 
                                    animate={{ opacity: 1 }} 
                                    transition={{ duration: 0.5 }} 
                                    className="card-body shadow-sm"
                                >
                                    <div className="user-profile-header">
                                        <h4 className="h4-header">Información de Usuario</h4>
                                        {canEdit && (
                                            <div className="user-profile-action-btns">
                                                <AnimatePresence>
                                                    {editMode && (
                                                        <motion.button 
                                                            type="submit" 
                                                            className="btn btn-outline-primary"
                                                            initial={{ opacity: 0, x: -20 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            exit={{ opacity: 0, x: -20 }}
                                                            transition={{ duration: 0.2 }}
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                        >
                                                            <i className="bi bi-check2" style={{ marginRight: '4px' }}></i>
                                                            Guardar
                                                        </motion.button>
                                                    )}
                                                </AnimatePresence>
                                                <motion.button 
                                                    type="button" 
                                                    className={editMode ? "btn btn-outline-danger" : "btn btn-outline-primary"} 
                                                    onClick={toggleEditMode}
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                >
                                                    {editMode ? <i className="bi bi-x" style={{ marginRight: '5px'}}></i> : <i className="bi bi-pencil" style={{ marginRight: '5px'}}></i>}
                                                    {editMode ? "Cancelar" : "Editar"}
                                                </motion.button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="user-profile-tabs d-flex bg-light">
                                        <button
                                            className={`flex-grow-1 btn py-2 ${activeTab === "cuenta" ? "bg-white" : "secondary-bg"}`}
                                            onClick={(e) => {
                                                e.preventDefault(); // Prevent form submission
                                                setActiveTab("cuenta");
                                            }}
                                        >
                                            <i className="bi bi-person me-2"></i> Información de la Cuenta
                                        </button>
                                        <button
                                            className={`flex-grow-1 btn py-2 ${activeTab === "perfil" ? "bg-white" : "secondary-bg"}`}
                                            onClick={(e) => {
                                                e.preventDefault(); // Prevent form submission
                                                setActiveTab("perfil");
                                            }}
                                        >
                                            <i className="bi bi-person me-2"></i> Información del Perfil
                                        </button>
                                    </div>

                                    {activeTab === "cuenta" && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.3 }}
                                            style={{ width: "100%" }}
                                        >
                                            <div className="user-profile-info" style={{ marginBottom: '25px'}}>
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
                                            {editMode && authStore.isAdmin() && (
                                                // TODO: Only edit roles if user is admin
                                                <AnimatePresence>
                                                    <motion.div 
                                                        key="roles-editor"
                                                        className="mt-3"
                                                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                                        exit={{ opacity: 0, y: -10, scale: 0.9 }}
                                                        transition={{ 
                                                            duration: 0.4, 
                                                            type: "spring", 
                                                            stiffness: 400, 
                                                            damping: 25 
                                                        }}
                                                    >
                                                        <label htmlFor="roles">Roles del Usuario</label>
                                                        <Select
                                                            isMulti
                                                            options={roles}
                                                            value={selectedRoles}
                                                            onChange={(selected) => setSelectedRoles(selected as Role[])}
                                                            getOptionLabel={(option: Role) => option.nombre_rol}
                                                            getOptionValue={(option: Role) => String(option.id_rol)}
                                                            placeholder="Selecciona los roles"
                                                            className="react-select-container"
                                                            classNamePrefix="react-select"
                                                        />
                                                    </motion.div>
                                                </AnimatePresence>
                                            )}
                                        </motion.div>
                                    )}
                                    
                                    {activeTab === "perfil" && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.3 }}
                                            style={{ width: "100%" }}
                                        >
                                            {/* Información del Perfil */}
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
                                    )}
                                </motion.div>
                            </div>

                            <div className="user-profile-form-col" style={{ width: "30%", height: "fit-content" }}>
                                {/* Foto de Perfil */}
                                <div className="card-body shadow-sm" style={{ alignItems: "center", justifyContent: "center", textAlign: 'center' }}>
                                    <img 
                                        src={profilePicture || "/assets/default_profile_picture.jpg"}
                                        style={{ width: '200px'}} 
                                        alt="Foto de perfil" 
                                        className="user-profile-picture" 
                                    />
                                    <h4 style={{ marginTop: '15px' }}>{userData?.first_name || ""} {userData?.last_name || ""}</h4>
                                    {/* Roles */}
                                    <div>
                                        {userData?.roles?.length > 0 ? (
                                            userData.roles.map((role) => (
                                                <span key={role.id_rol} style={{ fontSize: '14px' }} className="badge bg-secondary me-2">
                                                    {role.nombre_rol}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="badge bg-secondary">Sin rol</span>
                                        )}
                                    </div>
                                    {editMode && (
                                        <motion.input
                                            type="file"
                                            className="form-control mt-3"
                                            accept="image/*"
                                            onChange={handleProfilePictureChange}
                                            initial={{ opacity: 0, y: -20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.3 }}
                                        />
                                    )}
                                </div>

                                {/* Historial de actividades */}
                                <div className="card-body shadow-sm">
                                    <ActivityLog activities={userActivities} setActivities={setUserActivities} entity_type="user" entity_id={userId}/>
                                </div>
                            </div>
                        </motion.form>
                    )
                )}
            </div>
        </SidebarLayout>
    );
}
