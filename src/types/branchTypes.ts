export interface Branch {
    id: number;
    codigo_sucursal: string;
    nombre_sucursal: string;
}

export interface BranchListResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: Branch[];
}

export interface BranchResponse {
    message: string;
    data: Branch;
}

export interface BranchDeleteResponse {
    message: string;
}

export interface BranchErrorResponse {
    message: string;
    errors?: Record<string, string[]>;
}
