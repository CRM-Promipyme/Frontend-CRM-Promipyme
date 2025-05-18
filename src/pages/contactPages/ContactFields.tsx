import Select from "react-select";
import { toast } from "react-toastify";
import api from "../../controllers/api";
import { useEffect, useState } from "react";
import { Spinner } from "../../components/ui/Spinner";
import { AnimatePresence, motion } from "framer-motion";
import { useSidebarStore } from "../../stores/sidebarStore";
import { Field, FieldTypeOption } from "../../types/contactTypes";
import { SidebarLayout } from "../../components/layouts/SidebarLayout";

export function ContactFields() {
    const sidebarWidthPx = useSidebarStore((state) => state.sidebarWidthPx);

    const [editMode, setEditMode] = useState(false);
    const [loading, setLoading] = useState(false);
    const [contactFields, setContactFields] = useState<Field[]>([]);
    const [baseFields, setBaseFields] = useState<Field[]>([]);
    const [fieldTypeOptions, setFieldTypeOptions] = useState<FieldTypeOption[]>([]);

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
    
        setLoading(true);
        try {
            const payload = {
                contact_fields: contactFields.map(field => ({
                    id: field.id ? field.id : '',
                    field_name: field.field_name,
                    field_type: typeof field.field_type === "number" ? field.field_type : parseInt(field.field_type as string, 10)
                }))
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
            prevFields.map(field => field.id === id ? { ...field, field_type: typeId, field_type_name: typeName } : field)
        );
    };

    const removeField = (id: number) => {
        setContactFields(prevFields => prevFields.filter(field => field.id !== id));
    };

    const addField = () => {
        const newField = {
            id: Date.now(), // temp id
            field_name: "",
            field_type: 1,
            field_type_name: "Texto"
        };
        setContactFields(prevFields => [...prevFields, newField]);
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
                            <div key={field.id} className="d-flex align-items-center mb-3">
                                <input
                                    type="text"
                                    className="form-control me-2"
                                    value={field.field_name}
                                    onChange={(e) => updateFieldName(field.id!, e.target.value)}
                                    disabled={!editMode}
                                />
                                <div className="me-2" style={{ width: "200px" }}>
                                    <Select
                                        options={fieldTypeOptions.map(option => ({
                                            value: option.id,
                                            label: option.field_type_name
                                        }))}
                                        value={{
                                            value: field.field_type,
                                            label: field.field_type_name
                                        }}
                                        onChange={(selectedOption) =>
                                            updateFieldType(field.id!, selectedOption?.value)
                                        }
                                        isDisabled={!editMode}
                                        menuPlacement="auto"
                                    />
                                </div>
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
