import Select from "react-select";
import { toast } from "react-toastify";
import api from "../../controllers/api";
import { UserTasks } from "./UserTasks";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { UserCaseList } from "./UserCaseList";
import '../../styles/auth/profileViewStyles.css';
import { fetchRoles } from '../../utils/authUtils';
import { formatKey } from "../../utils/formatUtils";
import { Activity } from "../../types/activityTypes";
import { useAuthStore } from "../../stores/authStore";
import { Branch, Region } from "../../types/branchTypes";
import { Spinner } from "../../components/ui/Spinner";
import { motion, AnimatePresence } from "framer-motion";
import { Role, UserProfile, RolePermission } from "../../types/authTypes";
import { useSidebarStore } from "../../stores/sidebarStore";
import { showResponseErrors } from "../../utils/formatUtils";
import { ActivityLog } from "../../components/ui/ActivityLog";
import { SidebarLayout } from "../../components/layouts/SidebarLayout";
import { fetchBranches, fetchRegions } from "../../controllers/branchControllers";
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
    const [branches, setBranches] = useState<Branch[]>([]);
    const [selectedBranches, setSelectedBranches] = useState<Branch[]>([]);
    const [regions, setRegions] = useState<Region[]>([]);
    const [selectedRegions, setSelectedRegions] = useState<Region[]>([]);
    const [userActivities, setUserActivities] = useState<Activity[]>([]);
    const [activeTab, setActiveTab] = useState<string>("cuenta");
    const [userPermissions, setUserPermissions] = useState<RolePermission[]>([]);

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
                const rolesData = await fetchRoles();
                setRoles(rolesData);
                setSelectedRoles([]);
            } catch {
                toast.error("No se pudieron obtener los roles.");
            }
        };

        loadRoles();
    }, [accessToken, roles.length, userId]);

    // Fetch user activities on component mount
    useEffect(() => {
        if (!userId) return;

        const loadActivities = async () => {
            try {
                const activitiesResponse = await fetchEntityActivities("user", userId);
                if (activitiesResponse && activitiesResponse.results) {
                    setUserActivities(activitiesResponse.results);
                }
            } catch (error) {
                console.error("Error fetching user activities:", error);
            }
        };

        loadActivities();
    }, [userId]);

    // Fetch user permissions
    useEffect(() => {
        if (!userId) return;

        const loadPermissions = async () => {
            try {
                const response = await api.get(`/auth/manage/system-roles/permissions/user/${userId}/`);
                const permissions = response.data.role_permissions;
                setUserPermissions(permissions);
                console.log("User permissions:", permissions);
            } catch (error) {
                console.error("Error fetching user permissions:", error);
            }
        };

        loadPermissions();
    }, [userId]);

    // Fetch branches al cargar el componente
    useEffect(() => {
        if (!accessToken || branches.length > 0) return;

        const loadBranches = async () => {
            try {
                const branchesData = await fetchBranches(100, 0); // Fetch up to 100 branches
                setBranches(branchesData.results);
            } catch {
                toast.error("No se pudieron obtener las sucursales.");
            }
        };

        loadBranches();
    }, [accessToken, branches.length]);

    // Fetch regions al cargar el componente
    useEffect(() => {
        if (!accessToken || regions.length > 0) return;

        const loadRegions = async () => {
            try {
                const regionsData = await fetchRegions(1000, 0);
                setRegions(regionsData.results);
            } catch {
                toast.error("No se pudieron obtener las regiones.");
            }
        };

        loadRegions();
    }, [accessToken, regions.length]);

    // Set selectedBranches once branches are loaded and userData is available
    useEffect(() => {
        if (userData?.profile_data?.sucursales && Array.isArray(userData.profile_data.sucursales) && branches.length > 0) {
            const branchIds = userData.profile_data.sucursales.map((s: any) => s.id || s);
            const matchingBranches = branches.filter(b => branchIds.includes(b.id));
            setSelectedBranches(matchingBranches);
        }
    }, [branches, userData]);

    // Set selectedRegions once regions are loaded and userData is available
    useEffect(() => {
        if (userData?.profile_data?.regiones && Array.isArray(userData.profile_data.regiones) && regions.length > 0) {
            const regionIds = userData.profile_data.regiones.map((r: any) => r.id || r);
            const matchingRegions = regions.filter(r => regionIds.includes(r.id));
            setSelectedRegions(matchingRegions);
        }
    }, [regions, userData]);

    // Show edit functionality only if the user is the same as the logged in user, or if the user is an admin
    const canEdit = userId && (authStore.userId === parseInt(userId) || authStore.isAdmin());

    useEffect(() => {
        if (!userId || !accessToken) return;
    
        const fetchUserData = async () => {
            try {
                const response = await api.get(`/auth/users/detail/${userId}`);
                const data: UserProfile = response.data;
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
            
            // Update profile_data with sucursales and regiones as arrays of IDs
            const profileDataUpdate = { ...formData.profile_data_update as Record<string, unknown> };
            
            // Send arrays of IDs instead of single values
            profileDataUpdate.sucursales = selectedBranches.map(b => b.id);
            profileDataUpdate.regiones = selectedRegions.map(r => r.id);
            
            // Create a separate object to send in the request
            const updatedFormData = {
                ...formData,
                profile_data_update: profileDataUpdate,
                role_ids: newRoleIds,
            };

            const response = await api.put(`/auth/users/detail/${userId}/`, updatedFormData);
            const updatedData = response.data;
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
        } catch (error) {
            const axiosError = error as any;
            showResponseErrors(axiosError.response?.data, "Hubo un error al actualizar el perfil.");
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
                                                        onChange={e => {
                                                            const sanitized = e.target.value.replace(/[ ,./\\]/g, "");
                                                            setFormData(prev => ({ ...prev, username: sanitized }));
                                                        }}
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
                                                    key !== "foto_perfil" && key !== "sucursal" && key !== "sucursal_id" && key !== "sucursal_nombre" && key !== "codigo_empleado" && key !== "pyme_codigo" && key !== "region" && key !== "sucursales" && key !== "regiones" ? (
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

                                                {/* Codigo PYME - Only editable by admins */}
                                                {(formData.profile_data_update as Record<string, unknown>)?.pyme_codigo !== undefined && (
                                                    <div style={{ marginTop: "15px" }}>
                                                        <label htmlFor="pyme_codigo">Código PYME</label>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            id="pyme_codigo"
                                                            value={(formData.profile_data_update as Record<string, unknown>)?.pyme_codigo ? String((formData.profile_data_update as Record<string, unknown>)?.pyme_codigo) : ""}
                                                            onChange={handleChange}
                                                            disabled={!editMode || !authStore.isAdmin()}
                                                        />
                                                    </div>
                                                )}
                                                
                                                {/* Regiones Asignadas Section */}
                                                <div style={{ marginTop: "20px" }}>
                                                    <div className="d-flex align-items-center mb-2">
                                                        <i className="bi bi-geo-alt" style={{ marginRight: '8px', fontSize: '18px', color: '#0d6efd' }}></i>
                                                        <label htmlFor="regiones" style={{ margin: 0, fontWeight: '600', fontSize: '14px' }}>Regiones Asignadas</label>
                                                        {!editMode && selectedRegions.length > 0 && (
                                                            <span style={{ marginLeft: '8px', backgroundColor: '#e7f3ff', color: '#0066cc', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: '500' }}>
                                                                {selectedRegions.length}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {editMode ? (
                                                        <Select
                                                            isMulti
                                                            options={regions}
                                                            value={selectedRegions}
                                                            onChange={(selected) => setSelectedRegions(selected as Region[])}
                                                            getOptionLabel={(option: Region) => option.nombre_region}
                                                            getOptionValue={(option: Region) => String(option.id)}
                                                            placeholder="Selecciona una o más regiones"
                                                            className="react-select-container"
                                                            classNamePrefix="react-select"
                                                            menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
                                                            styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                                        />
                                                    ) : (
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '10px 0' }}>
                                                            {selectedRegions.length > 0 ? (
                                                                selectedRegions.map((region) => (
                                                                    <span
                                                                        key={region.id}
                                                                        style={{
                                                                            backgroundColor: '#e7f3ff',
                                                                            color: '#0066cc',
                                                                            padding: '6px 12px',
                                                                            borderRadius: '20px',
                                                                            fontSize: '13px',
                                                                            fontWeight: '500',
                                                                            display: 'inline-flex',
                                                                            alignItems: 'center',
                                                                            gap: '6px',
                                                                            border: '1px solid #b3d9ff'
                                                                        }}
                                                                    >
                                                                        {region.nombre_region}
                                                                    </span>
                                                                ))
                                                            ) : (
                                                                <span style={{ color: '#999', fontSize: '13px', fontStyle: 'italic' }}>Sin regiones asignadas</span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                {/* Sucursales Asignadas Section */}
                                                <div style={{ marginTop: "20px" }}>
                                                    <div className="d-flex align-items-center mb-2">
                                                        <i className="bi bi-building" style={{ marginRight: '8px', fontSize: '18px', color: '#198754' }}></i>
                                                        <label htmlFor="sucursales" style={{ margin: 0, fontWeight: '600', fontSize: '14px' }}>Sucursales Asignadas</label>
                                                        {!editMode && selectedBranches.length > 0 && (
                                                            <span style={{ marginLeft: '8px', backgroundColor: '#f0f8f5', color: '#107a5a', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: '500' }}>
                                                                {selectedBranches.length}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {editMode ? (
                                                        <Select
                                                            isMulti
                                                            options={branches}
                                                            value={selectedBranches}
                                                            onChange={(selected) => setSelectedBranches(selected as Branch[])}
                                                            getOptionLabel={(option: Branch) => option.nombre_sucursal}
                                                            getOptionValue={(option: Branch) => String(option.id)}
                                                            placeholder="Selecciona una o más sucursales"
                                                            className="react-select-container"
                                                            classNamePrefix="react-select"
                                                            menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
                                                            styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                                        />
                                                    ) : (
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '10px 0' }}>
                                                            {selectedBranches.length > 0 ? (
                                                                selectedBranches.map((branch) => (
                                                                    <span
                                                                        key={branch.id}
                                                                        style={{
                                                                            backgroundColor: '#f0f8f5',
                                                                            color: '#107a5a',
                                                                            padding: '6px 12px',
                                                                            borderRadius: '20px',
                                                                            fontSize: '13px',
                                                                            fontWeight: '500',
                                                                            display: 'inline-flex',
                                                                            alignItems: 'center',
                                                                            gap: '6px',
                                                                            border: '1px solid #a8d5c9'
                                                                        }}
                                                                    >
                                                                        {branch.nombre_sucursal}
                                                                    </span>
                                                                ))
                                                            ) : (
                                                                <span style={{ color: '#999', fontSize: '13px', fontStyle: 'italic' }}>Sin sucursales asignadas</span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </motion.div>
                                <motion.div
                                    initial={{ opacity: 0 }} 
                                    animate={{ opacity: 1 }} 
                                    transition={{ duration: 0.5 }} 
                                    className="card-body shadow-sm"
                                >
                                    <div className="user-profile-header">
                                        <h4 className="h4-header">Tareas Asignadas</h4>
                                    </div>
                                    <UserTasks userId={userId || ""} />
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0 }} 
                                    animate={{ opacity: 1 }} 
                                    transition={{ duration: 0.5 }} 
                                    className="card-body shadow-sm"
                                >
                                    <div className="user-profile-header">
                                        <h4 className="h4-header">Permisos Asignados</h4>
                                    </div>
                                    {userPermissions.length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ duration: 0.5 }}
                                        >
                                            {userPermissions.some(rp => rp.base_permissions.rol === "Administrador") ? (
                                                <div style={{ 
                                                    padding: "24px", 
                                                    backgroundColor: "#f0f9ff", 
                                                    border: "2px solid #0d6efd", 
                                                    borderRadius: "12px",
                                                    textAlign: "center",
                                                    marginTop: "12px"
                                                }}>
                                                    <div style={{ fontSize: "28px", marginBottom: "14px" }}>
                                                        <i className="bi bi-shield-check" style={{ color: "#0d6efd" }}></i>
                                                    </div>
                                                    <div style={{ fontSize: "17px", fontWeight: "600", color: "#0d6efd", marginBottom: "10px" }}>
                                                        Acceso Administrativo
                                                    </div>
                                                    <div style={{ fontSize: "14px", color: "#555" }}>
                                                        Este usuario tiene acceso a <strong>TODOS los permisos</strong> del sistema
                                                    </div>
                                                </div>
                                            ) : (
                                                <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", marginTop: "16px" }}>
                                                    {/* Reportes */}
                                                <div style={{ border: "1px solid #e5e7eb", borderRadius: "12px", padding: "14px", minWidth: "180px" }}>
                                                    <div style={{ fontWeight: 500, marginBottom: 8, fontSize: "13px" }}>
                                                        <i className="bi bi-file-earmark-bar-graph" style={{ marginRight: 6 }} /> Reportes
                                                    </div>
                                                    <div style={{ fontSize: "12px" }}>
                                                        {userPermissions.some(rp => rp.base_permissions.visualize_reports) && (
                                                            <div style={{ display: "flex", alignItems: "center", marginBottom: "4px" }}>
                                                                <span style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "2px", backgroundColor: "#198754", marginRight: "6px" }}></span>
                                                                Ver Reportes
                                                            </div>
                                                        )}
                                                        {userPermissions.some(rp => rp.base_permissions.export_reports) && (
                                                            <div style={{ display: "flex", alignItems: "center", marginBottom: "4px" }}>
                                                                <span style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "2px", backgroundColor: "#198754", marginRight: "6px" }}></span>
                                                                Exportar Reportes
                                                            </div>
                                                        )}
                                                        {!userPermissions.some(rp => rp.base_permissions.visualize_reports || rp.base_permissions.export_reports) && (
                                                            <div style={{ color: "#999", fontSize: "11px" }}>Sin permisos</div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Contactos */}
                                                <div style={{ border: "1px solid #e5e7eb", borderRadius: "12px", padding: "14px", minWidth: "180px" }}>
                                                    <div style={{ fontWeight: 500, marginBottom: 8, fontSize: "13px" }}>
                                                        <i className="bi bi-people" style={{ marginRight: 6 }} /> Contactos
                                                    </div>
                                                    <div style={{ fontSize: "12px" }}>
                                                        {userPermissions.some(rp => rp.base_permissions.modify_contact_fields) && (
                                                            <div style={{ display: "flex", alignItems: "center", marginBottom: "4px" }}>
                                                                <span style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "2px", backgroundColor: "#198754", marginRight: "6px" }}></span>
                                                                Modificar Campos
                                                            </div>
                                                        )}
                                                        {userPermissions.some(rp => rp.base_permissions.create_contacts) && (
                                                            <div style={{ display: "flex", alignItems: "center", marginBottom: "4px" }}>
                                                                <span style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "2px", backgroundColor: "#198754", marginRight: "6px" }}></span>
                                                                Crear Contactos
                                                            </div>
                                                        )}
                                                        {userPermissions.some(rp => rp.base_permissions.delete_contacts) && (
                                                            <div style={{ display: "flex", alignItems: "center", marginBottom: "4px" }}>
                                                                <span style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "2px", backgroundColor: "#198754", marginRight: "6px" }}></span>
                                                                Eliminar Contactos
                                                            </div>
                                                        )}
                                                        {!userPermissions.some(rp => rp.base_permissions.modify_contact_fields || rp.base_permissions.create_contacts || rp.base_permissions.delete_contacts) && (
                                                            <div style={{ color: "#999", fontSize: "11px" }}>Sin permisos</div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Usuarios */}
                                                <div style={{ border: "1px solid #e5e7eb", borderRadius: "12px", padding: "14px", minWidth: "180px" }}>
                                                    <div style={{ fontWeight: 500, marginBottom: 8, fontSize: "13px" }}>
                                                        <i className="bi bi-person-gear" style={{ marginRight: 6 }} /> Usuarios
                                                    </div>
                                                    <div style={{ fontSize: "12px" }}>
                                                        {userPermissions.some(rp => rp.base_permissions.invite_users) && (
                                                            <div style={{ display: "flex", alignItems: "center", marginBottom: "4px" }}>
                                                                <span style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "2px", backgroundColor: "#198754", marginRight: "6px" }}></span>
                                                                Invitar Usuarios
                                                            </div>
                                                        )}
                                                        {userPermissions.some(rp => rp.base_permissions.see_user_list) && (
                                                            <div style={{ display: "flex", alignItems: "center", marginBottom: "4px" }}>
                                                                <span style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "2px", backgroundColor: "#198754", marginRight: "6px" }}></span>
                                                                Ver Lista de Usuarios
                                                            </div>
                                                        )}
                                                        {userPermissions.some(rp => rp.base_permissions.approve_accounts) && (
                                                            <div style={{ display: "flex", alignItems: "center", marginBottom: "4px" }}>
                                                                <span style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "2px", backgroundColor: "#198754", marginRight: "6px" }}></span>
                                                                Aprobar Cuentas
                                                            </div>
                                                        )}
                                                        {userPermissions.some(rp => rp.base_permissions.deny_accounts) && (
                                                            <div style={{ display: "flex", alignItems: "center", marginBottom: "4px" }}>
                                                                <span style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "2px", backgroundColor: "#198754", marginRight: "6px" }}></span>
                                                                Rechazar Cuentas
                                                            </div>
                                                        )}
                                                        {!userPermissions.some(rp => rp.base_permissions.invite_users || rp.base_permissions.see_user_list || rp.base_permissions.approve_accounts || rp.base_permissions.deny_accounts) && (
                                                            <div style={{ color: "#999", fontSize: "11px" }}>Sin permisos</div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Roles */}
                                                <div style={{ border: "1px solid #e5e7eb", borderRadius: "12px", padding: "14px", minWidth: "180px" }}>
                                                    <div style={{ fontWeight: 500, marginBottom: 8, fontSize: "13px" }}>
                                                        <i className="bi bi-shield-lock" style={{ marginRight: 6 }} /> Roles
                                                    </div>
                                                    <div style={{ fontSize: "12px" }}>
                                                        {userPermissions.some(rp => rp.base_permissions.create_roles) && (
                                                            <div style={{ display: "flex", alignItems: "center", marginBottom: "4px" }}>
                                                                <span style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "2px", backgroundColor: "#198754", marginRight: "6px" }}></span>
                                                                Crear Roles
                                                            </div>
                                                        )}
                                                        {userPermissions.some(rp => rp.base_permissions.update_roles) && (
                                                            <div style={{ display: "flex", alignItems: "center", marginBottom: "4px" }}>
                                                                <span style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "2px", backgroundColor: "#198754", marginRight: "6px" }}></span>
                                                                Actualizar Roles
                                                            </div>
                                                        )}
                                                        {userPermissions.some(rp => rp.base_permissions.delete_roles) && (
                                                            <div style={{ display: "flex", alignItems: "center", marginBottom: "4px" }}>
                                                                <span style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "2px", backgroundColor: "#198754", marginRight: "6px" }}></span>
                                                                Eliminar Roles
                                                            </div>
                                                        )}
                                                        {!userPermissions.some(rp => rp.base_permissions.create_roles || rp.base_permissions.update_roles || rp.base_permissions.delete_roles) && (
                                                            <div style={{ color: "#999", fontSize: "11px" }}>Sin permisos</div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Sucursales */}
                                                <div style={{ border: "1px solid #e5e7eb", borderRadius: "12px", padding: "14px", minWidth: "180px" }}>
                                                    <div style={{ fontWeight: 500, marginBottom: 8, fontSize: "13px" }}>
                                                        <i className="bi bi-building" style={{ marginRight: 6 }} /> Sucursales
                                                    </div>
                                                    <div style={{ fontSize: "12px" }}>
                                                        {userPermissions.some(rp => rp.base_permissions.create_branches) && (
                                                            <div style={{ display: "flex", alignItems: "center", marginBottom: "4px" }}>
                                                                <span style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "2px", backgroundColor: "#198754", marginRight: "6px" }}></span>
                                                                Crear Sucursales
                                                            </div>
                                                        )}
                                                        {userPermissions.some(rp => rp.base_permissions.update_branches) && (
                                                            <div style={{ display: "flex", alignItems: "center", marginBottom: "4px" }}>
                                                                <span style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "2px", backgroundColor: "#198754", marginRight: "6px" }}></span>
                                                                Actualizar Sucursales
                                                            </div>
                                                        )}
                                                        {userPermissions.some(rp => rp.base_permissions.delete_branches) && (
                                                            <div style={{ display: "flex", alignItems: "center", marginBottom: "4px" }}>
                                                                <span style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "2px", backgroundColor: "#198754", marginRight: "6px" }}></span>
                                                                Eliminar Sucursales
                                                            </div>
                                                        )}
                                                        {!userPermissions.some(rp => rp.base_permissions.create_branches || rp.base_permissions.update_branches || rp.base_permissions.delete_branches) && (
                                                            <div style={{ color: "#999", fontSize: "11px" }}>Sin permisos</div>
                                                        )}
                                                    </div>
                                                </div>
                                                </div>
                                            )}
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

                                <motion.div
                                    initial={{ opacity: 0 }} 
                                    animate={{ opacity: 1 }} 
                                    transition={{ duration: 0.5 }} 
                                    className="card-body shadow-sm"
                                >
                                    <div className="user-profile-header">
                                        <h4 className="h4-header">Casos Relacionados</h4>
                                    </div>
                                    <UserCaseList userId={userId || ""} />
                                </motion.div>
                            </div>
                        </motion.form>
                    )
                )}
            </div>
        </SidebarLayout>
    );
}
