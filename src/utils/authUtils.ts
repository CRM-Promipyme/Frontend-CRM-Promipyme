import { useAuthStore } from "../stores/authStore";

const BASE_URL = import.meta.env.VITE_VERCEL_REACT_APP_DJANGO_API_URL;

export function fetchRoles(accessToken: string) {
    return fetch(`${BASE_URL}/auth/dropdown-opts/?roles=true`, {
        headers: { "Authorization": `Bearer ${accessToken}` },
    })
    .then((response) => {
        if (!response.ok) throw new Error();
        return response.json();
    })
    .then((data) => data.roles);
}

export function updateLocalStorageRoles() {
    // Fetch the roles again to make sure that the roles in local storage match the real ones
    const accessToken = useAuthStore.getState().accessToken;
    if (!accessToken) {
        console.error("No access token found");
        return;
    }

    fetchRoles(accessToken)
        .then((roles) => {
            useAuthStore.getState().updateRoles(roles);
        })
        .catch((error) => {
            console.error("Error fetching roles:", error);
        });
}