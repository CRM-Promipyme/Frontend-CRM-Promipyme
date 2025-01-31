import { create } from "zustand";
import { LoginResponse, Role } from "../types/authTypes";

interface AuthState {
    userId: number | null;
    accessToken: string | null;
    refreshToken: string | null;
    roles: Role[];
    login: (response: LoginResponse) => Promise<boolean>;
    logout: () => void;
    isAuthenticated: () => Promise<boolean>;
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

    isAuthenticated: async (): Promise<boolean> => {
        // TODO: Validar en el backend si el token es válido
        const token = get().accessToken;
        if (!token) return false
        else return true;
    },
}));
