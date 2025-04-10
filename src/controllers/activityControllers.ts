import api from "./api";
import { Activity } from "../types/activityTypes";
import { toast } from "react-toastify";

export interface ActivityResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: Activity[];
}

/**
 * Fetches all activities from the backend for a given entity
 * @param entityType The type of entity to fetch activities for.
 * @param entityId The ID of the entity to fetch activities for.
 * @returns the response from the API containing the activities.
 */
export const fetchEntityActivities = async (entityType: string, entityId: string): Promise<ActivityResponse> => {
    try {
        const response = await api.get(`/activities/${entityType}/${entityId}`);
        return response.data;
    } catch (error) {
        toast.error("Ha ocurrido un error al cargar el historial de actividades.");
        throw error;
    }
}

/**
 * Fetch all entity activities with pagination (without ID)
 * @param entityType The type of entity to fetch activities for.
 * @returns the response from the API containing the activities.
 */
export const fetchAllEntityActivties = async (entityType: string): Promise<ActivityResponse> => {
    try {
        const response = await api.get(`/activities/${entityType}/all`);
        return response.data;
    } catch (error) {
        toast.error("Ha ocurrido un error al cargar el historial de actividades.");
        throw error;
    }
}