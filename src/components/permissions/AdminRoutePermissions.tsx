import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { RolePermission } from "../../types/authTypes";

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
        
        (async () => {
            // First, refresh roles once to get fresh data
            await authStore.refreshRoles();
            
            const isAuth = await authStore.isAuthenticated();
            if (!isMounted) return;
            
            setAuthenticated(isAuth);
            if (!isAuth) {
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
                console.log("User permissions:", permissions);
                console.log("Required permissions:", requiredBasePermissions);
                
                const hasPermission = permissions.some((perm: RolePermission) => {
                    if (!perm.base_permissions) {
                        console.log("No base_permissions found");
                        return false;
                    }
                    
                    const hasRequiredPerm = requiredBasePermissions.some((permName) => {
                        const permValue = perm.base_permissions[permName as keyof typeof perm.base_permissions];
                        console.log(`Checking ${permName}: ${permValue}`);
                        return !!permValue; // Explicitly check for truthiness
                    });
                    
                    console.log("Has required permission:", hasRequiredPerm);
                    return hasRequiredPerm;
                });
                
                console.log("Final permission result:", hasPermission);
                if (!hasPermission) {
                    toast.warning("No tienes permisos para acceder a esta página.");
                }
                setAllowed(hasPermission);
            }
        })()
            .catch(err => {
                console.error(err);
                toast.error("Error al verificar permisos. Intenta nuevamente.");
                setAllowed(false);
            })
            .finally(() => {
                if (isMounted) setLoading(false);
            });
        
        return () => { isMounted = false; };
    }, [JSON.stringify(requiredBasePermissions)]);

    if (loading) return null;

    if (!authenticated) {
        return <Navigate to="/auth/login" replace />;
    }

    if (!allowed) {
        return <Navigate to={fallbackUrl} replace />;
    }

    return <>{children}</>;
}
