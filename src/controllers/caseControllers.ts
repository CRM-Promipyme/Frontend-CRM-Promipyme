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
