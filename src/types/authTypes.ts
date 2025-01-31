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