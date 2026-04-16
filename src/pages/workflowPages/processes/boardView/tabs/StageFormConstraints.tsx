import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import api from "../../../../../controllers/api";
import { motion, AnimatePresence } from "framer-motion";
import { Spinner } from "../../../../../components/ui/Spinner";
import Select from "react-select";
import { AnimatedSelectMenu } from "../../../../../components/ui/forms/AnimatedSelectMenu";

interface Requirement {
    id_requirement: number;
    etapa: number;
    formulario: number;
    etapa_nombre: string;
    formulario_nombre: string;
}

interface Stage {
    id_etapa: number;
    nombre_etapa: string;
}

interface Form {
    id_formulario: number;
    nombre_formulario: string;
}

interface StageFormConstraintsProps {
    process: any; // Proceso type with id_proceso and etapas
}

export function StageFormConstraints({ process }: StageFormConstraintsProps) {
    const processId = process.id_proceso;
    const [requirements, setRequirements] = useState<Requirement[]>([]);
    const [stages, setStages] = useState<Stage[]>(process?.etapas || []);
    const [forms, setForms] = useState<Form[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [selectedStage, setSelectedStage] = useState<Stage | null>(null);
    const [selectedForm, setSelectedForm] = useState<Form | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [requirementToDelete, setRequirementToDelete] = useState<Requirement | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (!process || !processId) return;
        loadData();
    }, [processId, process]);

    const loadData = async () => {
        try {
            setLoading(true);
            await Promise.all([
                loadStages(),
                loadForms(),
                loadRequirements()
            ]);
        } catch (error) {
            console.error("Error loading constraint data:", error);
            toast.error("Error al cargar los datos de restricciones");
        } finally {
            setLoading(false);
        }
    };

    const loadStages = async () => {
        try {
            // Use stages from the process object that's already been fetched
            if (process && process.etapas && Array.isArray(process.etapas)) {
                console.log("Loading stages from process object:", process.etapas);
                setStages(process.etapas);
            } else {
                console.warn("No etapas found in process object", process);
                setStages([]);
            }
        } catch (error) {
            console.error("Error loading stages:", error);
            setStages([]);
        }
    };

    const loadForms = async () => {
        try {
            const response = await api.get(`/workflows/procesos/${processId}/formularios/`);
            if (response.data) {
                const formsArray = response.data.forms || response.data;
                if (Array.isArray(formsArray)) {
                    setForms(formsArray);
                } else {
                    console.warn("Forms response is not an array:", formsArray);
                    setForms([]);
                }
            }
        } catch (error) {
            console.error("Error loading forms:", error);
            setForms([]);
        }
    };

    const loadRequirements = async () => {
        try {
            const requirementsData: Requirement[] = [];
            if (stages.length > 0) {
                for (const stage of stages) {
                    try {
                        const response = await api.get(
                            `/workflows/procesos/${processId}/stages/${stage.id_etapa}/requirements/`
                        );
                        if (response.data && Array.isArray(response.data)) {
                            requirementsData.push(...response.data);
                        }
                    } catch (error) {
                        // Stage might not have requirements
                    }
                }
            }
            setRequirements(requirementsData);
        } catch (error) {
            console.error("Error loading requirements:", error);
        }
    };

    const handleCreateRequirement = async () => {
        if (!selectedStage || !selectedForm) {
            toast.warning("Por favor selecciona una etapa y un formulario");
            return;
        }

        try {
            setCreating(true);
            const response = await api.post(
                `/workflows/procesos/${processId}/stages/${selectedStage.id_etapa}/requirements/manage/`,
                { formulario_id: selectedForm.id_formulario }
            );

            if (response.data) {
                toast.success("Restricción creada exitosamente");
                setSelectedStage(null);
                setSelectedForm(null);
                await loadRequirements();
            }
        } catch (error: any) {
            console.error("Error creating requirement:", error);
            if (error.response?.data?.message) {
                toast.error(error.response.data.message);
            } else if (error.response?.data?.errors) {
                const errorMessages = Object.values(error.response.data.errors).flat().join(", ");
                toast.error(errorMessages);
            } else {
                toast.error("Error al crear la restricción");
            }
        } finally {
            setCreating(false);
        }
    };

    const handleDeleteClick = (requirement: Requirement) => {
        setRequirementToDelete(requirement);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!requirementToDelete) return;

        try {
            setDeleting(true);
            await api.delete(
                `/workflows/procesos/${processId}/stages/${requirementToDelete.etapa}/requirements/manage/${requirementToDelete.id_requirement}/`
            );

            toast.success("Restricción eliminada exitosamente");
            setShowDeleteModal(false);
            setRequirementToDelete(null);
            await loadRequirements();
        } catch (error: any) {
            console.error("Error deleting requirement:", error);
            if (error.response?.data?.message) {
                toast.error(error.response.data.message);
            } else {
                toast.error("Error al eliminar la restricción");
            }
        } finally {
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "400px" }}>
                <Spinner />
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={{ maxWidth: "1200px", margin: "0 auto" }}
        >
            {/* Add New Constraint Section */}
            <div style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                borderRadius: "12px",
                padding: "28px",
                marginBottom: "32px",
                color: "white"
            }}>
                <div style={{ marginBottom: "20px" }}>
                    <h5 style={{ margin: 0, fontSize: "18px", fontWeight: 600 }}>
                        <i className="bi bi-plus-circle me-2"></i>
                        Agregar Nueva Restricción
                    </h5>
                    <p style={{ margin: "6px 0 0 0", fontSize: "13px", opacity: 0.9 }}>
                        Define qué formularios deben completarse antes de que un caso pueda pasar a una nueva etapa
                    </p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "14px", alignItems: "flex-end" }}>
                    <div>
                        <label style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", opacity: 0.95 }}>
                            Etapa
                        </label>
                        <Select
                            options={stages || []}
                            value={selectedStage}
                            onChange={(option) => setSelectedStage(option as Stage | null)}
                            getOptionLabel={(option: Stage) => option.nombre_etapa}
                            getOptionValue={(option: Stage) => String(option.id_etapa)}
                            placeholder="Seleccionar etapa..."
                            isClearable
                            components={{ Menu: AnimatedSelectMenu }}
                            menuPortalTarget={document.body}
                            styles={{
                                control: (base) => ({
                                    ...base,
                                    backgroundColor: "rgba(255,255,255,0.95)",
                                    borderColor: "rgba(255,255,255,0.3)",
                                    borderRadius: "8px",
                                    boxShadow: "none",
                                    color: "#333"
                                }),
                                menuPortal: base => ({ ...base, zIndex: 9999 })
                            }}
                        />
                    </div>
                    <div>
                        <label style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", opacity: 0.95 }}>
                            Formulario Requerido
                        </label>
                        <Select
                            options={forms || []}
                            value={selectedForm}
                            onChange={(option) => setSelectedForm(option as Form | null)}
                            getOptionLabel={(option: Form) => option.nombre_formulario}
                            getOptionValue={(option: Form) => String(option.id_formulario)}
                            placeholder="Seleccionar formulario..."
                            isClearable
                            components={{ Menu: AnimatedSelectMenu }}
                            menuPortalTarget={document.body}
                            styles={{
                                control: (base) => ({
                                    ...base,
                                    backgroundColor: "rgba(255,255,255,0.95)",
                                    borderColor: "rgba(255,255,255,0.3)",
                                    borderRadius: "8px",
                                    boxShadow: "none",
                                    color: "#333"
                                }),
                                menuPortal: base => ({ ...base, zIndex: 9999 })
                            }}
                        />
                    </div>
                    <button
                        style={{
                            background: "rgba(255,255,255,0.95)",
                            color: "#667eea",
                            border: "none",
                            borderRadius: "8px",
                            padding: "10px 24px",
                            fontWeight: 600,
                            cursor: creating || !selectedStage || !selectedForm ? "not-allowed" : "pointer",
                            opacity: creating || !selectedStage || !selectedForm ? 0.6 : 1,
                            transition: "all 0.2s",
                            fontSize: "14px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px"
                        }}
                        onClick={handleCreateRequirement}
                        disabled={creating || !selectedStage || !selectedForm}
                        onMouseOver={(e) => {
                            if (!creating && selectedStage && selectedForm) {
                                (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                            }
                        }}
                        onMouseOut={(e) => {
                            (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                        }}
                    >
                        {creating ? (
                            <>
                                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" style={{ width: "14px", height: "14px" }}></span>
                                <span>Creando...</span>
                            </>
                        ) : (
                            <>
                                <i className="bi bi-check2"></i>
                                <span>Agregar</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Current Constraints Section */}
            <div>
                <div style={{ marginBottom: "16px" }}>
                    <h5 style={{ margin: 0, fontSize: "16px", fontWeight: 600, color: "#333" }}>
                        <i className="bi bi-shield-check me-2" style={{ color: "#667eea" }}></i>
                        Restricciones Configuradas ({requirements.length})
                    </h5>
                </div>

                {requirements.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                            background: "#e7f3ff",
                            border: "1px solid #b3d9ff",
                            borderRadius: "10px",
                            padding: "20px",
                            textAlign: "center",
                            color: "#0066cc"
                        }}
                    >
                        <i className="bi bi-info-circle" style={{ fontSize: "24px", marginBottom: "8px", display: "block" }}></i>
                        <p style={{ margin: "8px 0 0 0", fontSize: "14px" }}>
                            <strong>Sin restricciones configuradas</strong>
                        </p>
                        <p style={{ margin: "4px 0 0 0", fontSize: "12px", opacity: 0.85 }}>
                            Todas las etapas pueden ser alcanzadas sin requisitos de formularios
                        </p>
                    </motion.div>
                ) : (
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                        gap: "14px"
                    }}>
                        {requirements.map((req, index) => (
                            <motion.div
                                key={req.id_requirement}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                style={{
                                    background: "white",
                                    border: "1px solid #e0e0e0",
                                    borderRadius: "10px",
                                    padding: "16px",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "12px"
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                                    <i className="bi bi-arrow-right-circle" style={{ color: "#667eea", fontSize: "18px", marginTop: "2px" }}></i>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", color: "#999", fontWeight: 600, marginBottom: "4px" }}>
                                            Etapa
                                        </div>
                                        <div style={{ fontSize: "14px", fontWeight: 600, color: "#333" }}>
                                            {req.etapa_nombre}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: "8px" }}>
                                    <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                                        <i className="bi bi-file-text" style={{ color: "#10b981", fontSize: "18px", marginTop: "2px" }}></i>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", color: "#999", fontWeight: 600, marginBottom: "4px" }}>
                                                Formulario Requerido
                                            </div>
                                            <div style={{ fontSize: "14px", fontWeight: 600, color: "#333" }}>
                                                {req.formulario_nombre}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: "10px" }}>
                                    <button
                                        style={{
                                            width: "100%",
                                            background: "#fee",
                                            color: "#dc3545",
                                            border: "1px solid #fcc",
                                            borderRadius: "6px",
                                            padding: "8px",
                                            fontSize: "12px",
                                            fontWeight: 600,
                                            cursor: "pointer",
                                            transition: "all 0.2s",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            gap: "6px"
                                        }}
                                        onClick={() => handleDeleteClick(req)}
                                        onMouseOver={(e) => {
                                            (e.currentTarget as HTMLElement).style.background = "#fdd";
                                        }}
                                        onMouseOut={(e) => {
                                            (e.currentTarget as HTMLElement).style.background = "#fee";
                                        }}
                                    >
                                        <i className="bi bi-trash"></i>
                                        Eliminar
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {showDeleteModal && requirementToDelete && (
                    <motion.div
                        className="modal d-block"
                        style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 9999 }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="modal-dialog modal-dialog-centered"
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                        >
                            <div className="modal-content border-danger">
                                <div className="modal-header bg-danger text-white">
                                    <h5 className="modal-title">
                                        <i className="bi bi-exclamation-triangle me-2"></i>
                                        Confirmar Eliminación
                                    </h5>
                                </div>
                                <div className="modal-body">
                                    <p className="mb-3">
                                        ¿Deseas eliminar la siguiente restricción?
                                    </p>
                                    <div className="alert alert-light border">
                                        <div className="mb-2">
                                            <strong>Etapa:</strong> {requirementToDelete.etapa_nombre}
                                        </div>
                                        <div>
                                            <strong>Formulario:</strong> {requirementToDelete.formulario_nombre}
                                        </div>
                                    </div>
                                    <p className="text-muted small">
                                        Esta acción no se puede deshacer.
                                    </p>
                                </div>
                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => setShowDeleteModal(false)}
                                        disabled={deleting}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-danger"
                                        onClick={handleConfirmDelete}
                                        disabled={deleting}
                                    >
                                        {deleting ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                Eliminando...
                                            </>
                                        ) : (
                                            <>
                                                <i className="bi bi-trash me-2"></i>
                                                Eliminar
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
