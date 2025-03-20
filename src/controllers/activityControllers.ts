import api from "./api";
import { Activity } from "../types/activityTypes";
import { toast } from "react-toastify";

/**
 * Fetches all activities from the backend for a given entity
 * @param entityType The type of entity to fetch activities for.
 * @param entityId The ID of the entity to fetch activities for.
 * @returns An array of Activity objects.
 */
export const fetchEntityActivities = async (entityType: string, entityId: string): Promise<Activity[]> => {
    try {
        const response = await api.get(`/activities/${entityType}/${entityId}`);
        return response.data.results;
    } catch (error) {
        toast.error("Ha ocurrido un error al cargar el historial de actividades.");
        throw error;
    }
}