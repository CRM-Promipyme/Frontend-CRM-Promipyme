import axios from "axios";
import { create } from "zustand";
import api from "../controllers/api";
import { LoginResponse, Role, RolePermission } from "../types/authTypes";

interface AuthState {
    userId: number | null;
    accessToken: string | null;
    refreshToken: string | null;
    roles: Role[];
    login: (response: LoginResponse) => Promise<boolean>;
    logout: () => void;
    isAuthenticated: () => Promise<boolean>;
    retrievePermissions: () => Promise<RolePermission[]>;
    isAdmin: () => boolean;
    updateRoles: (roles: Role[]) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    userId: JSON.parse(localStorage.getItem("user_id") || "null"),
    accessToken: localStorage.getItem("access") || null,
    refreshToken: localStorage.getItem("refresh") || null,
    roles: JSON.parse(localStorage.getItem("roles") || "[]"),

    login: async (response: LoginResponse): Promise<boolean> => {
        try {
            const { user_id, refresh, access, roles } = response;

            set({
                userId: user_id,
                accessToken: access,
                refreshToken: refresh,
                roles,
            });

            // Almacenar en localStorage
            localStorage.setItem("user_id", JSON.stringify(user_id));
            localStorage.setItem("access", access);
            localStorage.setItem("refresh", refresh);
            localStorage.setItem("roles", JSON.stringify(roles));

            return true; // Login successful
        } catch (error) {
            console.error("Login failed:", error);
        }
        return false; // Login failed
    },

    logout: () => {
        set({ userId: null, accessToken: null, refreshToken: null, roles: [] });

        // Eliminar del localStorage
        localStorage.removeItem("user_id");
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        localStorage.removeItem("roles");
    },

    updateRoles: (roles: Role[]) => {
        set({ roles });

        // Actualizar en localStorage
        localStorage.setItem("roles", JSON.stringify(roles));
    },

    isAuthenticated: async (): Promise<boolean> => {
        const token = get().accessToken;
        if (token === null) return false;
        
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_REACT_APP_DJANGO_API_URL}/auth/validate-token/${token}/`,
                {}
            );
            
            return response.data.valid === true;
        } catch (error) {
            console.error("Error validating token:", error);
            return false;
        }
    },

    retrievePermissions: async (): Promise<RolePermission[]> => {
        try {
            const response = await api.get(`/auth/manage/system-roles/permissions/user/${get().userId}/`);
            const permissions = response.data.role_permissions;
            
            return permissions;
        } catch (error) {
            console.error("Error retrieving permissions:", error);
            return [];
        }
    },

    isAdmin: () => {
        return get().roles.some(role => role.nombre_rol === "Administrador");
    }
}));
