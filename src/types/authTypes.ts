export interface Role {
    nombre_rol: string;
    id_rol: number;
}

export interface LoginResponse {
    user_id: number;
    refresh: string;
    access: string;
    roles: Role[];
}

export interface PendingAccount {
    id: number;
    first_name: string;
    last_name: string;
    username: string;
    email: string;
    requested_date: string;
}

export interface PendingAccountResponse {
    count: number;
    next: string;
    previous: string;
    results: PendingAccount[];
}

export interface User {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    username: string;
    is_active: boolean;
    roles: Role[];
    profile_data: Record<string, unknown>; // Dict<string, any>
}

export interface UserListResponse {
    count: number;
    next: string;
    previous: string;
    results: User[];
}