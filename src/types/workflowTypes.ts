
export interface Proceso {
    id_proceso: number;
    nombre_proceso: string;
    color: string; // Hexadecimal
    fecha_creacion: string;
    ultima_actualizacion: string;
    etapas: EtapaProceso[];
}

export interface EtapaProceso {
    id_etapa: number;
    nombre_etapa: string;
    orden_etapa: number;
}

export interface Etapa {
    id: string;
    nombre_etapa: string;
    orden_etapa: number;
}

export interface createWorkflowData {
    nombre_proceso: string;
    etapas: Etapa[];
    color: string;
}

export interface Caso {
    id_caso: number;
    nombre_caso: string;
    descripcion_caso: string;
    valor_caso: string;
    fecha_creacion: string;
    fecha_cierre: string;
    fecha_cierre_estimada: string;
    ultima_actualizacion: string;
    abierto: boolean;
    exitoso: boolean;
    contact: number;
    contact_first_name: string;
    contact_last_name: string;
    proceso: number;
    etapa_actual: number;
    creador_caso: number;
    tags: number[];
}

export interface DashboardCase {
    nombre_caso: string;
    proceso: string;
    etapa_actual: string;
    fecha_creacion: string;
    fecha_cierre: string;
    abierto: boolean;
    exitoso: boolean;
}


export interface Task {
    id_tarea_caso: number;
    caso: number;
    creador_tarea: number;
    creador_tarea_first_name: string;
    creador_tarea_last_name: string;
    usuario_asignado: number;
    usuario_asignado_first_name: string;
    usuario_asignado_last_name: string;
    nombre_tarea: string;
    descripcion_tarea: string;
    fecha_creacion: string;
    completado: boolean;
    fecha_completado: string | null;
    fecha_completado_estimada: string | null;
}

export interface PaginatedTasks {
    count: number;
    next: string | null;
    previous: string | null;
    results: Task[];
}