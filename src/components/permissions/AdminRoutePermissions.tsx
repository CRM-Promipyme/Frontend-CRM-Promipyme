import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

interface AdminRoutePermissionsProps {
    children: React.ReactNode;
    fallbackUrl?: string;
}

export function AdminRoutePermissions({ children, fallbackUrl = "/workflows/processes/menu" }: AdminRoutePermissionsProps) {
    const authStore = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [authenticated, setAuthenticated] = useState(false);
    const [admin, setAdmin] = useState(false);

    useEffect(() => {
        authStore.isAuthenticated()
            .then(result => {
                setAuthenticated(result);
                if (!result) {
                    toast.error("Tu sesión ha expirado, inicia sesión nuevamente.");
                } else {
                    const isAdmin = authStore.isAdmin();
                    setAdmin(isAdmin);
                    if (!isAdmin) {
                        toast.warning("No tienes permisos para acceder a esta página.");
                    }
                }
            })
            .catch(err => {
                console.error(err);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [authStore]);

    if (loading) return null;

    if (!authenticated) {
        return <Navigate to="/auth/login" replace />;
    }

    if (!admin) {
        return <Navigate to={fallbackUrl} replace />;
    }

    return <>{children}</>;
}
