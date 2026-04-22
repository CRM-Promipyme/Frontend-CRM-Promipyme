import Select from "react-select";
import { toast } from "react-toastify";
import api from "../../controllers/api";
import { useEffect, useState } from "react";
import { Spinner } from "../../components/ui/Spinner";
import { AnimatePresence, motion } from "framer-motion";
import { useSidebarStore } from "../../stores/sidebarStore";
import { Field, FieldTypeOption, FieldOption, FieldPayload } from "../../types/contactTypes";
import { SidebarLayout } from "../../components/layouts/SidebarLayout";

const FIELD_TYPES = {
    TEXTO: 1,
    NUMERO: 2,
    FECHA: 3,
    BOOLEANO: 4,
    DROPDOWN: 5,
};

export function ContactFields() {
    const sidebarWidthPx = useSidebarStore((state) => state.sidebarWidthPx);

    const [editMode, setEditMode] = useState(false);
    const [loading, setLoading] = useState(false);
    const [contactFields, setContactFields] = useState<Field[]>([]);
    const [baseFields, setBaseFields] = useState<Field[]>([]);
    const [fieldTypeOptions, setFieldTypeOptions] = useState<FieldTypeOption[]>([]);
    const [expandedDropdowns, setExpandedDropdowns] = useState<Set<number>>(new Set());

    useEffect(() => {
        fetchFields();
        fetchFieldTypes();
    }, []);

    const fetchFields = async () => {
        try {
            const res = await api.get("/contacts/fields/");
            setContactFields(res.data.additional_fields);
            setBaseFields(res.data.base_fields);
        } catch (error) {
            console.error(error);
            toast.error("Error al cargar los campos de contacto");
        }
    };

    const fetchFieldTypes = async () => {
        try {
            const res = await api.get("/contacts/dropdown-opts/?tipos_campo=true");
            setFieldTypeOptions(res.data.tipos_campo);
        } catch (error) {
            console.error(error);
            toast.error("Error al cargar los tipos de campos");
        }
    };

    const handleSubmit = async () => {
        // Normalize names for comparison
        const fieldNames = contactFields.map(f => f.field_name.trim().toLowerCase());
        const baseFieldNames = baseFields.map(f => f.field_name.trim().toLowerCase());

        // Check for duplicates within custom fields
        const hasDuplicates = fieldNames.some((name, idx) => fieldNames.indexOf(name) !== idx);

        // Check for conflicts with base fields
        const hasBaseConflict = fieldNames.some(name => baseFieldNames.includes(name));

        if (hasDuplicates) {
            toast.error("No se pueden tener campos con el mismo nombre.");
            return;
        }
        if (hasBaseConflict) {
            toast.error("No se pueden crear campos con nombres que ya existen en los campos base.");
            return;
        }

        // Validate dropdown fields have options
        const invalidDropdowns = contactFields.filter(
            f => f.field_type === FIELD_TYPES.DROPDOWN && (!f.options || f.options.length === 0)
        );
        if (invalidDropdowns.length > 0) {
            toast.error("Los campos Dropdown deben tener al menos una opción.");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                contact_fields: contactFields.map(field => {
                    const fieldPayload: FieldPayload = {
                        field_name: field.field_name,
                        field_type: typeof field.field_type === "number" ? field.field_type : parseInt(field.field_type as string, 10),
                        required: field.required || false
                    };

                    // Add id only if field is being updated (has an existing id)
                    if (field.id && typeof field.id === 'number') {
                        fieldPayload.id = field.id;
                    }

                    // Add max_length for Texto and Número fields
                    if ([FIELD_TYPES.TEXTO, FIELD_TYPES.NUMERO].includes(fieldPayload.field_type) && field.max_length) {
                        fieldPayload.max_length = field.max_length;
                    }

                    // Add options for Dropdown fields
                    if (fieldPayload.field_type === FIELD_TYPES.DROPDOWN && field.options) {
                        fieldPayload.options = field.options.map(opt => ({
                            option_value: opt.option_value,
                            option_label: opt.option_label
                        }));
                    }

                    return fieldPayload;
                })
            };

            console.log("Sending payload:", payload);

            await api.put("/contacts/fields/", payload);

            toast.success("Campos de contacto actualizados correctamente");
            await fetchFields(); // Refresh fields after saving
        } catch (error) {
            console.error(error);
            toast.error("Error al actualizar los campos de contacto");
        } finally {
            setLoading(false);
            setEditMode(false);
        }
    };

    const handleCancel = () => {
        fetchFields(); // Reload the original fields from the server
        setEditMode(false);
    };

    const updateFieldName = (id: number, newName: string) => {
        setContactFields(prevFields =>
            prevFields.map(field => field.id === id ? { ...field, field_name: newName } : field)
        );
    };

    const updateFieldType = (id: number, typeId: number) => {
        const typeName = fieldTypeOptions.find(option => option.id === typeId)?.field_type_name || "";
        setContactFields(prevFields =>
            prevFields.map(field => {
                if (field.id === id) {
                    const updatedField = { ...field, field_type: typeId, field_type_name: typeName };
                    // Reset options and max_length when changing type
                    if (typeId !== FIELD_TYPES.DROPDOWN) {
                        updatedField.options = undefined;
                    }
                    if (![FIELD_TYPES.TEXTO, FIELD_TYPES.NUMERO].includes(typeId)) {
                        updatedField.max_length = undefined;
                    }
                    return updatedField;
                }
                return field;
            })
        );
    };

    const updateFieldMaxLength = (id: number, maxLength: number | undefined) => {
        setContactFields(prevFields =>
            prevFields.map(field => field.id === id ? { ...field, max_length: maxLength } : field)
        );
    };

    const toggleFieldRequired = (id: number) => {
        setContactFields(prevFields =>
            prevFields.map(field => field.id === id ? { ...field, required: !field.required } : field)
        );
    };

    const addDropdownOption = (fieldId: number) => {
        setContactFields(prevFields =>
            prevFields.map(field => {
                if (field.id === fieldId) {
                    return {
                        ...field,
                        options: [...(field.options || []), { option_value: "", option_label: "" }]
                    };
                }
                return field;
            })
        );
    };

    const updateDropdownOption = (fieldId: number, optionIndex: number, key: keyof FieldOption, value: string) => {
        setContactFields(prevFields =>
            prevFields.map(field => {
                if (field.id === fieldId && field.options) {
                    const updatedOptions = [...field.options];
                    updatedOptions[optionIndex] = { ...updatedOptions[optionIndex], [key]: value };
                    return { ...field, options: updatedOptions };
                }
                return field;
            })
        );
    };

    const removeDropdownOption = (fieldId: number, optionIndex: number) => {
        setContactFields(prevFields =>
            prevFields.map(field => {
                if (field.id === fieldId && field.options) {
                    return {
                        ...field,
                        options: field.options.filter((_, i) => i !== optionIndex)
                    };
                }
                return field;
            })
        );
    };

    const toggleDropdownExpanded = (id: number) => {
        setExpandedDropdowns(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const removeField = (id: number) => {
        setContactFields(prevFields => prevFields.filter(field => field.id !== id));
    };

    const addField = () => {
        const newField: Field = {
            id: Date.now(), // temp id
            field_name: "",
            field_type: FIELD_TYPES.TEXTO,
            field_type_name: "Texto"
        };
        setContactFields(prevFields => [...prevFields, newField]);
    };

    const getFieldTypeLabel = (typeId: number) => {
        const typeMap: Record<number, string> = {
            [FIELD_TYPES.TEXTO]: "Texto",
            [FIELD_TYPES.NUMERO]: "Número",
            [FIELD_TYPES.FECHA]: "Fecha",
            [FIELD_TYPES.BOOLEANO]: "Booleano",
            [FIELD_TYPES.DROPDOWN]: "Dropdown"
        };
        return typeMap[typeId] || "Texto";
    };

    const supportsMaxLength = (typeId: number) => {
        return [FIELD_TYPES.TEXTO, FIELD_TYPES.NUMERO].includes(typeId);
    };

    const isDropdownField = (typeId: number) => {
        return typeId === FIELD_TYPES.DROPDOWN;
    };

    return (
        <SidebarLayout sidebarWidthPx={sidebarWidthPx}>
            <h1 className="page-title">Administrar campos de contacto</h1>

            <div className="contact-fields-container">
                {/* Editable Fields */}
                <div className="contact-field-card card-body" style={{ flexDirection: "column", padding: "20px", alignItems: "flex-start", width: "50%" }}>
                    <h4 className="h4-header">Campos Personalizados</h4>
                    <p className="text-muted">Agrega, edita o elimina campos personalizados para los contactos.</p>

                    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <motion.button
                                type="button"
                                className={`btn ${editMode ? "btn-outline-danger" : "btn-outline-primary"}`}
                                onClick={() => {
                                    if (editMode) {
                                        handleCancel();
                                    } else {
                                        setEditMode(true);
                                    }
                                }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                {editMode ? "Cancelar" : "Editar"}
                            </motion.button>

                            <AnimatePresence>
                                {editMode && (
                                    <motion.button
                                        type="submit"
                                        className="btn btn-primary"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.3 }}
                                        key="save-button"
                                    >
                                        {loading ? <Spinner /> : "Guardar Cambios"}
                                    </motion.button>
                                )}
                            </AnimatePresence>
                        </div>

                        {contactFields.map((field) => (
                            <motion.div
                                key={field.id}
                                className="field-editor-section mb-4"
                                style={{ border: "1px solid #e0e0e0", padding: "15px", borderRadius: "8px" }}
                            >
                                <div className="d-flex align-items-center mb-3 gap-2">
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Nombre del campo"
                                        value={field.field_name}
                                        onChange={(e) => updateFieldName(field.id!, e.target.value)}
                                        disabled={!editMode}
                                    />
                                    <div style={{ width: "200px" }}>
                                        <Select
                                            options={fieldTypeOptions.map(option => ({
                                                value: option.id,
                                                label: option.field_type_name
                                            }))}
                                            value={{
                                                value: field.field_type,
                                                label: field.field_type_name || getFieldTypeLabel(field.field_type as number)
                                            }}
                                            onChange={(selectedOption) => {
                                                if (typeof selectedOption?.value !== "undefined") {
                                                    updateFieldType(field.id!, Number(selectedOption.value));
                                                }
                                            }}
                                            isDisabled={!editMode}
                                            menuPlacement="auto"
                                        />
                                    </div>
                                    {field.required && !editMode && (
                                        <motion.span
                                            className="badge rounded-pill bg-danger text-white px-2 py-1"
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                        >
                                            Requerido
                                        </motion.span>
                                    )}
                                    {editMode && (
                                        <motion.button
                                            type="button"
                                            className="btn btn-danger"
                                            onClick={() => removeField(field.id!)}
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                        >
                                            <i className="bi bi-trash"></i>
                                        </motion.button>
                                    )}
                                </div>

                                {/* Max Length Field */}
                                {supportsMaxLength(field.field_type as number) && editMode && (
                                    <motion.div
                                        className="mb-3"
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                    >
                                        <label className="form-label text-muted" style={{ fontSize: "0.9rem" }}>
                                            Máximo de caracteres (opcional)
                                        </label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            placeholder="Ej: 100"
                                            value={field.max_length || ""}
                                            onChange={(e) => updateFieldMaxLength(field.id!, e.target.value ? parseInt(e.target.value) : undefined)}
                                            disabled={!editMode}
                                        />
                                    </motion.div>
                                )}

                                {/* Required Field Toggle */}
                                {editMode && (
                                    <motion.div
                                        className="mb-3 d-flex align-items-center gap-2"
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                    >
                                        <input
                                            type="checkbox"
                                            className="form-check-input"
                                            id={`required-${field.id}`}
                                            checked={field.required || false}
                                            onChange={() => toggleFieldRequired(field.id!)}
                                        />
                                        <label className="form-check-label text-muted" style={{ fontSize: "0.9rem", marginBottom: 0 }} htmlFor={`required-${field.id}`}>
                                            Campo requerido
                                        </label>
                                    </motion.div>
                                )}

                                {/* Dropdown Options */}
                                {isDropdownField(field.field_type as number) && (
                                    <motion.div
                                        className="dropdown-options-section"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                    >
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-secondary mb-3"
                                            onClick={() => toggleDropdownExpanded(field.id!)}
                                        >
                                            <i className={`bi bi-chevron-${expandedDropdowns.has(field.id!) ? 'up' : 'down'}`}></i>
                                            {" "}Opciones de Dropdown ({field.options?.length || 0})
                                        </button>

                                        <AnimatePresence>
                                            {expandedDropdowns.has(field.id!) && (
                                                <motion.div
                                                    className="ms-3"
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: "auto" }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                >
                                                    {field.options && field.options.map((option, optIdx) => (
                                                        <div key={optIdx} className="d-flex gap-2 mb-2">
                                                            <input
                                                                type="text"
                                                                className="form-control"
                                                                placeholder="Valor (ej: tech)"
                                                                value={option.option_value}
                                                                onChange={(e) => updateDropdownOption(field.id!, optIdx, 'option_value', e.target.value)}
                                                                disabled={!editMode}
                                                            />
                                                            <input
                                                                type="text"
                                                                className="form-control"
                                                                placeholder="Etiqueta (ej: Tecnología)"
                                                                value={option.option_label}
                                                                onChange={(e) => updateDropdownOption(field.id!, optIdx, 'option_label', e.target.value)}
                                                                disabled={!editMode}
                                                            />
                                                            {editMode && (
                                                                <motion.button
                                                                    type="button"
                                                                    className="btn btn-sm btn-danger"
                                                                    onClick={() => removeDropdownOption(field.id!, optIdx)}
                                                                    whileHover={{ scale: 1.1 }}
                                                                    whileTap={{ scale: 0.9 }}
                                                                >
                                                                    <i className="bi bi-trash"></i>
                                                                </motion.button>
                                                            )}
                                                        </div>
                                                    ))}

                                                    {editMode && (
                                                        <motion.button
                                                            type="button"
                                                            className="btn btn-sm btn-success mt-2"
                                                            onClick={() => addDropdownOption(field.id!)}
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                        >
                                                            <i className="bi bi-plus-circle"></i> Agregar Opción
                                                        </motion.button>
                                                    )}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                )}
                            </motion.div>
                        ))}

                        <AnimatePresence>
                            {editMode && (
                                <motion.button
                                    type="button"
                                    className="btn btn-success mt-3"
                                    onClick={addField}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 20 }}
                                    transition={{ duration: 0.3 }}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    key="add-field-button"
                                >
                                    <i className="bi bi-plus-circle"></i> Agregar Campo
                                </motion.button>
                            )}
                        </AnimatePresence>

                    </form>
                </div>

                {/* Base Fields (Read-only) */}
                <div className="contact-field-card card-body" style={{ flexDirection: "column", padding: "20px", alignItems: "flex-start", width: "50%" }}>
                    <h4 className="h4-header mb-2">Campos Base</h4>
                    <p className="mb-2 text-muted">Estos son los campos predeterminados del sistema.</p>
                    <p className="mb-4 text-muted">Los campos base no se pueden editar ni eliminar.</p>

                    <div className="text-start" style={{ width: "100%" }}>
                        {/* Foreign Key Relations */}
                        <h6 className="text-uppercase text-muted mb-2">Relaciones</h6>
                        <ul className="list-unstyled mb-4" style={{ width: "100%" }}>
                            {baseFields.filter(field => field.field_type === "ForeignKey").map((field, index) => (
                                <li key={index} className="d-flex align-items-center mb-2" style={{ justifyContent: "space-between", width: "100%" }}>
                                    <i className="bi bi-link-45deg me-2" />
                                    <span className="flex-grow-1">{field.field_name}</span>
                                    <span className="badge rounded-pill bg-primary-light text-primary px-3 py-1">Relación Externa</span>
                                </li>
                            ))}
                        </ul>

                        {/* Text Fields */}
                        <h6 className="text-uppercase text-muted mb-2">Campos de texto</h6>
                        <ul className="list-unstyled mb-4" style={{ width: "100%" }}>
                            {baseFields.filter(field => field.field_type === "Texto").map((field, index) => (
                                <li key={index} className="d-flex align-items-center mb-2" style={{ justifyContent: "space-between", width: "100%" }}>
                                    <i className="bi bi-type me-2" />
                                    <span className="flex-grow-1">{field.field_name}</span>
                                    <span className="badge rounded-pill bg-success-light text-success px-3 py-1">Texto / Carácteres</span>
                                </li>
                            ))}
                        </ul>

                        {/* Date & Time Fields */}
                        <h6 className="text-uppercase text-muted mb-2">Campos de Fecha</h6>
                        <ul className="list-unstyled" style={{ width: "100%" }}>
                            {baseFields.filter(field => field.field_type === "Date" || field.field_type === "DateTime").map((field, index) => (
                                <li key={index} className="d-flex align-items-center mb-2" style={{ justifyContent: "space-between", width: "100%" }}>
                                    <i className="bi bi-calendar-event me-2" />
                                    <span className="flex-grow-1">{field.field_name}</span>
                                    <span className="badge rounded-pill bg-warning-light text-warning px-3 py-1">Fecha / Fecha y hora</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

            </div>
        </SidebarLayout>
    );
}
