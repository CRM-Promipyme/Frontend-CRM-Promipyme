
const BASE_URL = import.meta.env.VITE_REACT_APP_DJANGO_API_URL;

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