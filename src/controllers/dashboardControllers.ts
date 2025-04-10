import api from "./api";


/**
 * Fetches the dashboard information
 * @returns the dashboard information
 * @throws error if the request fails
 */
export const fetchDashboardInfo = async () => {
    try {
        const response = await api.get("/reports/dashboard/");
        return response.data;
    } catch (error) {
        console.error("Error fetching dashboard info:", error);
        return null;
    }
}