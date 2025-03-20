import api from "./api";
import { Activity } from "../types/activityTypes";
import { toast } from "react-toastify";

/**
 * Fetches user activities from the backend.
 * @param userId The ID of the user to fetch activities for.
 * @returns An array of Activity objects.
 */
export const fetchUserActivities = async (userId: string): Promise<Activity[]> => {
    try {
        const response = await api.get(`/activities/user/${userId}`);
        return response.data.results;
    } catch (error) {
        toast.error("Ha ocurrido un error al cargar el historial de actividades del usuario.");
        throw error;
    }
}

/**
 * Fetches all contact activities from the backend.
 * @param contactId The ID of the contact to fetch activities for.
 * @returns An array of Activity objects.
 */
export const fetchContactActivities = async (contactId: string): Promise<Activity[]> => {
    try {
        const response = await api.get(`/activities/contact/${contactId}`);
        return response.data.results;
    } catch (error) {
        toast.error("Ha ocurrido un error al cargar el historial de actividades del contacto.");
        throw error;
    }
}