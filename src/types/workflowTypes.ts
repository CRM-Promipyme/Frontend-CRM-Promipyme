
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

export interface createWorkflowData {
    nombre_proceso: string;
    etapas: EtapaProceso[];
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
