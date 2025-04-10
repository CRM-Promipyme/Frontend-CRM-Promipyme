import api from "./api";
import { showResponseErrors } from "../utils/formatUtils";

/**
 * Allows creation of a case
 * @param caseData
 * @returns 
 */
export const createCase = async (caseData: unknown) => {
    try{
        const response = await api.post("/workflows/casos/manage/create/", caseData);
        return response.data;
    } catch (error) {
        console.error("Error creating case:", error);
        
        showResponseErrors(error.response?.data);
        throw error;
    }
};


/**
 * Updates a case
 * @param caseId The ID of the case
 * @param caseData The updated case data
 * @returns the updated case
 */
export const updateCase = async (caseId: number, caseData: unknown) => {
    try {
        const response = await api.put(`/workflows/casos/manage/update/${caseId}/`, caseData);
        return response.data;
    } catch (error) {
        console.error("Error updating case:", error);
        showResponseErrors(error.response?.data);
        throw error;
    }
};


/**
 * Fetch cases from a specific process and stage
 * @param processId The process ID
 * @param stageId The stage ID
 * @returns a list of cases (paginated, comes in the form of {'count': number, 'next': string, 'previous': string, 'results': Case[]})
 */
export const fetchStageCases = async (processId: number, stageId: number) => {
    try {
        const response = await api.get(`/workflows/casos/board-view/${processId}/${stageId}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching cases:", error);
        return null;
    }
};


/**
 * Fetch all of a process' cases
 * @param processId The process' ID
 * @returns a list of cases (paginasted, sames as format as before)
 */
export const fetchProcessCases = async (processId: number) => {
    try {
        const response = await api.get(`/workflows/casos/list/?process_id=${processId}`)
        return response.data
    } catch (error) {
        console.error("Error fetching ccases: ", error)
        return null;
    }
};


/**
 * Fetch a contact's related cases
 * @param contactId The contact's ID
 * @returns a list of cases (paginated, same format as before)
 */
export const fetchContactCases = async (contactId: number) => {
    try {
        const response = await api.get(`/workflows/casos/list/?contact_id=${contactId}`);
        return response.data;
    }
    catch (error) {
        console.error("Error fetching cases: ", error);
        return null;
    }
}


/**
 * Updates the stage of a case
 * @param caseId The ID of the case
 * @param stageId The ID of the new stage
 * @param changeMotive The reason for the change
 */
export const updateCaseStage = async (caseId: number, stageId: number, changeMotive: string) => {
    try {
        const response = await api.put(`/workflows/casos/manage/update/stage/${caseId}/`, {
            stage_id: stageId,
            change_motive: changeMotive,
        });
        return response.data;
    } catch (error) {
        console.error("Error updating case stage:", error);
        throw error;
    }
};


/**
 * Fetches a case by its ID
 * @param caseId The ID of the case
 * @returns the case
 */
export const fetchCase = async (caseId: number) => {
    try {
        const response = await api.get(`/workflows/casos/list/?case_id=${caseId}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching case:", error);
        return null;
    }
};