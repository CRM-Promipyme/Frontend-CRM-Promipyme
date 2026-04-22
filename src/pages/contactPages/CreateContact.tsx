import Select from "react-select";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import api from "../../controllers/api";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CreateContactType, Field } from "../../types/contactTypes";
import "../../styles/auth/contactDetailStyles.css";
import { Spinner } from "../../components/ui/Spinner";
import { useAuthStore } from "../../stores/authStore";
import { useSidebarStore } from "../../stores/sidebarStore";
import { createContact } from "../../controllers/contactControllers";
import { useDropdownOptions } from "../../hooks/userControllerHooks";
import { SidebarLayout } from "../../components/layouts/SidebarLayout";
import { Ciudad, Provincia, TipoTelefono } from "../../types/contactTypes";

// Initial state for the contact form
const initialFormData = {
    cedula: "",
    nombres: "",
    apellidos: "",
    email: "",
    fecha_nacimiento: "",
    telefonos: [
        { numero_telefonico: "", tipo_telefono: "", id_tipo_telefono: 0 },
    ],
    direcciones: [
        {
            calle_direccion: "",
            descripcion_vivienda: "",
            ciudad: "",
            id_ciudad: 0,
            provincia: "",
            id_provincia: 0,
        },
    ],
};

export function CreateContact() {
    // Global States
    const sidebarWidthPx = useSidebarStore((state) => state.sidebarWidthPx);
    const accessToken = useAuthStore((state) => state.accessToken);
    const dropdownOptions = useDropdownOptions(accessToken);

    // Local States
    const [formData, setFormData] = useState(initialFormData);
    const [loading, setLoading] = useState<boolean>(false);
    const navigate = useNavigate();
    const [contactFields, setContactFields] = useState<Field[]>([]);
    const [additionalFieldValues, setAdditionalFieldValues] = useState<Record<number, string | number | boolean>>({});

    useEffect(() => {
        const fetchFields = async () => {
            try {
                const res = await api.get("/contacts/fields/");
                setContactFields(res.data.additional_fields);
                // Optionally: setBaseFields(res.data.base_fields);
            } catch (error) {
                console.error(error);
                toast.error("Error al cargar los campos de contacto");
            }
        };
        fetchFields();
    }, []);

    // Basic input change handler
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        
        // Cedula: only numbers, max 11 characters
        if (id === "cedula") {
            const numericValue = value.replace(/\D/g, "").slice(0, 11);
            setFormData((prev) => ({ ...prev, [id]: numericValue }));
            return;
        }
        
        setFormData((prev) => ({ ...prev, [id]: value }));
    };

    // Handle phone number changes
    const handlePhoneChange = (
        index: number,
        field: keyof typeof formData.telefonos[number],
        value: string
    ) => {
        // Only allow numbers for phone number field
        let finalValue = value;
        if (field === "numero_telefonico") {
            finalValue = value.replace(/\D/g, "");
        }
        
        setFormData((prev) => ({
            ...prev,
            telefonos: prev.telefonos.map((phone, i) =>
                i === index ? { ...phone, [field]: finalValue } : phone
            ),
        }));
    };

    // Handle address changes
    const handleAddressChange = (
        index: number,
        field: keyof typeof formData.direcciones[number],
        value: string
    ) => {
        setFormData((prev) => ({
            ...prev,
            direcciones: prev.direcciones.map((addr, i) =>
                i === index ? { ...addr, [field]: value } : addr
            ),
        }));
    };

    // Handle province selection change for addresses
    const handleProvinceSelect = (index: number, selectedItem: Provincia) => {
        const updatedAddresses = [...formData.direcciones];
        updatedAddresses[index] = {
            ...updatedAddresses[index],
            provincia: selectedItem.descripcion,
            id_provincia: selectedItem.id,
            ciudad: "",
            id_ciudad: 0,
        };
        setFormData((prev) => ({ ...prev, direcciones: updatedAddresses }));
    };

    // Handle city selection change for addresses
    const handleCitySelect = (index: number, selectedItem: Ciudad) => {
        const updatedAddresses = [...formData.direcciones];
        updatedAddresses[index] = {
            ...updatedAddresses[index],
            ciudad: selectedItem.descripcion,
            id_ciudad: selectedItem.id,
        };
        setFormData((prev) => ({ ...prev, direcciones: updatedAddresses }));
    };

    // Handle phone type selection change
    const handlePhoneTypeSelect = (index: number, selectedItem: TipoTelefono) => {
        const updatedPhones = [...formData.telefonos];
        updatedPhones[index] = {
            ...updatedPhones[index],
            tipo_telefono: selectedItem.tipo_telefono,
            id_tipo_telefono: selectedItem.id_tipo_telefono,
        };
        setFormData((prev) => ({ ...prev, telefonos: updatedPhones }));
    };

    // Functions to add or remove phone numbers
    const addPhone = () => {
        setFormData((prev) => ({
            ...prev,
            telefonos: [
                ...prev.telefonos,
                { numero_telefonico: "", tipo_telefono: "", id_tipo_telefono: 0 },
            ],
        }));
    };

    const removePhone = (index: number) => {
        setFormData((prev) => ({
            ...prev,
            telefonos: prev.telefonos.filter((_, i) => i !== index),
        }));
    };

    // Functions to add or remove addresses
    const addAddress = () => {
        setFormData((prev) => ({
            ...prev,
            direcciones: [
                ...prev.direcciones,
                {
                    calle_direccion: "",
                    descripcion_vivienda: "",
                    ciudad: "",
                    id_ciudad: 0,
                    provincia: "",
                    id_provincia: 0,
                },
            ],
        }));
    };

    const removeAddress = (index: number) => {
        setFormData((prev) => ({
            ...prev,
            direcciones: prev.direcciones.filter((_, i) => i !== index),
        }));
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Validate mandatory base fields
            if (!formData.cedula.trim()) {
                toast.error("Cédula es obligatoria");
                setLoading(false);
                return;
            }

            if (formData.telefonos.length === 0 || !formData.telefonos.some(t => t.numero_telefonico.trim())) {
                toast.error("Al menos un número de teléfono es obligatorio");
                setLoading(false);
                return;
            }

            if (formData.direcciones.length === 0 || !formData.direcciones.some(d => d.calle_direccion.trim())) {
                toast.error("Al menos una dirección es obligatoria");
                setLoading(false);
                return;
            }

            // Validate required custom fields
            const requiredFields = contactFields.filter(f => f.required);
            const missingRequired = requiredFields.filter(
                f => additionalFieldValues[f.id!] === "" || 
                     additionalFieldValues[f.id!] === null ||
                     additionalFieldValues[f.id!] === undefined
            );

            if (missingRequired.length > 0) {
                const fieldNames = missingRequired.map(f => f.field_name).join(", ");
                toast.error(`Los siguientes campos requeridos están vacíos: ${fieldNames}`);
                setLoading(false);
                return;
            }

            // Prepare campos_adicionales from additionalFieldValues
            const campos_adicionales = Object.entries(additionalFieldValues)
                .filter(([, value]) => value !== "" && value !== null)
                .map(([id, value]) => ({
                    id: Number(id),
                    field_value: value
                }));

            const createdContact = await createContact({
                ...formData,
                campos_adicionales
            } as CreateContactType);

            toast.success("Contacto creado correctamente.");
            // Optionally, reset the form after successful creation:
            setFormData(initialFormData);
            navigate(`/contacts/details/${createdContact.contact_id}`);
        } catch (error) {
            console.error("Error creating contact:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SidebarLayout sidebarWidthPx={sidebarWidthPx}>
            <h1 className="page-title">Crear Contacto</h1>
            <div className="create-contact-form-card card-body" style={{ padding: "50px" }}>
                {loading ? (
                    <Spinner />
                ) : (
                    <motion.form
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        onSubmit={handleSubmit}
                        style={{ textAlign: "left", lineHeight: "2" }}
                    >
                        {/* Información Básica */}
                        <div style={{ 
                            backgroundColor: "#f8f9fa", 
                            padding: "30px", 
                            borderRadius: "8px", 
                            marginBottom: "30px",
                            border: "1px solid #e9ecef"
                        }}>
                            <h4 style={{ marginBottom: "25px", color: "#2c3e50", fontWeight: "600" }}>
                                <i className="bi bi-person me-2"></i>Información Básica
                            </h4>
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <div className="user-profile-info-item mb-3">
                                        <label>
                                            Cédula <span style={{ color: "red" }}>*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="cedula"
                                            value={formData.cedula}
                                            onChange={handleChange}
                                            placeholder="Ingresa la cédula (máximo 11 dígitos)"
                                            maxLength={11}
                                            inputMode="numeric"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="user-profile-info-item mb-3">
                                        <label>Nombres</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="nombres"
                                            value={formData.nombres}
                                            onChange={handleChange}
                                            placeholder="Ingresa los nombres"
                                        />
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="user-profile-info-item mb-3">
                                        <label>Apellidos</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="apellidos"
                                            value={formData.apellidos}
                                            onChange={handleChange}
                                            placeholder="Ingresa los apellidos"
                                        />
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="user-profile-info-item mb-3">
                                        <label>Email</label>
                                        <input
                                            type="email"
                                            className="form-control"
                                            id="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            placeholder="Ingresa el email"
                                        />
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="user-profile-info-item mb-3">
                                        <label>Fecha de Nacimiento</label>
                                        <input
                                            type="date"
                                            className="form-control"
                                            id="fecha_nacimiento"
                                            value={formData.fecha_nacimiento}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {contactFields.length > 0 && (
                            <div style={{ 
                                backgroundColor: "#f8f9fa", 
                                padding: "30px", 
                                borderRadius: "8px", 
                                marginBottom: "30px",
                                border: "1px solid #e9ecef"
                            }}>
                                <h4 style={{ marginBottom: "25px", color: "#2c3e50", fontWeight: "600" }}>
                                    <i className="bi bi-sliders me-2"></i>Campos Adicionales
                                </h4>
                                <div className="row g-3">
                                    {contactFields.map((field) => (
                                        <div key={field.id} className="col-md-6">
                                            <label className="form-label">
                                                {field.field_name}
                                                {field.required && <span style={{ color: "red", marginLeft: "4px" }}>*</span>}
                                            </label>
                                            {field.field_type === 4 || field.field_type_name === "Booleano" ? (
                                                <Select
                                                    options={[
                                                        { value: true, label: "Verdadero" },
                                                        { value: false, label: "Falso" }
                                                    ]}
                                                    value={
                                                        [true, false].includes(additionalFieldValues[field.id!] as boolean)
                                                            ? { value: additionalFieldValues[field.id!], label: additionalFieldValues[field.id!] ? "Verdadero" : "Falso" }
                                                            : null
                                                    }
                                                    onChange={selected =>
                                                        setAdditionalFieldValues(prev => ({
                                                            ...prev,
                                                            [field.id!]: selected ? selected.value : ""
                                                        }))
                                                    }
                                                    placeholder="Seleccione..."
                                                    className="react-select-container"
                                                    classNamePrefix="react-select"
                                                    isClearable
                                                />
                                            ) : field.field_type === 3 || field.field_type_name?.toLowerCase() === "fecha" ? (
                                                <input
                                                    type="datetime-local"
                                                    className="form-control"
                                                    value={
                                                        typeof additionalFieldValues[field.id!] === "boolean"
                                                            ? ""
                                                            : (additionalFieldValues[field.id!] as string | number | undefined) ?? ""
                                                    }
                                                    onChange={e =>
                                                        setAdditionalFieldValues(prev => ({
                                                            ...prev,
                                                            [field.id!]: e.target.value
                                                        }))
                                                    }
                                                />
                                            ) : field.field_type === 5 || field.field_type_name === "Dropdown" ? (
                                                <Select
                                                    options={(field.options || []).map(opt => ({
                                                        value: opt.option_value,
                                                        label: opt.option_label
                                                    }))}
                                                    value={
                                                        field.options?.find(opt => opt.option_value === additionalFieldValues[field.id!])
                                                            ? { value: additionalFieldValues[field.id!], label: field.options.find(opt => opt.option_value === additionalFieldValues[field.id!])?.option_label || "" }
                                                            : null
                                                    }
                                                    onChange={selected =>
                                                        setAdditionalFieldValues(prev => ({
                                                            ...prev,
                                                            [field.id!]: selected ? selected.value : ""
                                                        }))
                                                    }
                                                    placeholder="Seleccione..."
                                                    className="react-select-container"
                                                    classNamePrefix="react-select"
                                                    isClearable
                                                />
                                            ) : (
                                                <input
                                                    type={field.field_type === 2 || field.field_type_name === "Número" ? "number" : "text"}
                                                    className="form-control"
                                                    placeholder="Ingresa el valor aquí..."
                                                    maxLength={field.max_length || undefined}
                                                    value={
                                                        typeof additionalFieldValues[field.id!] === "boolean"
                                                            ? (additionalFieldValues[field.id!] ? "true" : "false")
                                                            : (additionalFieldValues[field.id!] as string | number | undefined) ?? ""
                                                    }
                                                    onChange={e => {
                                                        let finalValue = e.target.value;
                                                        
                                                        // Apply max_length limit
                                                        if (field.max_length && finalValue.length > field.max_length) {
                                                            finalValue = finalValue.slice(0, field.max_length);
                                                        }
                                                        
                                                        setAdditionalFieldValues(prev => ({
                                                            ...prev,
                                                            [field.id!]: finalValue
                                                        }));
                                                    }}
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Información de Contacto */}
                        <div style={{ 
                            backgroundColor: "#f8f9fa", 
                            padding: "30px", 
                            borderRadius: "8px", 
                            marginBottom: "30px",
                            border: "1px solid #e9ecef"
                        }}>
                            <h4 style={{ marginBottom: "25px", color: "#2c3e50", fontWeight: "600" }}>
                                <i className="bi bi-telephone me-2"></i>Teléfonos <span style={{ color: "red" }}>*</span>
                            </h4>
                            <div className="user-profile-info d-flex flex-column">
                                {formData.telefonos.map((telefono, index) => (
                                    <motion.div
                                        key={index}
                                        className="mb-4"
                                        style={{
                                            backgroundColor: "white",
                                            padding: "20px",
                                            borderRadius: "6px",
                                            border: "1px solid #dee2e6"
                                        }}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                    >
                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                            <h6 className="mb-0" style={{ color: "#495057" }}>Teléfono {index + 1}</h6>
                                            {formData.telefonos.length > 1 && (
                                                <motion.button
                                                    type="button"
                                                    onClick={() => removePhone(index)}
                                                    className="btn btn-outline-danger btn-sm"
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                >
                                                    <i className="bi bi-trash"></i>
                                                </motion.button>
                                            )}
                                        </div>
                                        <div className="row g-2">
                                            <div className="col-md-6">
                                                <div className="user-profile-info-item mb-2">
                                                    <label>Número Teléfonico</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        value={telefono.numero_telefonico}
                                                        onChange={(e) =>
                                                            handlePhoneChange(index, "numero_telefonico", e.target.value)
                                                        }
                                                        placeholder="Solo números (ej: 8095551234)"
                                                        inputMode="numeric"
                                                    />
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="user-profile-info-item mb-2">
                                                    <label>Tipo de Teléfono</label>
                                                    <Select
                                                        options={dropdownOptions.tipos_telefono}
                                                        value={
                                                            dropdownOptions.tipos_telefono.find(
                                                                (t) => t.id_tipo_telefono === telefono.id_tipo_telefono
                                                            ) || null
                                                        }
                                                        getOptionLabel={(option: TipoTelefono) => option.tipo_telefono}
                                                        getOptionValue={(option: TipoTelefono) => String(option.id_tipo_telefono)}
                                                        onChange={(selected) => {
                                                            if (selected) handlePhoneTypeSelect(index, selected as TipoTelefono);
                                                        }}
                                                        placeholder="Selecciona tipo"
                                                        className="react-select-container"
                                                        classNamePrefix="react-select"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                                <motion.button
                                    type="button"
                                    onClick={addPhone}
                                    className="btn btn-outline-primary btn-sm align-self-start"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <i className="bi bi-plus-circle me-2"></i>Agregar Teléfono
                                </motion.button>
                            </div>
                        </div>

                        {/* Direcciones */}
                        <div style={{ 
                            backgroundColor: "#f8f9fa", 
                            padding: "30px", 
                            borderRadius: "8px", 
                            marginBottom: "30px",
                            border: "1px solid #e9ecef"
                        }}>
                            <h4 style={{ marginBottom: "25px", color: "#2c3e50", fontWeight: "600" }}>
                                <i className="bi bi-geo-alt me-2"></i>Direcciones <span style={{ color: "red" }}>*</span>
                            </h4>
                            <div className="user-profile-info d-flex flex-column">
                                {formData.direcciones.map((direccion, index) => (
                                    <motion.div
                                        key={index}
                                        className="mb-4"
                                        style={{
                                            backgroundColor: "white",
                                            padding: "20px",
                                            borderRadius: "6px",
                                            border: "1px solid #dee2e6"
                                        }}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                    >
                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                            <h6 className="mb-0" style={{ color: "#495057" }}>Dirección {index + 1}</h6>
                                            {formData.direcciones.length > 1 && (
                                                <motion.button
                                                    type="button"
                                                    onClick={() => removeAddress(index)}
                                                    className="btn btn-outline-danger btn-sm"
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                >
                                                    <i className="bi bi-trash"></i>
                                                </motion.button>
                                            )}
                                        </div>
                                        <div className="row g-2">
                                            <div className="col-md-6">
                                                <div className="user-profile-info-item mb-2">
                                                    <label>Calle</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        value={direccion.calle_direccion}
                                                        onChange={(e) =>
                                                            handleAddressChange(index, "calle_direccion", e.target.value)
                                                        }
                                                        placeholder="Ingresa la calle"
                                                    />
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="user-profile-info-item mb-2">
                                                    <label>Descripción de la vivienda</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        value={direccion.descripcion_vivienda}
                                                        onChange={(e) =>
                                                            handleAddressChange(index, "descripcion_vivienda", e.target.value)
                                                        }
                                                        placeholder="Ingresa la descripción"
                                                    />
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="user-profile-info-item mb-2">
                                                    <label>Provincia</label>
                                                    <Select
                                                        options={dropdownOptions.provincias}
                                                        value={
                                                            dropdownOptions.provincias.find(
                                                                (p) => p.id === direccion.id_provincia
                                                            ) || null
                                                        }
                                                        getOptionLabel={(option: Provincia) => option.descripcion}
                                                        getOptionValue={(option: Provincia) => String(option.id)}
                                                        onChange={(selected) => {
                                                            if (selected) handleProvinceSelect(index, selected as Provincia);
                                                        }}
                                                        placeholder="Selecciona provincia"
                                                        className="react-select-container"
                                                        classNamePrefix="react-select"
                                                    />
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="user-profile-info-item mb-2">
                                                    <label>Ciudad</label>
                                                    <Select
                                                        options={
                                                            dropdownOptions.provincias.find((p) => p.id === direccion.id_provincia)?.ciudades || []
                                                        }
                                                        value={
                                                            (
                                                                dropdownOptions.provincias.find((p) => p.id === direccion.id_provincia)?.ciudades || []
                                                            ).find((c): c is Ciudad => c.id === direccion.id_ciudad) || null
                                                        }
                                                        getOptionLabel={(option: Ciudad) => option.descripcion}
                                                        getOptionValue={(option: Ciudad) => String(option.id)}
                                                        onChange={(selected) => {
                                                            if (selected) handleCitySelect(index, selected as Ciudad);
                                                        }}
                                                        placeholder="Selecciona ciudad"
                                                        className="react-select-container"
                                                        classNamePrefix="react-select"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                                <motion.button
                                    type="button"
                                    onClick={addAddress}
                                    className="btn btn-outline-primary btn-sm align-self-start"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <i className="bi bi-plus-circle me-2"></i>Agregar Dirección
                                </motion.button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="user-profile-action-btns" style={{ width: "100%", marginTop: "30px" }}>
                            <motion.button
                                type="submit"
                                className="btn btn-primary"
                                style={{ width: "100%", padding: "12px", fontSize: "16px", fontWeight: "600" }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Spinner /> Creando Contacto...
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-person-plus me-2"></i>Crear Contacto
                                    </>
                                )}
                            </motion.button>
                        </div>
                    </motion.form>
                )}
            </div>
        </SidebarLayout>
    );
}
