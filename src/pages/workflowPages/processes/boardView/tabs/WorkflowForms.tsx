import { useEffect, useState } from "react";
import Select from "react-select";
import { toast } from "react-toastify";
import { AxiosError } from "axios";
import { motion } from "framer-motion";
import api from "../../../../../controllers/api";
import { Spinner } from "../../../../../components/ui/Spinner";
import { showResponseErrors } from "../../../../../utils/formatUtils";
import { FieldTypeOption } from "../../../../../types/contactTypes";
import { WorkflowForm, CampoFormulario } from "../../../../../types/workflowTypes";
import { WorkflowSettingsProps } from "../../../../../types/kanbanBoardTypes";

export function WorkflowForms({ process }: WorkflowSettingsProps) {
    const [forms, setForms] = useState<WorkflowForm[]>([]);
    const [fieldTypeOptions, setFieldTypeOptions] = useState<FieldTypeOption[]>([]);
    const [loading, setLoading] = useState(false);
    const [editingForm, setEditingForm] = useState<WorkflowForm | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        if (process?.id_proceso) {
            fetchForms();
            fetchFieldTypes();
        }
    }, [process]);

    const fetchForms = async () => {
        if (!process?.id_proceso) return;
        
        try {
            setLoading(true);
            const response = await api.get(`/workflows/procesos/${process.id_proceso}/formularios/`);
            setForms(response.data.forms || []);
        } catch (error) {
            console.error(error);
            toast.error("Error al cargar los formularios");
        } finally {
            setLoading(false);
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

    const handleCreateForm = () => {
        const newForm: WorkflowForm = {
            proceso: process.id_proceso,
            nombre_formulario: "",
            descripcion_formulario: "",
            campos: []
        };
        setEditingForm(newForm);
        setIsCreating(true);
    };

    const handleEditForm = (form: WorkflowForm) => {
        setEditingForm({ ...form });
        setIsCreating(false);
    };

    const handleSaveForm = async () => {
        if (!editingForm) return;

        // Validation
        if (!editingForm.nombre_formulario.trim()) {
            toast.error("El nombre del formulario es obligatorio.");
            return;
        }

        if (editingForm.campos.length === 0) {
            toast.error("Debes agregar al menos un campo.");
            return;
        }

        const payload = {
            nombre_formulario: editingForm.nombre_formulario,
            descripcion_formulario: editingForm.descripcion_formulario,
            campos: editingForm.campos.map(campo => ({
                ...(campo.id_campo_formulario && { id_campo_formulario: campo.id_campo_formulario }),
                nombre_campo: campo.nombre_campo,
                tipo_campo: typeof campo.tipo_campo === "number" ? campo.tipo_campo : parseInt(campo.tipo_campo as string, 10),
                requerido: campo.requerido
            }))
        };

        try {
            setLoading(true);
            
            if (isCreating) {
                await api.post(`/workflows/procesos/${process.id_proceso}/formularios/`, payload);
                toast.success("Formulario creado correctamente");
            } else {
                await api.put(`/workflows/procesos/${process.id_proceso}/formularios/${editingForm.id_formulario}/`, payload);
                toast.success("Formulario actualizado correctamente");
            }
            
            await fetchForms();
            setEditingForm(null);
            setIsCreating(false);
        } catch (error) {
            const axiosError = error as AxiosError;
            showResponseErrors(axiosError.response?.data);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setEditingForm(null);
        setIsCreating(false);
    };

    const addField = () => {
        if (!editingForm) return;
        
        const newField: CampoFormulario = {
            nombre_campo: "",
            tipo_campo: 1,
            field_type_name: "Texto",
            requerido: false
        };
        
        setEditingForm({
            ...editingForm,
            campos: [...editingForm.campos, newField]
        });
    };

    const updateField = (index: number, updates: Partial<CampoFormulario>) => {
        if (!editingForm) return;
        
        const updatedFields = editingForm.campos.map((field, i) => {
            if (i === index) {
                if (updates.tipo_campo) {
                    const typeName = fieldTypeOptions.find(option => option.id === updates.tipo_campo)?.field_type_name || "";
                    return { ...field, ...updates, field_type_name: typeName };
                }
                return { ...field, ...updates };
            }
            return field;
        });
        
        setEditingForm({
            ...editingForm,
            campos: updatedFields
        });
    };

    const removeField = (index: number) => {
        if (!editingForm) return;
        
        setEditingForm({
            ...editingForm,
            campos: editingForm.campos.filter((_, i) => i !== index)
        });
    };

    if (loading && forms.length === 0) {
        return (
            <div className="d-flex justify-content-center py-5">
                <Spinner />
            </div>
        );
    }

    return (
        <div style={{ padding: "24px", background: "#f8f9fa", minHeight: "calc(100vh - 200px)" }}>
            {editingForm ? (
                // Form Editor
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{
                        background: "white",
                        borderRadius: "12px",
                        padding: "32px",
                        boxShadow: "0 2px 12px rgba(0, 0, 0, 0.1)",
                        maxWidth: "800px",
                        margin: "0 auto"
                    }}
                >
                    {/* Header */}
                    <div style={{ 
                        display: "flex", 
                        justifyContent: "space-between", 
                        alignItems: "center", 
                        marginBottom: "32px",
                        paddingBottom: "16px",
                        borderBottom: "1px solid #e9ecef"
                    }}>
                        <h3 style={{ 
                            margin: 0, 
                            fontWeight: 600, 
                            color: "#212529",
                            fontSize: "24px"
                        }}>
                            {isCreating ? "Crear Nuevo Formulario" : "Editar Formulario"}
                        </h3>
                        
                        <div style={{ display: "flex", gap: "12px" }}>
                            <motion.button
                                type="button"
                                className="btn btn-outline-secondary"
                                onClick={handleCancel}
                                style={{ 
                                    borderRadius: "8px",
                                    padding: "8px 16px",
                                    fontWeight: 500
                                }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                Cancelar
                            </motion.button>
                            <motion.button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleSaveForm}
                                disabled={loading}
                                style={{
                                    borderRadius: "8px",
                                    padding: "8px 16px",
                                    fontWeight: 500,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px"
                                }}
                                whileHover={{ scale: loading ? 1 : 1.02 }}
                                whileTap={{ scale: loading ? 1 : 0.98 }}
                            >
                                {loading && <Spinner />}
                                Guardar Formulario
                            </motion.button>
                        </div>
                    </div>

                    {/* Form Fields */}
                    <div style={{ marginBottom: "32px" }}>
                        <div>
                            <div>
                                <label className="form-label" style={{ fontWeight: 600, marginBottom: "8px" }}>
                                    Nombre del Formulario
                                </label>
                                <input
                                    type="text"
                                    value={editingForm.nombre_formulario}
                                    onChange={(e) => setEditingForm({
                                        ...editingForm,
                                        nombre_formulario: e.target.value
                                    })}
                                    className="form-control"
                                    placeholder="Ej: Información del Cliente"
                                    style={{ 
                                        borderRadius: "8px",
                                        border: "1px solid #ced4da",
                                        padding: "12px"
                                    }}
                                />
                            </div>
                            <div style={{ marginTop: "16px" }}>
                                <label className="form-label" style={{ fontWeight: 600, marginBottom: "8px" }}>
                                    Descripción del Formulario
                                </label>
                                <textarea
                                    value={editingForm.descripcion_formulario}
                                    onChange={(e) => setEditingForm({
                                        ...editingForm,
                                        descripcion_formulario: e.target.value
                                    })}
                                    className="form-control"
                                    rows={3}
                                    placeholder="Describe el propósito de este formulario"
                                    style={{ 
                                        borderRadius: "8px",
                                        border: "1px solid #ced4da",
                                        padding: "12px",
                                        resize: "vertical"
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Fields Section */}
                    <div>
                        <div style={{ 
                            display: "flex", 
                            justifyContent: "space-between", 
                            alignItems: "center", 
                            marginBottom: "20px" 
                        }}>
                            <h5 style={{ margin: 0, fontWeight: 600, color: "#495057" }}>
                                Campos del Formulario
                            </h5>
                            <motion.button
                                type="button"
                                className="btn btn-success"
                                onClick={addField}
                                style={{
                                    borderRadius: "8px",
                                    padding: "8px 16px",
                                    fontWeight: 500,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px"
                                }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <i className="bi bi-plus-circle"></i>
                                Agregar Campo
                            </motion.button>
                        </div>
                        
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            {editingForm.campos.map((field, index) => (
                                <motion.div 
                                    key={index}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.2, delay: index * 0.05 }}
                                    style={{
                                        background: "#f8f9fa",
                                        border: "1px solid #e9ecef",
                                        borderRadius: "8px",
                                        padding: "20px"
                                    }}
                                >
                                    <div className="row align-items-center">
                                        <div className="col-md-4">
                                            <label className="form-label" style={{ fontSize: "0.875rem", fontWeight: 500 }}>
                                                Nombre del Campo
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={field.nombre_campo}
                                                onChange={(e) => updateField(index, { nombre_campo: e.target.value })}
                                                placeholder="Nombre del campo"
                                                style={{ borderRadius: "6px", fontSize: "0.875rem" }}
                                            />
                                        </div>
                                        
                                        <div className="col-md-3">
                                            <label className="form-label" style={{ fontSize: "0.875rem", fontWeight: 500 }}>
                                                Tipo de Campo
                                            </label>
                                            <Select
                                                options={fieldTypeOptions.map(option => ({
                                                    value: option.id,
                                                    label: option.field_type_name
                                                }))}
                                                value={{
                                                    value: field.tipo_campo,
                                                    label: field.field_type_name || "Texto"
                                                }}
                                                onChange={(selectedOption) => {
                                                    if (typeof selectedOption?.value !== "undefined") {
                                                        updateField(index, { tipo_campo: Number(selectedOption.value) });
                                                    }
                                                }}
                                                styles={{
                                                    control: (base) => ({
                                                        ...base,
                                                        borderRadius: "6px",
                                                        fontSize: "0.875rem",
                                                        minHeight: "38px"
                                                    })
                                                }}
                                                menuPlacement="auto"
                                            />
                                        </div>

                                        <div className="col-md-3">
                                            <label className="form-label" style={{ fontSize: "0.875rem", fontWeight: 500 }}>
                                                Opciones
                                            </label>
                                            <div className="form-check" style={{ padding: "8px 0", display: "flex", gap: "5px" }}>
                                                <input
                                                    className="form-check-input"
                                                    style={{ marginLeft: "unset"}}
                                                    type="checkbox"
                                                    checked={field.requerido}
                                                    onChange={(e) => updateField(index, { requerido: e.target.checked })}
                                                    id={`required-${index}`}
                                                />
                                                <label className="form-check-label" htmlFor={`required-${index}`} style={{ fontSize: "0.875rem" }}>
                                                    Campo requerido
                                                </label>
                                            </div>
                                        </div>

                                        <div className="col-md-2 text-end">
                                            <motion.button
                                                type="button"
                                                className="btn btn-outline-danger btn-sm"
                                                onClick={() => removeField(index)}
                                                style={{ borderRadius: "6px" }}
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                            >
                                                <i className="bi bi-trash"></i>
                                            </motion.button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {editingForm.campos.length === 0 && (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                style={{
                                    textAlign: "center",
                                    padding: "40px",
                                    color: "#6c757d",
                                    background: "#f8f9fa",
                                    borderRadius: "8px",
                                    border: "2px dashed #dee2e6"
                                }}
                            >
                                <i className="bi bi-plus-circle" style={{ fontSize: "2rem", marginBottom: "16px" }}></i>
                                <p style={{ margin: 0, fontSize: "0.875rem" }}>
                                    No hay campos agregados. Haz clic en "Agregar Campo" para comenzar.
                                </p>
                            </motion.div>
                        )}
                    </div>
                </motion.div>
            ) : (
                // Forms List
                <div>
                    {/* Header */}
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        style={{
                            background: "white",
                            borderRadius: "12px",
                            padding: "24px",
                            marginBottom: "24px",
                            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center"
                        }}
                    >
                        <div>
                            <h3 style={{ 
                                margin: 0, 
                                marginBottom: "8px",
                                fontWeight: 600, 
                                color: "#212529",
                                fontSize: "24px"
                            }}>
                                Formularios del Proceso
                            </h3>
                            <p style={{ 
                                margin: 0, 
                                color: "#6c757d",
                                fontSize: "0.875rem"
                            }}>
                                Administra los formularios personalizados para este flujo de trabajo.
                            </p>
                        </div>
                        
                        <motion.button
                            type="button"
                            className="btn btn-primary"
                            onClick={handleCreateForm}
                            style={{
                                borderRadius: "8px",
                                padding: "12px 20px",
                                fontWeight: 500,
                                display: "flex",
                                alignItems: "center",
                                gap: "8px"
                            }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <i className="bi bi-plus-circle"></i>
                            Crear Formulario
                        </motion.button>
                    </motion.div>

                    {/* Forms Grid */}
                    {forms.length === 0 ? (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            style={{
                                background: "white",
                                borderRadius: "12px",
                                padding: "60px 40px",
                                textAlign: "center",
                                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)"
                            }}
                        >
                            <i className="bi bi-file-earmark-text" style={{ 
                                fontSize: "4rem", 
                                color: "#dee2e6",
                                marginBottom: "24px"
                            }}></i>
                            <h4 style={{ 
                                color: "#495057",
                                marginBottom: "12px",
                                fontWeight: 600
                            }}>
                                No hay formularios creados
                            </h4>
                            <p style={{ 
                                color: "#6c757d",
                                marginBottom: "0",
                                fontSize: "0.875rem"
                            }}>
                                Crea tu primer formulario personalizado para este proceso.
                            </p>
                        </motion.div>
                    ) : (
                        <div className="row g-4">
                            {forms.map((form, index) => (
                                <motion.div 
                                    key={form.id_formulario} 
                                    className="col-lg-4 col-md-6"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: index * 0.1 }}
                                >
                                    <motion.div 
                                        className="card h-100" 
                                        style={{
                                            borderRadius: "12px",
                                            border: "1px solid #e9ecef",
                                            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
                                            cursor: "pointer"
                                        }}
                                        whileHover={{ 
                                            y: -4,
                                            boxShadow: "0 8px 25px rgba(0, 0, 0, 0.15)"
                                        }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <div className="card-body" style={{ 
                                            padding: "24px",
                                            display: "flex",
                                            flexDirection: "column",
                                            boxShadow: "unset",
                                            height: "100%"
                                        }}>
                                            {/* Header with form name */}
                                            <div style={{ marginBottom: "16px" }}>
                                                <h5 style={{
                                                    fontWeight: 600,
                                                    color: "#212529",
                                                    marginBottom: "8px",
                                                    fontSize: "1.25rem",
                                                    lineHeight: "1.3"
                                                }}>
                                                    {form.nombre_formulario}
                                                </h5>
                                                
                                                {/* Field count badge */}
                                                <div style={{
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    gap: "6px",
                                                    background: "#e3f2fd",
                                                    color: "#1976d2",
                                                    padding: "4px 10px",
                                                    borderRadius: "12px",
                                                    fontSize: "0.75rem",
                                                    fontWeight: 600
                                                }}>
                                                    <i className="bi bi-list-ul"></i>
                                                    {form.campos.length} campo{form.campos.length !== 1 ? 's' : ''}
                                                </div>
                                            </div>

                                            {/* Description */}
                                            <p style={{
                                                color: "#6c757d",
                                                fontSize: "0.875rem",
                                                marginBottom: "20px",
                                                lineHeight: "1.5",
                                                flex: 1,
                                                display: "-webkit-box",
                                                WebkitLineClamp: 3,
                                                WebkitBoxOrient: "vertical",
                                                overflow: "hidden"
                                            }}>
                                                {form.descripcion_formulario || "Sin descripción proporcionada para este formulario."}
                                            </p>
                                            
                                            {/* Edit button */}
                                            <motion.button
                                                className="btn btn-outline-primary"
                                                onClick={() => handleEditForm(form)}
                                                style={{
                                                    borderRadius: "8px",
                                                    padding: "10px 16px",
                                                    fontSize: "0.875rem",
                                                    fontWeight: 500,
                                                    width: "100%",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    gap: "8px",
                                                    marginTop: "auto"
                                                }}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                <i className="bi bi-pencil"></i>
                                                Editar Formulario
                                            </motion.button>
                                        </div>
                                    </motion.div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}