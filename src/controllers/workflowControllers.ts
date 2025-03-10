import api from "./api";
import { Proceso } from "../types/workflowTypes";


/**
 * Fetches processes from the backend.
 * @param processName Optional query filter for process name.
 * @returns An array of Procesos.
 */
export const fetchProcesses = async (processName?: string): Promise<Proceso[]> => {
    try {
        // Build query parameters if a filter is provided
        const params = processName ? { process_name: processName } : {};
        const response = await api.get("/workflows/procesos/list/", { params });
        // Assuming the response structure is { processes: [...] }
        return response.data.processes;
    } catch (error) {
        console.error("Error fetching processes:", error);
        throw error; // Re-throw the error after logging it
    }
};