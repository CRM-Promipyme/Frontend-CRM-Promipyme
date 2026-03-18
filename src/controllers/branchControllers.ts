import api from "./api";
import { Branch, BranchListResponse, BranchResponse, BranchDeleteResponse } from "../types/branchTypes";
import { AxiosError } from "axios";

/**
 * Fetches a paginated list of branches from the backend.
 * @param limit Number of branches per page (default: 10)
 * @param offset Pagination offset (default: 0)
 * @param search Optional search term for filtering by name or code
 * @returns BranchListResponse with paginated branches
 */
export const fetchBranches = async (
    limit: number = 10,
    offset: number = 0,
    search?: string
): Promise<BranchListResponse> => {
    try {
        let params: Record<string, string | number> = {
            limit,
            offset,
        };

        if (search && search.trim()) {
            params.search = search;
        }

        const response = await api.get<BranchListResponse>("/offices/sucursales/", { params });
        return response.data;
    } catch (error) {
        const axiosError = error as AxiosError;
        console.error("Error fetching branches:", axiosError);
        throw error;
    }
};

/**
 * Creates a new branch in the backend.
 * @param branchData Object containing codigo_sucursal and nombre_sucursal
 * @returns The created branch data
 */
export const createBranch = async (branchData: {
    codigo_sucursal: string;
    nombre_sucursal: string;
}): Promise<Branch> => {
    try {
        const response = await api.post<BranchResponse>("/offices/sucursales/create/", branchData);
        return response.data.data;
    } catch (error) {
        const axiosError = error as AxiosError;
        console.error("Error creating branch:", axiosError);
        throw error;
    }
};

/**
 * Updates an existing branch in the backend.
 * @param branchId The ID of the branch to update
 * @param branchData Object containing codigo_sucursal and nombre_sucursal
 * @returns The updated branch data
 */
export const updateBranch = async (
    branchId: number,
    branchData: {
        codigo_sucursal: string;
        nombre_sucursal: string;
    }
): Promise<Branch> => {
    try {
        const response = await api.put<BranchResponse>(
            `/offices/sucursales/${branchId}/`,
            branchData
        );
        return response.data.data;
    } catch (error) {
        const axiosError = error as AxiosError;
        console.error("Error updating branch:", axiosError);
        throw error;
    }
};

/**
 * Deletes a branch from the backend.
 * @param branchId The ID of the branch to delete
 * @returns Success message
 */
export const deleteBranch = async (branchId: number): Promise<string> => {
    try {
        const response = await api.delete<BranchDeleteResponse>(
            `/offices/sucursales/${branchId}/`
        );
        return response.data.message;
    } catch (error) {
        const axiosError = error as AxiosError;
        console.error("Error deleting branch:", axiosError);
        throw error;
    }
};
