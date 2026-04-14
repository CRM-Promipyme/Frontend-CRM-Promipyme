import api from "./api";
import { showResponseErrors } from "../utils/formatUtils";
import { AxiosError } from "axios";

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
        const axiosError = error as AxiosError;
        console.error("Error creating case:", axiosError);
        showResponseErrors(axiosError.response?.data);
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
        const axiosError = error as AxiosError;
        console.error("Error updating case:", axiosError);
        showResponseErrors(axiosError.response?.data);
        throw error;
    }
};


/**
 * Fetch cases from a specific process and stage
 * @param processId The process ID
 * @param stageId The stage ID
 * @param caseName The case name filter (optional)
 * @param sucursalId The branch/sucursal ID filter (optional)
 * @returns a list of cases (paginated, comes in the form of {'count': number, 'next': string, 'previous': string, 'results': Case[]})
 */
export const fetchStageCases = async (processId: number, stageId: number, caseName: string, sucursalId?: number) => {
    try {
        let endpoint = `/workflows/casos/board-view/${processId}/${stageId}/`;
        const params = [];
        
        if (caseName) {
            params.push(`case_name=${caseName}`);
        }
        if (sucursalId !== undefined) {
            params.push(`sucursal_id=${sucursalId}`);
        }
        
        if (params.length > 0) {
            endpoint += `?${params.join('&')}`;
        }
        
        const response = await api.get(endpoint);
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
 * Fetch a user's related cases
 * @param userId The user's ID
 * @returns a list of cases (paginated, same format as before)
 */
export const fetchUserCases = async (userId: number) => {
    try {
        const response = await api.get(`/workflows/casos/list/?user_id=${userId}`);
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


/**
 * Fetches the forms associated with a case
 * @param caseId The ID of the case
 * @returns a list of forms associated with the case
 */
export const fetchCaseForms = async (caseId: number) => {
    try { 
        const response = await api.get(`/workflows/casos/${caseId}/formularios`);
        return response.data;
    } catch (error) {
        console.error("Error fetching case forms:", error);
        return null;
    }
}

/**
 * Fetches the forms associated with a case (without extra data)
 * @param caseId The ID of the case
 * @returns a list of forms associated with the case
 */
export const simpleFetchCaseForms = async (caseId: number) => {
    try { 
        const response = await api.get(`/workflows/casos/${caseId}/formularios/?fetch_values=false`);
        return response.data;
    } catch (error) {
        console.error("Error fetching case forms:", error);
        return null;
    }
}

/**
 * Fetches the details of a specific form in a case
 * @param caseId The ID of the case
 * @param formId The ID of the form
 * @returns the details of the form in the case
 */
export const caseFormDetail = async (caseId: number, formId: number) => {
    try {
        const response = await api.get(`/workflows/casos/${caseId}/formularios/${formId}/detalle`);
        return response.data;
    } catch (error) {
        console.error("Error fetching case form detail:", error);
        return null;
    }
}

/**
 * Creates a new form for a case
 * @param caseId The ID of the case
 * @param formData The data for the new form
 * @returns the created form data
 */
export const createCaseForm = async (caseId: number, formData: unknown) => {
    try {
        const response = await api.post(`/workflows/casos/${caseId}/formularios/`, formData);
        return response.data;
    } catch (error) {
        const axiosError = error as AxiosError;
        console.error("Error creating case form:", axiosError);
        showResponseErrors(axiosError.response?.data);
        throw error;
    }
}

/** * Updates a case form
 * @param caseId The ID of the case
 * @param formId The ID of the form to update
 * @param formData The updated form data
 * @returns the updated form data
 */
export const updateCaseForm = async (caseId: number, formId: number, formData: unknown) => {
    try {
        const response = await api.put(`/workflows/casos/${caseId}/formularios/${formId}/`, formData);
        return response.data;
    } catch (error) {
        const axiosError = error as AxiosError;
        console.error("Error updating case form:", axiosError);
        showResponseErrors(axiosError.response?.data);
        throw error;
    }
}

/**
 * Deletes a case form
 * @param caseId The ID of the case
 * @param formId The ID of the form to delete
 * @returns the response data from the deletion
 */
export const deleteCaseForm = async (caseId: number, formId: number) => {
    try {
        const response = await api.delete(`/workflows/casos/${caseId}/formularios/${formId}/`);
        return response.data;
    } catch (error) {
        const axiosError = error as AxiosError;
        console.error("Error deleting case form:", axiosError);
        showResponseErrors(axiosError.response?.data);
        throw error;
    }
}

/**
 * Fetches all additional contacts for a case
 * @param caseId The ID of the case
 * @returns the contacts associated with the case
 */
export const fetchCaseContacts = async (caseId: number) => {
    try {
        const response = await api.get(`/workflows/casos/manage/contacts/${caseId}/`);
        return response.data;
    } catch (error) {
        console.error("Error fetching case contacts:", error);
        return null;
    }
}

/**
 * Adds a new contact to a case
 * @param caseId The ID of the case
 * @param contactData The contact data (contacto ID and rol_contacto)
 * @returns the created contact relationship data
 */
export const addContactToCase = async (caseId: number, contactData: { contacto: number; rol_contacto: string }) => {
    try {
        const response = await api.post(`/workflows/casos/manage/contacts/${caseId}/`, contactData);
        return response.data;
    } catch (error) {
        const axiosError = error as AxiosError;
        console.error("Error adding contact to case:", axiosError);
        showResponseErrors(axiosError.response?.data);
        throw error;
    }
}

/**
 * Removes a contact from a case
 * @param caseId The ID of the case
 * @param contactCaseId The ID of the case-contact relationship to remove
 * @returns the response data from the deletion
 */
export const removeContactFromCase = async (caseId: number, contactCaseId: number) => {
    try {
        const response = await api.delete(`/workflows/casos/manage/contacts/${caseId}/${contactCaseId}/`);
        return response.data;
    } catch (error) {
        const axiosError = error as AxiosError;
        console.error("Error removing contact from case:", axiosError);
        showResponseErrors(axiosError.response?.data);
        throw error;
    }
}

/**
 * Performs bulk assignment of cases to a stage and/or process
 * @param caseIds Array of case IDs to move
 * @param processId Target process ID
 * @param stageId Target stage ID
 * @param changeMotive Reason for the change
 * @param assigneeId Optional user ID to assign tasks to
 * @returns the response data
 */
export const bulkAssignCases = async (
    caseIds: number[],
    processId: number,
    stageId: number,
    changeMotive: string,
    assigneeId?: number
) => {
    try {
        const payload: Record<string, unknown> = {
            case_ids: caseIds,
            process_id: processId,
            stage_id: stageId,
            change_motive: changeMotive,
        };
        
        if (assigneeId) {
            payload.assignee_id = assigneeId;
        }

        const response = await api.put(`/workflows/casos/manage/bulk-assignment/`, payload);
        return response.data;
    } catch (error) {
        const axiosError = error as AxiosError;
        console.error("Error bulk assigning cases:", axiosError);
        showResponseErrors(axiosError.response?.data);
        throw error;
    }
}