
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