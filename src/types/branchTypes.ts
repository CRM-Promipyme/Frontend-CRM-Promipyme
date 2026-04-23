export interface Region {
    id: number;
    codigo_region: string;
    nombre_region: string;
    descripcion?: string;
}

export interface Branch {
    id: number;
    codigo_sucursal: string;
    nombre_sucursal: string;
    region?: Region | null;
}

export interface RegionListResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: Region[];
}

export interface BranchListResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: Branch[];
}

export interface RegionResponse {
    message: string;
    data: Region;
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
