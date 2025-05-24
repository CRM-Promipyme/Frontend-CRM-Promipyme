import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

interface AdminRoutePermissionsProps {
    children: React.ReactNode;
    requiredBasePermissions: string[]; // e.g. ["modify_contact_fields"]
    fallbackUrl?: string;
}

export function AdminRoutePermissions({ children, requiredBasePermissions, fallbackUrl = "/contacts/menu" }: AdminRoutePermissionsProps) {
    const authStore = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [authenticated, setAuthenticated] = useState(false);
    const [allowed, setAllowed] = useState(false);

    useEffect(() => {
        let isMounted = true;
        authStore.isAuthenticated()
            .then(async (result) => {
                if (!isMounted) return;
                setAuthenticated(result);
                if (!result) {
                    toast.error("Tu sesión ha expirado, inicia sesión nuevamente.");
                    setAllowed(false);
                } else if (authStore.isAdmin()) {
                    setAllowed(true);
                } else if (requiredBasePermissions.length < 1) {
                    // not allowed if no permissions are required and not admin
                    toast.warning("No tienes permisos para acceder a esta página.");
                    setAllowed(false);
                } else {
                    const permissions = await authStore.retrievePermissions();
                    const hasPermission = permissions.some((perm: any) =>
                        perm.base_permissions &&
                        requiredBasePermissions.some(
                            (permName) => perm.base_permissions[permName]
                        )
                    );
                    if (!hasPermission) {
                        toast.warning("No tienes permisos para acceder a esta página.");
                    }
                    setAllowed(hasPermission);
                }
            })
            .catch(err => {
                console.error(err);
                toast.error("Error al verificar permisos. Intenta nuevamente.");
                setAllowed(false);
            })
            .finally(() => {
                if (isMounted) setLoading(false);
            });
        return () => { isMounted = false; };
    }, [requiredBasePermissions]);

    if (loading) return null;

    if (!authenticated) {
        return <Navigate to="/auth/login" replace />;
    }

    if (!allowed) {
        return <Navigate to={fallbackUrl} replace />;
    }

    return <>{children}</>;
}
