import api from "./api";
import { Proceso, createWorkflowData } from "../types/workflowTypes";
import { showResponseErrors } from "../utils/formatUtils";

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

        return response.data.processes;
    } catch (error) {
        console.error("Error fetching processes:", error);
        throw error; // Re-throw the error after logging it
    }
};

/**
 * Creates a new workflow in the backend.
 * @param workflowData The data for the new workflow (JSON).
 * @returns The created workflow data.
 */
export const createWorkflow = async (workflowData: createWorkflowData): Promise<Proceso> => {
    try {
        const response = await api.post("/workflows/procesos/manage/", workflowData);
        console.log("Workflow created:", response.data);
        const createdWorkflow = response.data.process;
        
        return createdWorkflow;
    } catch (error) {
        console.error("Error creating workflow:", error);
        
        showResponseErrors(error.response?.data);
        throw error;
    }
}
