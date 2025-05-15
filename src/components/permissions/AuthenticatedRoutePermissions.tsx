import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

interface AuthenticatedRoutePermissionsProps {
    children: React.ReactNode;
    fallbackUrl?: string;
}

export function AuthenticatedRoutePermissions({ children, fallbackUrl = "/auth/login" }: AuthenticatedRoutePermissionsProps) {
    const authStore = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [authenticated, setAuthenticated] = useState(false);

    useEffect(() => {
        authStore.isAuthenticated()
            .then(result => {
                setAuthenticated(result);
                if (!result) {
                    toast.error("Tu sesión ha expirado, inicia sesión nuevamente.");
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
        return <Navigate to={fallbackUrl} replace />;
    }

    return <>{children}</>;
}
