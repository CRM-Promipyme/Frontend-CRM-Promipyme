
export interface Ciudad {
    id: number;
    descripcion: string;
}

export interface Provincia {
    id: number;
    descripcion: string;
    ciudades: Ciudad[];
}

export interface TipoTelefono {
    id_tipo_telefono: number;
    tipo_telefono: string;
}


export interface Contact {
    contact_id: number;
    cedula: string;
    nombres: string;
    apellidos: string;
    email: string;
    fecha_nacimiento: string;
    fecha_ingreso: string;
    last_updated: string;
    telefonos: TelefonosContacto[];
    direcciones: DireccionesContacto[];
}


export interface TelefonosContacto {
    numero_telefonico: string;
    tipo_telefono: string;
    id_tipo_telefono: number;
}


export interface DireccionesContacto {
    calle_direccion: string;
    descripcion_vivienda: string;
    ciudad: string;
    id_ciudad: number;
    provincia: string;
    id_provincia: number;
}


export interface ContactListResponse {
    count: number;
    next: string;
    previous: string;
    results: Contact[];
}