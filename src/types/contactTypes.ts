
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

export interface CampoAdicional {
    id: number;
    field_value: string | number | boolean;
}

export interface AditionalFieldUpdate {
    id: number;
    field_name: string;
    field_type: number | string;
    field_value: string | number | boolean;
    type_id?: number;
    field_type_name?: string;
    options?: FieldOption[];
    max_length?: number | null;
    required?: boolean;
}

export interface CreateContactType {
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
    campos_adicionales: CampoAdicional[];
}

export interface UpdateContact {
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
    campos_adicionales: AditionalFieldUpdate[];
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

// Field Type IDs
// 1: Texto (Text)
// 2: Número (Number)
// 3: Fecha (Date)
// 4: Booleano (Boolean)
// 5: Dropdown

export interface FieldOption {
    id?: number;
    field?: number;
    option_value: string;
    option_label: string;
}

export interface Field {
    id?: number;
    field_name: string;
    field_type: number | string;
    field_type_name?: string;
    max_length?: number | null;
    required?: boolean;
    options?: FieldOption[] | null;
}

export interface FieldTypeOption {
    id: number;
    field_type_name: string;
}

export interface ContactFieldsPayload {
    contact_fields: FieldPayload[];
}

export interface FieldPayload {
    id?: number | string;
    field_name: string;
    field_type: number;
    max_length?: number | null;
    required?: boolean;
    options?: FieldOption[];
}
