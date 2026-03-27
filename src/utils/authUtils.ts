import api from "../controllers/api";
import { useAuthStore } from "../stores/authStore";

export function fetchRoles() {
    return api.get(`/auth/dropdown-opts/?roles=true`)
    .then((response) => response.data.roles);
}

export function updateLocalStorageRoles() {
    // Fetch the roles again to make sure that the roles in local storage match the real ones
    fetchRoles()
        .then((roles) => {
            useAuthStore.getState().updateRoles(roles);
        })
        .catch((error) => {
            console.error("Error fetching roles:", error);
        });
}