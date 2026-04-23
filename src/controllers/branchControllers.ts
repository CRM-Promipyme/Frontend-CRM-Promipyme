import api from "./api";
import { Branch, BranchListResponse, BranchResponse, BranchDeleteResponse, Region, RegionListResponse, RegionResponse } from "../types/branchTypes";
import { AxiosError } from "axios";

/**
 * Fetches a paginated list of regions from the backend.
 * @param limit Number of regions per page (default: 10)
 * @param offset Pagination offset (default: 0)
 * @param search Optional search term for filtering by name or code
 * @returns RegionListResponse with paginated regions
 */
export const fetchRegions = async (
    limit: number = 10,
    offset: number = 0,
    search?: string
): Promise<RegionListResponse> => {
    try {
        let params: Record<string, string | number> = {
            limit,
            offset,
        };

        if (search && search.trim()) {
            params.search = search;
        }

        const response = await api.get<RegionListResponse>("/offices/regiones/", { params });
        return response.data;
    } catch (error) {
        const axiosError = error as AxiosError;
        console.error("Error fetching regions:", axiosError);
        throw error;
    }
};

/**
 * Creates a new region in the backend.
 * @param regionData Object containing codigo_region, nombre_region, and descripcion
 * @returns The created region data
 */
export const createRegion = async (regionData: {
    codigo_region: string;
    nombre_region: string;
    descripcion?: string;
}): Promise<Region> => {
    try {
        const response = await api.post<RegionResponse>("/offices/regiones/create/", regionData);
        return response.data.data;
    } catch (error) {
        const axiosError = error as AxiosError;
        console.error("Error creating region:", axiosError);
        throw error;
    }
};

/**
 * Updates an existing region in the backend.
 * @param regionId The ID of the region to update
 * @param regionData Object containing codigo_region, nombre_region, and descripcion
 * @returns The updated region data
 */
export const updateRegion = async (
    regionId: number,
    regionData: {
        codigo_region: string;
        nombre_region: string;
        descripcion?: string;
    }
): Promise<Region> => {
    try {
        const response = await api.put<RegionResponse>(
            `/offices/regiones/${regionId}/`,
            regionData
        );
        return response.data.data;
    } catch (error) {
        const axiosError = error as AxiosError;
        console.error("Error updating region:", axiosError);
        throw error;
    }
};

/**
 * Deletes a region from the backend.
 * @param regionId The ID of the region to delete
 * @returns Success message
 */
export const deleteRegion = async (regionId: number): Promise<string> => {
    try {
        const response = await api.delete<BranchDeleteResponse>(
            `/offices/regiones/${regionId}/`
        );
        return response.data.message;
    } catch (error) {
        const axiosError = error as AxiosError;
        console.error("Error deleting region:", axiosError);
        throw error;
    }
};

/**
 * Fetches a paginated list of branches from the backend.
 * @param limit Number of branches per page (default: 10)
 * @param offset Pagination offset (default: 0)
 * @param search Optional search term for filtering by name or code
 * @param regionId Optional region ID for filtering
 * @returns BranchListResponse with paginated branches
 */
export const fetchBranches = async (
    limit: number = 10,
    offset: number = 0,
    search?: string,
    regionId?: number
): Promise<BranchListResponse> => {
    try {
        let params: Record<string, string | number> = {
            limit,
            offset,
        };

        if (search && search.trim()) {
            params.search = search;
        }

        if (regionId) {
            params.region_id = regionId;
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
 * @param branchData Object containing codigo_sucursal, nombre_sucursal, and optional region_id
 * @returns The created branch data
 */
export const createBranch = async (branchData: {
    codigo_sucursal: string;
    nombre_sucursal: string;
    region_id?: number | null;
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
 * @param branchData Object containing codigo_sucursal, nombre_sucursal, and optional region_id
 * @returns The updated branch data
 */
export const updateBranch = async (
    branchId: number,
    branchData: {
        codigo_sucursal: string;
        nombre_sucursal: string;
        region_id?: number | null;
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

/**
 * Assigns multiple branches to a region in bulk.
 * @param branchIds Array of branch IDs to assign
 * @param regionId The region ID to assign to
 * @returns Success message
 */
export const massAssignBranchesToRegion = async (
    branchIds: number[],
    regionId: number
): Promise<string> => {
    try {
        const response = await api.put<{ message: string }>(
            "/offices/sucursales/assign/mass-region/",
            {
                sucursal_ids: branchIds,
                region_id: regionId,
            }
        );
        return response.data.message;
    } catch (error) {
        const axiosError = error as AxiosError;
        console.error("Error assigning branches to region:", axiosError);
        throw error;
    }
};
