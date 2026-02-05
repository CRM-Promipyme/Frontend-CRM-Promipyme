import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { AxiosError } from "axios";
import { Spinner } from "../../../components/ui/Spinner";
import { fetchWorkflowForms } from "../../../controllers/workflowControllers";
import { createCaseForm } from "../../../controllers/caseControllers";

interface FormField {
    id_campo_formulario: number;
    nombre_campo: string;
    tipo_campo: number;
    field_type_name: string;
    requerido: boolean;
}

interface WorkflowForm {
    id_formulario: number;
    proceso: number;
    nombre_formulario: string;
    descripcion_formulario: string;
    fecha_creacion: string;
    ultima_actualizacion: string;
    campos: FormField[];
}

interface CreateCaseFormProps {
    caseId: number;
    workflowId?: number;
    caseName: string;
    processName: string;
    completedFormIds: number[];
    onBack: () => void;
    onFormCreated: () => void;
}

interface FormValues {
    [fieldId: number]: string;
}

export function CreateCaseForm({ 
    caseId, 
    workflowId,
    caseName, 
    processName, 
    completedFormIds, 
    onBack, 
    onFormCreated 
}: CreateCaseFormProps) {
    const [availableForms, setAvailableForms] = useState<WorkflowForm[]>([]);
    const [selectedForm, setSelectedForm] = useState<WorkflowForm | null>(null);
    const [formValues, setFormValues] = useState<FormValues>({});
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchAvailableForms();
    }, []);

    const fetchAvailableForms = async () => {
        try {
            setLoading(true);
            if (!workflowId) {
                toast.error("ID del flujo de trabajo no disponible");
                return;
            }
            const response = await fetchWorkflowForms(workflowId);
            
            // Filter out completed forms and store only the available ones
            const filteredForms = response.filter((form: WorkflowForm) =>
                !completedFormIds.includes(form.id_formulario)
            );
            
            setAvailableForms(filteredForms);
        } catch (error) {
            console.error(error);
            toast.error("Error al cargar los formularios disponibles");
        } finally {
            setLoading(false);
        }
    };

    const handleFormSelect = (form: WorkflowForm) => {
        setSelectedForm(form);
        // Initialize form values with empty strings
        const initialValues: FormValues = {};
        form.campos.forEach(field => {
            initialValues[field.id_campo_formulario] = '';
        });
        setFormValues(initialValues);
    };

    const handleInputChange = (fieldId: number, value: string) => {
        setFormValues(prev => ({
            ...prev,
            [fieldId]: value
        }));
    };

    const validateForm = () => {
        if (!selectedForm) return false;
        
        for (const field of selectedForm.campos) {
            if (field.requerido && !formValues[field.id_campo_formulario]?.trim()) {
                toast.error(`El campo "${field.nombre_campo}" es requerido`);
                return false;
            }
        }
        return true;
    };

    const convertFieldValue = (value: string, fieldType: string) => {
        if (!value.trim()) return null;
        
        switch (fieldType.toLowerCase()) {
            case 'booleano':
                return value === 'true';
            case 'numero':
                const numValue = parseFloat(value);
                return isNaN(numValue) ? null : numValue;
            case 'fecha':
                return value; // Keep as string in ISO format
            case 'email':
            case 'telefono':
            case 'texto':
            case 'textarea':
            default:
                return value;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!selectedForm || !validateForm()) return;

        try {
            setSubmitting(true);
            
            // Prepare form data with correct payload structure
            const formData = {
                formulario_id: selectedForm.id_formulario,
                valores_campos: Object.entries(formValues)
                    .filter(([_, value]) => value.trim() !== '') // Only include non-empty values
                    .map(([fieldId, value]) => {
                        const field = selectedForm.campos.find(f => f.id_campo_formulario === parseInt(fieldId));
                        const convertedValue = convertFieldValue(value, field?.field_type_name || 'texto');
                        
                        return {
                            campo_formulario_id: parseInt(fieldId),
                            valor_campo: convertedValue
                        };
                    })
            };

            console.log("Submitting form data:", formData);
            const response = await createCaseForm(caseId, formData);
            console.log("Form creation response:", response);
            
            // Show success message with form details
            if (response.form_data) {
                toast.success(
                    `${response.message || 'Formulario completado exitosamente'} - ${response.form_data.valores_count} campo${response.form_data.valores_count !== 1 ? 's' : ''} guardado${response.form_data.valores_count !== 1 ? 's' : ''}`
                );
            } else {
                toast.success(response.message || "Formulario creado exitosamente");
            }
            
            onFormCreated();
            
        } catch (error) {
            console.error("Error creating form:", error);
            const axiosError = error as AxiosError;
            
            // More specific error handling
            if (axiosError.response?.data) {
                const errorData = axiosError.response.data as any;
                toast.error(`Error: ${errorData.message}`);
            } else if (axiosError.message) {
                toast.error(`Error al crear el formulario: ${axiosError.message}`);
            } else {
                toast.error("Error al crear el formulario");
            }
        } finally {
            setSubmitting(false);
        }
    };

    const getFieldTypeIcon = (fieldType: string) => {
        switch (fieldType.toLowerCase()) {
            case 'texto':
                return 'bi-type';
            case 'numero':
                return 'bi-123';
            case 'email':
                return 'bi-envelope';
            case 'telefono':
                return 'bi-telephone';
            case 'fecha':
                return 'bi-calendar';
            case 'booleano':
                return 'bi-toggle-on';
            case 'textarea':
                return 'bi-text-paragraph';
            default:
                return 'bi-input-cursor-text';
        }
    };

    const renderFormField = (field: FormField) => {
        const value = formValues[field.id_campo_formulario] || '';
        
        switch (field.field_type_name.toLowerCase()) {
            case 'booleano':
                return (
                    <select
                        className="form-control"
                        value={value}
                        onChange={(e) => handleInputChange(field.id_campo_formulario, e.target.value)}
                        required={field.requerido}
                    >
                        <option value="">Seleccionar...</option>
                        <option value="true">Sí</option>
                        <option value="false">No</option>
                    </select>
                );
            case 'numero':
                return (
                    <input
                        type="number"
                        className="form-control"
                        value={value}
                        onChange={(e) => handleInputChange(field.id_campo_formulario, e.target.value)}
                        required={field.requerido}
                    />
                );
            case 'email':
                return (
                    <input
                        type="email"
                        className="form-control"
                        value={value}
                        onChange={(e) => handleInputChange(field.id_campo_formulario, e.target.value)}
                        required={field.requerido}
                    />
                );
            case 'fecha':
                return (
                    <input
                        type="date"
                        className="form-control"
                        value={value}
                        onChange={(e) => handleInputChange(field.id_campo_formulario, e.target.value)}
                        required={field.requerido}
                    />
                );
            case 'textarea':
                return (
                    <textarea
                        className="form-control"
                        rows={3}
                        value={value}
                        onChange={(e) => handleInputChange(field.id_campo_formulario, e.target.value)}
                        required={field.requerido}
                    />
                );
            default:
                return (
                    <input
                        type="text"
                        className="form-control"
                        value={value}
                        onChange={(e) => handleInputChange(field.id_campo_formulario, e.target.value)}
                        required={field.requerido}
                    />
                );
        }
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center py-5">
                <Spinner />
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="p-4"
            style={{
                background: "#fff",
                borderRadius: "12px",
                marginTop: "2rem"
            }}
        >
            {/* Header */}
            <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "2rem",
                paddingBottom: "1rem",
                borderBottom: "1px solid #e9ecef"
            }}>
                <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                        <motion.button
                            className="btn btn-outline-secondary btn-sm"
                            onClick={onBack}
                            style={{
                                borderRadius: "8px",
                                padding: "6px 12px",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px"
                            }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <i className="bi bi-arrow-left"></i>
                            Volver
                        </motion.button>
                        <div style={{
                            background: "#fff3cd",
                            color: "#856404",
                            padding: "4px 10px",
                            borderRadius: "8px",
                            fontSize: "0.75rem",
                            fontWeight: 600
                        }}>
                            <i className="bi bi-plus-circle me-1"></i>
                            Crear Formulario
                        </div>
                    </div>
                    
                    <h4 style={{
                        margin: 0,
                        fontWeight: 600,
                        color: "#212529",
                        marginBottom: "6px"
                    }}>
                        {selectedForm ? selectedForm.nombre_formulario : "Seleccionar Formulario"}
                    </h4>
                    
                    <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "0.875rem", color: "#6c757d" }}>
                        <span>
                            <i className="bi bi-file-text me-1"></i>
                            Caso: {caseName}
                        </span>
                        <span>
                            <i className="bi bi-diagram-3 me-1"></i>
                            Proceso: {processName}
                        </span>
                    </div>
                </div>
            </div>

            {/* Form Selection */}
            {!selectedForm ? (
                <div>
                    <h5 style={{ marginBottom: "1.5rem", fontWeight: 600 }}>
                        Formularios Disponibles
                    </h5>
                    
                    {availableForms.length === 0 ? (
                        <div style={{
                            textAlign: "center",
                            padding: "3rem 1rem",
                            color: "#6c757d"
                        }}>
                            <i className="bi bi-file-earmark-check" style={{ fontSize: "3rem", marginBottom: "1rem" }}></i>
                            <p>Todos los formularios ya han sido completados para este caso.</p>
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            {availableForms.map((form, index) => (
                                <motion.div
                                    key={form.id_formulario}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.2, delay: index * 0.05 }}
                                    style={{
                                        background: "#f8f9fa",
                                        border: "1px solid #e9ecef",
                                        borderRadius: "8px",
                                        padding: "20px",
                                        cursor: "pointer",
                                        transition: "all 0.2s ease"
                                    }}
                                    whileHover={{ 
                                        backgroundColor: "#f1f3f4",
                                        scale: 1.01
                                    }}
                                    onClick={() => handleFormSelect(form)}
                                >
                                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                                        <div style={{
                                            background: "#fff3cd",
                                            borderRadius: "8px",
                                            width: "40px",
                                            height: "40px",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center"
                                        }}>
                                            <i className="bi bi-file-earmark-text" style={{ 
                                                color: "#856404",
                                                fontSize: "18px"
                                            }}></i>
                                        </div>
                                        
                                        <div style={{ flex: 1 }}>
                                            <h6 style={{
                                                fontWeight: 600,
                                                color: "#212529",
                                                margin: 0,
                                                marginBottom: "4px"
                                            }}>
                                                {form.nombre_formulario}
                                            </h6>
                                            <p style={{
                                                color: "#6c757d",
                                                margin: 0,
                                                fontSize: "0.875rem",
                                                marginBottom: "8px"
                                            }}>
                                                {form.descripcion_formulario || "Sin descripción"}
                                            </p>
                                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                <span style={{
                                                    background: "#e9ecef",
                                                    color: "#495057",
                                                    padding: "2px 8px",
                                                    borderRadius: "4px",
                                                    fontSize: "0.75rem",
                                                    fontWeight: 500
                                                }}>
                                                    {form.campos?.length || 0} campo{(form.campos?.length || 0) !== 1 ? 's' : ''}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <i className="bi bi-chevron-right" style={{ color: "#6c757d" }}></i>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                /* Form Fields */
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: "2rem" }}>
                        <h5 style={{ marginBottom: "1rem", fontWeight: 600 }}>
                            Completar Formulario
                        </h5>
                        <p style={{ color: "#6c757d", marginBottom: "1.5rem" }}>
                            {selectedForm.descripcion_formulario || "Complete todos los campos requeridos."}
                        </p>
                        
                        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                            {selectedForm.campos?.map((field, index) => (
                                <motion.div
                                    key={field.id_campo_formulario}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2, delay: index * 0.05 }}
                                    style={{
                                        background: "#f8f9fa",
                                        border: "1px solid #e9ecef",
                                        borderRadius: "8px",
                                        padding: "20px"
                                    }}
                                >
                                    <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
                                        <div style={{
                                            background: "#e3f2fd",
                                            borderRadius: "8px",
                                            width: "40px",
                                            height: "40px",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            flexShrink: 0
                                        }}>
                                            <i className={`bi ${getFieldTypeIcon(field.field_type_name)}`} style={{
                                                color: "#1976d2",
                                                fontSize: "18px"
                                            }}></i>
                                        </div>
                                        
                                        <div style={{ flex: 1 }}>
                                            <div style={{ marginBottom: "12px" }}>
                                                <label style={{
                                                    fontWeight: 600,
                                                    color: "#212529",
                                                    fontSize: "1rem",
                                                    marginBottom: "8px",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "8px"
                                                }}>
                                                    {field.nombre_campo}
                                                    {field.requerido && (
                                                        <span style={{
                                                            background: "#fff3cd",
                                                            color: "#856404",
                                                            padding: "2px 6px",
                                                            borderRadius: "4px",
                                                            fontSize: "0.75rem",
                                                            fontWeight: 600
                                                        }}>
                                                            <i className="bi bi-exclamation-triangle me-1"></i>
                                                            Requerido
                                                        </span>
                                                    )}
                                                    <span style={{
                                                        background: "#e9ecef",
                                                        color: "#495057",
                                                        padding: "2px 6px",
                                                        borderRadius: "4px",
                                                        fontSize: "0.75rem",
                                                        fontWeight: 500
                                                    }}>
                                                        {field.field_type_name}
                                                    </span>
                                                </label>
                                            </div>
                                            
                                            {renderFormField(field)}
                                        </div>
                                    </div>
                                </motion.div>
                            )) || []}
                        </div>
                    </div>
                    
                    {/* Submit Buttons */}
                    <div style={{
                        display: "flex",
                        gap: "12px",
                        justifyContent: "flex-end",
                        paddingTop: "1rem",
                        borderTop: "1px solid #e9ecef"
                    }}>
                        <motion.button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => setSelectedForm(null)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            disabled={submitting}
                        >
                            Cambiar Formulario
                        </motion.button>
                        
                        <motion.button
                            type="submit"
                            className="btn btn-primary"
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px"
                            }}
                            whileHover={{ scale: submitting ? 1 : 1.02 }}
                            whileTap={{ scale: submitting ? 1 : 0.98 }}
                            disabled={submitting}
                        >
                            {submitting ? (
                                <>
                                    <Spinner className="spinner-border-sm" />
                                    Creando...
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-check-circle"></i>
                                    Crear Formulario
                                </>
                            )}
                        </motion.button>
                    </div>
                </form>
            )}
        </motion.div>
    );
}