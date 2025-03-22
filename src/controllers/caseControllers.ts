import api from "./api";

/**
 * Allows creation of a case
 * @param caseData
 * @returns 
 */
export const createCase = async (caseData: unknown) => {
    const response = await api.post("/workflows/casos/manage/create/", caseData);
    return response.data;
};
