import api from "./api";
import { UserActivity } from "../types/activityTypes";
import { toast } from "react-toastify";

/**
 * Fetches user activities from the backend.
 * @param userId The ID of the user to fetch activities for.
 * @returns An array of UserActivity objects.
 */
export const fetchUserActivities = async (userId: string): Promise<UserActivity[]> => {
    try {
        const response = await api.get(`/activities/user/${userId}`);
        return response.data.results;
    } catch (error) {
        toast.error("Ha ocurrido un error al cargar el historial de actividades del usuario.");
        throw error;
    }
}