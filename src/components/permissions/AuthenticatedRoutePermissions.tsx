import { Navigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuthStore } from "../../stores/authStore";
import { useState, useEffect } from "react";

interface AuthenticatedRoutePermissionsProps {
    children: React.ReactNode;
    fallbackUrl?: string;
}

export function AuthenticatedRoutePermissions({ children, fallbackUrl = "/" }: AuthenticatedRoutePermissionsProps) {
    const authStore = useAuthStore();
    const isAuthenticated = authStore.isAuthenticated();
    const isAdmin = authStore.isAdmin();
    const [toastShown, setToastShown] = useState(false);

    useEffect(() => {
        if (!isAuthenticated && !toastShown) {
            toast.warning("No tienes permisos para acceder a esta página.");
            setToastShown(true);
        }
    }, [isAdmin, toastShown, isAuthenticated]);

    if (!isAdmin) {
        return <Navigate to={fallbackUrl} replace />;
    }

    return <>{children}</>;
}