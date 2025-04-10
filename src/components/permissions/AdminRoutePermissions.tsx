import { Navigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuthStore } from "../../stores/authStore";
import { useState, useEffect } from "react";

interface AdminRoutePermissionsProps {
    children: React.ReactNode;
    fallbackUrl?: string;
}

export function AdminRoutePermissions({ children, fallbackUrl = "/" }: AdminRoutePermissionsProps) {
    const authStore = useAuthStore();
    const isAuthenticated = authStore.isAuthenticated();
    const isAdmin = authStore.isAdmin();
    const [toastShown, setToastShown] = useState(false);

    useEffect(() => {
        if ((!isAdmin && !isAuthenticated) && !toastShown) {
            toast.warning("No tienes permisos para acceder a esta página.");
            setToastShown(true);
        }
    }, [isAdmin, toastShown, isAuthenticated]);

    if (!isAdmin) {
        return <Navigate to={fallbackUrl} replace />;
    }

    return <>{children}</>;
}