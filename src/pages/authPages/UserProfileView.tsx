import { useEffect, useState } from "react";
import '../../styles/auth/profileViewStyles.css';
import { formatKey } from "../../utils/formatUtils";
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
    // Estados globales
    const sidebarWidthPx = useSidebarStore((state) => state.sidebarWidthPx);
    const authStore = useAuthStore();
    const userId = authStore.userId;
    const accessToken = authStore.accessToken;

    // Estados locales
    const [loading, setLoading] = useState<boolean>(true);
    const [userData, setUserData] = useState<UserProfile | null>(null);

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

                // Evitar renders innecesarios si los datos no han cambiado
                setUserData(prevData => prevData?.id === data.id ? prevData : data);
            } catch (error) {
                console.error("Error fetching user data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [userId, accessToken]); // corre cuando userId/accessToken cambia

    return (
        <SidebarLayout sidebarWidthPx={sidebarWidthPx}>
            <div className="user-profile-content">
                {loading ? (
                    <Spinner />
                ) : (
                    userData && (
                        <form className="user-profile-form" style={{ textAlign: "left", lineHeight: "2" }}>
                            <div className="user-profile-form-col" style={{ width: "70%" }}>
                                {/* Información de la cuenta */}
                                    <div className="card-body shadow">
                                        <h4 style={{ marginBottom: "25px" }}>Información de mi Cuenta</h4>

                                        <div className="user-profile-info">
                                            <div className="user-profile-col">
                                                <label htmlFor="first_name">Nombres</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    id="first_name"
                                                    value={userData?.first_name || ""}
                                                    disabled
                                                />

                                                <label htmlFor="last_name">Apellidos</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    id="last_name"
                                                    value={userData?.last_name || ""}
                                                    disabled
                                                />
                                            </div>
                                            <div className="user-profile-col">
                                                <label htmlFor="username">Usuario</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    id="username"
                                                    value={userData?.username || ""}
                                                    disabled
                                                />

                                                <label htmlFor="email">Correo Electrónico</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    id="email"
                                                    value={userData?.email || ""}
                                                    disabled
                                                />
                                            </div>
                                        </div>

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
                                    </div>

                                {/* Profile Information Card */}
                                    <div className="card-body shadow">
                                        <h4 style={{ marginBottom: "25px" }}>Información de mi Perfil</h4>
                                        <div className="user-profile-info">
                                            <div className="user-profile-col" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', width: '100%', justifyContent: 'space-between' }}>
                                                {userData?.profile_data &&
                                                    Object.entries(userData.profile_data).map(([key, value]) =>
                                                        key !== "foto_perfil" ? (
                                                            <div key={key} style={{ width: '48%', marginTop: '10px' }}>
                                                                <label htmlFor={key}>{formatKey(key)}</label>
                                                                <input
                                                                    type="text"
                                                                    className="form-control"
                                                                    id={key}
                                                                    value={value ? String(value) : ""}
                                                                    disabled
                                                                />
                                                            </div>
                                                        ) : null
                                                    )}
                                            </div>
                                        </div>
                                    </div>
                                
                                {/* TODO: Edit functionality */}
                                    <button
                                        id="edit-profile-btn"
                                        style={{
                                            width: "20%",
                                            height: "45px",
                                            marginTop: "2rem",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            gap: "10px",
                                        }}
                                        type="submit"
                                        className="btn btn-outline-primary mt-3"
                                    >
                                        Editar
                                    </button>
                            </div>

                            {/* Profile Picture */}
                                <div className="user-profile-form-col" style={{ width: "30%", height: "fit-content" }}>
                                    <div className="card-body shadow" style={{ alignItems: "center", justifyContent: "center" }}>
                                        <img
                                            src={
                                                userData?.profile_data?.foto_perfil
                                                    ? `data:image/png;base64,${userData.profile_data.foto_perfil}`
                                                    : "/assets/default_profile_picture.jpg"
                                            }
                                            alt="User Profile"
                                            style={{ width: "225px" }}
                                            className="user-profile-picture"
                                        />
                                        <h4 style={{ marginTop: '15px' }}>{userData?.first_name || ""} {userData?.last_name || ""}</h4>
                                    </div>

                                    {/* TODO: Profile Picture Upload */}
                                    <div className="card-body shadow">
                                        <label htmlFor="profile_picture" style={{ marginBottom: "15px" }}>Cambiar Foto de Perfil</label>
                                        <input
                                            type="file"
                                            name="profile_picture"
                                            className="form-control"
                                            id="profile_picture"
                                            style={{ marginBottom: "15px" }}
                                            accept="image/*"
                                        />
                                    </div>
                                </div>
                        </form>
                    )
                )}
            </div>
        </SidebarLayout>
    );
}
