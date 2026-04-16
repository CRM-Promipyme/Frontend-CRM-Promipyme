import api from "./api";

export interface EnhancedDashboardFilters {
    date_start?: string;
    date_end?: string;
    sucursal_id?: number;
    region?: string;
    process_id?: number;
    restructurado?: boolean;
}

/**
 * Fetches the dashboard information
 * @returns the dashboard information
 * @throws error if the request fails
 */
export const fetchDashboardInfo = async (dateStart: string, dateEnd: string) => {
    try {
        const response = await api.get("/reports/dashboard/?date_start=" + dateStart + "&date_end=" + dateEnd);
        return response.data;
    } catch (error) {
        console.error("Error fetching dashboard info:", error);
        return null;
    }
}

/**
 * Fetches the enhanced dashboard with multiple filter options
 * @param filters - Dashboard filter options
 * @returns the enhanced dashboard information
 * @throws error if the request fails
 */
export const fetchEnhancedDashboard = async (filters: EnhancedDashboardFilters) => {
    try {
        const params = new URLSearchParams();
        
        if (filters.date_start) params.append('date_start', filters.date_start);
        if (filters.date_end) params.append('date_end', filters.date_end);
        if (filters.sucursal_id) params.append('sucursal_id', String(filters.sucursal_id));
        if (filters.region) params.append('region', filters.region);
        if (filters.process_id) params.append('process_id', String(filters.process_id));
        if (filters.restructurado !== undefined) params.append('restructurado', String(filters.restructurado));

        const response = await api.get(`/reports/dashboard/enhanced/?${params.toString()}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching enhanced dashboard info:", error);
        return null;
    }
}

/**
 * Fetches all custom KPIs
 */
export const fetchCustomKPIs = async () => {
    try {
        const response = await api.get("/reports/custom-kpis/list/");
        return response.data;
    } catch (error) {
        console.error("Error fetching custom KPIs:", error);
        return null;
    }
}

/**
 * Creates a new custom KPI
 */
export const createCustomKPI = async (data: {
    name: string;
    description: string;
    metric_type: string;
    active: boolean;
}) => {
    try {
        const response = await api.post("/reports/custom-kpis/manage/", data);
        return response.data;
    } catch (error) {
        console.error("Error creating custom KPI:", error);
        throw error;
    }
}

/**
 * Updates an existing custom KPI
 */
export const updateCustomKPI = async (kpi_id: number, data: {
    name?: string;
    description?: string;
    metric_type?: string;
    active?: boolean;
}) => {
    try {
        const response = await api.put(`/reports/custom-kpis/manage/${kpi_id}/`, data);
        return response.data;
    } catch (error) {
        console.error("Error updating custom KPI:", error);
        throw error;
    }
}

/**
 * Deletes a custom KPI
 */
export const deleteCustomKPI = async (kpi_id: number) => {
    try {
        const response = await api.delete(`/reports/custom-kpis/manage/${kpi_id}/`);
        return response.data;
    } catch (error) {
        console.error("Error deleting custom KPI:", error);
        throw error;
    }
}