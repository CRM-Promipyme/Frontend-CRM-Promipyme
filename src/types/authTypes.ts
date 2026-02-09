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

export interface UserProfile {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    username: string;
    is_active: boolean;
    roles: { nombre_rol: string; id_rol: number }[];
    profile_data: Record<string, unknown>;
}

export interface BasePermissions {
    id: number;
    rol: string;
    visualize_reports: boolean;
    export_reports: boolean;
    modify_contact_fields: boolean;
    create_contacts: boolean;
    delete_contacts: boolean;
    invite_users: boolean;
    see_user_list: boolean;
    approve_accounts: boolean;
    deny_accounts: boolean;
    create_roles: boolean;
    update_roles: boolean;
    delete_roles: boolean;
    create_branches: boolean;
    update_branches: boolean;
    delete_branches: boolean;
}

export interface WorkflowPermission {
    id: number;
    rol: string;
    proceso: number;
    etapa: number[];
}

export interface RolePermission {
    base_permissions: BasePermissions;
    workflow_permissions: WorkflowPermission[];
}

export type PermissionsResponse = RolePermission[];