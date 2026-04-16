import api from "./api";
import { Proceso, createWorkflowData, DenialReason, CreateDenialReasonData, UpdateDenialReasonData } from "../types/workflowTypes";
import { showResponseErrors } from "../utils/formatUtils";
import { AxiosError } from "axios";

/**
 * Fetches processes from the backend.
 * @param processName Optional query filter for process name.
 * @param sucursalId Optional query filter for branch/sucursal.
 * @returns An array of Procesos.
 */
export const fetchProcesses = async (processName?: string, sucursalId?: number): Promise<Proceso[]> => {
    try {
        // Build query parameters if filters are provided
        const params: Record<string, string | number> = {};
        if (processName) params.process_name = processName;
        if (sucursalId !== undefined) params.sucursal_id = sucursalId;
        
        const response = await api.get("/workflows/procesos/list/", { params });

        return response.data.processes;
    } catch (error) {
        console.error("Error fetching processes:", error);
        throw error; // Re-throw the error after logging it
    }
};

/**
 * Fetches a single process from the backend.
 * @param processId The ID of the process to fetch.
 * @returns The fetched process data.
 */
export const fetchSingleProcess = async (processId: string): Promise<Proceso> => {
    try {
        const response = await api.get(`/workflows/procesos/list/?process_id=${processId}`);
        return response.data.process;
    }
    catch (error) {
        console.error("Error fetching single process:", error);
        throw error;
    }
}

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
        const axiosError = error as AxiosError;
        console.error("Error creating workflow:", axiosError);
        showResponseErrors(axiosError.response?.data);
        throw error;
    }
}


export const fetchWorkflowForms = async (processId: number) => {
    try {
        const response = await api.get(`/workflows/procesos/${processId}/formularios/`);
        return response.data.forms;
    } catch (error) {
        console.error("Error fetching workflow forms:", error);
        showResponseErrors(error);
        throw error;
    }
}

/**
 * Fetches denial reasons for a specific process.
 * @param processId The ID of the process.
 * @returns An array of denial reasons.
 */
export const fetchDenialReasons = async (processId: number): Promise<DenialReason[]> => {
    try {
        const response = await api.get(`workflows/procesos/${processId}/denial-reasons/`);
        return response.data;
    } catch (error) {
        console.error("Error fetching denial reasons:", error);
        throw error;
    }
}

/**
 * Creates a new denial reason for a process.
 * @param denialReasonData The denial reason data.
 * @returns The created denial reason.
 */
export const createDenialReason = async (denialReasonData: CreateDenialReasonData): Promise<DenialReason> => {
    try {
        const response = await api.post("workflows/denial-reasons/manage/", denialReasonData);
        return response.data.denial_reason;
    } catch (error) {
        const axiosError = error as AxiosError;
        console.error("Error creating denial reason:", axiosError);
        showResponseErrors(axiosError.response?.data);
        throw error;
    }
}

/**
 * Updates an existing denial reason.
 * @param denialReasonId The ID of the denial reason to update.
 * @param denialReasonData The updated denial reason data.
 * @returns The updated denial reason.
 */
export const updateDenialReason = async (denialReasonId: number, denialReasonData: UpdateDenialReasonData): Promise<DenialReason> => {
    try {
        const response = await api.put(`workflows/denial-reasons/manage/${denialReasonId}/`, denialReasonData);
        return response.data.denial_reason;
    } catch (error) {
        const axiosError = error as AxiosError;
        console.error("Error updating denial reason:", axiosError);
        showResponseErrors(axiosError.response?.data);
        throw error;
    }
}

/**
 * Deletes a denial reason.
 * @param denialReasonId The ID of the denial reason to delete.
 */
export const deleteDenialReason = async (denialReasonId: number): Promise<void> => {
    try {
        await api.delete(`workflows/denial-reasons/manage/${denialReasonId}/`);
    } catch (error) {
        const axiosError = error as AxiosError;
        console.error("Error deleting denial reason:", axiosError);
        showResponseErrors(axiosError.response?.data);
        throw error;
    }
}
/**
 * Denies a case with a denial reason.
 * @param caseId The ID of the case to deny.
 * @param denialReasonId The ID of the denial reason.
 * @returns The updated case data.
 */
export const denyCase = async (caseId: number, denialReasonId: number): Promise<any> => {
    try {
        const response = await api.post(`/workflows/casos/manage/deny/${caseId}/`, {
            denial_reason_id: denialReasonId
        });
        return response.data.case;
    } catch (error) {
        const axiosError = error as AxiosError;
        console.error("Error denying case:", axiosError);
        showResponseErrors(axiosError.response?.data);
        throw error;
    }
}

/**
 * Blocks or unblocks a case.
 * @param caseId The ID of the case.
 * @param editable Whether the case should be editable (true = unblock, false = block).
 * @returns The updated case data.
 */
export const blockUnblockCase = async (caseId: number, editable: boolean): Promise<any> => {
    try {
        const response = await api.post(`/workflows/casos/manage/block/${caseId}/`, {
            editable
        });
        return response.data.case;
    } catch (error) {
        const axiosError = error as AxiosError;
        console.error("Error blocking/unblocking case:", axiosError);
        showResponseErrors(axiosError.response?.data);
        throw error;
    }
}

/**
 * Approves a case.
 * @param caseId The ID of the case to approve.
 * @returns The updated case data.
 */
export const approveCase = async (caseId: number): Promise<any> => {
    try {
        const response = await api.post(`/workflows/casos/manage/approve/${caseId}/`, {});
        return response.data.case;
    } catch (error) {
        const axiosError = error as AxiosError;
        console.error("Error approving case:", axiosError);
        showResponseErrors(axiosError.response?.data);
        throw error;
    }
}