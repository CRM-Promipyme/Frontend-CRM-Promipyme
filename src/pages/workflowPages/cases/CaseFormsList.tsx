import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { Spinner } from "../../../components/ui/Spinner";
import { simpleFetchCaseForms } from "../../../controllers/caseControllers";
import { CaseFormDetail } from "./CaseFormDetail";
import { CreateCaseForm } from "./CreateCaseForm";
import api from "../../../controllers/api";
import { Caso } from "../../../types/workflowTypes";
import { Proceso } from "../../../types/workflowTypes";

interface CompletedForm {
    formulario_id: number;
    formulario_nombre: string;
}

interface CaseFormsResponse {
    case_id: number;
    case_name: string;
    process_name: string;
    completed_forms: CompletedForm[];
}

interface NextStageRequirement {
    id_requirement: number;
    formulario: number;
    formulario_nombre: string;
    etapa: number;
    etapa_nombre: string;
}

export function CaseFormsList({ 
    caseId, 
    workflowId,
    selectedCase,
    process
}: { 
    caseId: number, 
    workflowId?: number,
    selectedCase?: Caso,
    process?: Proceso
}) {
    const [formsData, setFormsData] = useState<CaseFormsResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [selectedFormId, setSelectedFormId] = useState<number | null>(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [currentStageRequirements, setCurrentStageRequirements] = useState<NextStageRequirement[]>([]);
    const [nextStageRequirements, setNextStageRequirements] = useState<NextStageRequirement[]>([]);
    const [nextStageInfo, setNextStageInfo] = useState<{ id: number; name: string } | null>(null);
    const [loadingStageRequirements, setLoadingStageRequirements] = useState(false);

    useEffect(() => {
        if (caseId) {
            fetchCaseForms();
        }
    }, [caseId]);

    // Load next stage requirements when selectedCase or process changes
    useEffect(() => {
        if (selectedCase && process && selectedCase.etapa_actual && process.etapas) {
            // Fetch both current stage and next stage requirements
            fetchStageRequirements(process.id_proceso, selectedCase.etapa_actual, process.etapas);
        }
    }, [selectedCase?.id_caso, process?.id_proceso]);

    const fetchCaseForms = async () => {
        try {
            setLoading(true);
            const response = await simpleFetchCaseForms(caseId);
            setFormsData(response);
        } catch (error) {
            console.error(error);
            toast.error("Error al cargar los formularios del caso");
        } finally {
            setLoading(false);
        }
    };

    const fetchStageRequirements = async (processId: number, currentStageId: number, stages: Array<{ id_etapa: number; nombre_etapa: string }>) => {
        try {
            setLoadingStageRequirements(true);
            
            // Fetch current stage requirements
            try {
                const currentResponse = await api.get(`/workflows/procesos/${processId}/stages/${currentStageId}/requirements/`);
                if (currentResponse.data && Array.isArray(currentResponse.data)) {
                    setCurrentStageRequirements(currentResponse.data);
                }
            } catch (error) {
                console.error("Error fetching current stage requirements:", error);
                setCurrentStageRequirements([]);
            }
            
            // Find the next stage
            const currentStageIndex = stages.findIndex(s => s.id_etapa === currentStageId);
            
            if (currentStageIndex === -1 || currentStageIndex === stages.length - 1) {
                // No next stage
                setNextStageRequirements([]);
                setNextStageInfo(null);
                return;
            }
            
            const nextStage = stages[currentStageIndex + 1];
            setNextStageInfo({ id: nextStage.id_etapa, name: nextStage.nombre_etapa });
            
            // Fetch requirements for next stage
            const nextResponse = await api.get(`/workflows/procesos/${processId}/stages/${nextStage.id_etapa}/requirements/`);
            if (nextResponse.data && Array.isArray(nextResponse.data)) {
                setNextStageRequirements(nextResponse.data);
            }
        } catch (error) {
            console.error("Error fetching stage requirements:", error);
            setNextStageRequirements([]);
        } finally {
            setLoadingStageRequirements(false);
        }
    };

    const handleViewDetails = (formId: number) => {
        setSelectedFormId(formId);
    };

    const handleBackToList = () => {
        setSelectedFormId(null);
        setShowCreateForm(false);
    };

    const handleCreateForm = () => {
        setShowCreateForm(true);
    };

    const handleFormCreated = () => {
        setShowCreateForm(false);
        fetchCaseForms(); // Refresh the forms list
        // Next stage requirements will update automatically when selectedCase changes via parent
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center py-4">
                <Spinner />
            </div>
        );
    }

    // Show form creation view
    if (showCreateForm && formsData) {
        return (
            <CreateCaseForm
                caseId={caseId}
                workflowId={workflowId}
                caseName={formsData.case_name}
                processName={formsData.process_name}
                completedFormIds={formsData.completed_forms.map(form => form.formulario_id)}
                onBack={handleBackToList}
                onFormCreated={handleFormCreated}
            />
        );
    }

    // Show form detail view if a form is selected
    if (selectedFormId) {
        return (
            <CaseFormDetail
                caseId={caseId}
                formId={selectedFormId}
                onBack={handleBackToList}
            />
        );
    }

    return (
        <div style={{
            marginTop: "2rem",
            background: "#fff",
            borderRadius: "12px",
        }}>
            {/* Current Stage Requirements Section */}
            {currentStageRequirements.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{
                        background: "linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%)",
                        border: "2px solid #f5c6cb",
                        borderRadius: "12px",
                        padding: "20px",
                        marginBottom: "2rem"
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                        <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: "1.5rem", color: "#dc3545" }}></i>
                        <div>
                            <h6 style={{ margin: 0, fontWeight: 600, color: "#721c24" }}>Formularios pendientes en etapa actual</h6>
                            <span style={{ color: "#721c24", fontSize: "0.9rem" }}>Estos formularios deben completarse para continuar en el flujo de trabajo</span>
                        </div>
                    </div>

                    {loadingStageRequirements ? (
                        <div style={{ textAlign: "center", padding: "16px", color: "#666" }}>
                            <Spinner /> Cargando requisitos...
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            {currentStageRequirements.map((req) => {
                                const isCompleted = formsData?.completed_forms.some(f => f.formulario_id === req.formulario);
                                return (
                                    <motion.div
                                        key={req.id_requirement}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.2 }}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "12px",
                                            background: isCompleted ? "#d4edda" : "rgba(255,255,255,0.9)",
                                            padding: "12px 14px",
                                            borderRadius: "8px",
                                            border: isCompleted ? "1px solid #c3e6cb" : "1px solid #f5c6cb",
                                            transition: "all 0.2s ease"
                                        }}
                                    >
                                        <div style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            width: "28px",
                                            height: "28px",
                                            borderRadius: "50%",
                                            background: isCompleted ? "#c3e6cb" : "#f8d7da",
                                            flexShrink: 0
                                        }}>
                                            {isCompleted ? (
                                                <i className="bi bi-check-circle-fill" style={{ color: "#155724", fontSize: "16px" }}></i>
                                            ) : (
                                                <i className="bi bi-exclamation-circle-fill" style={{ color: "#dc3545", fontSize: "16px" }}></i>
                                            )}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <span style={{ color: isCompleted ? "#155724" : "#721c24", fontWeight: 500, fontSize: "0.95rem" }}>
                                                {req.formulario_nombre}
                                            </span>
                                            {isCompleted && (
                                                <span style={{ marginLeft: "8px", color: "#155724", fontSize: "0.8rem", fontWeight: 600 }}>
                                                    ✓ Completado
                                                </span>
                                            )}
                                        </div>
                                        {!isCompleted && (
                                            <motion.button
                                                className="btn btn-sm"
                                                style={{
                                                    background: "#dc3545",
                                                    color: "white",
                                                    border: "none",
                                                    borderRadius: "6px",
                                                    padding: "6px 12px",
                                                    fontSize: "0.8rem",
                                                    fontWeight: 500,
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "6px"
                                                }}
                                                whileHover={{ scale: 1.05, background: "#c82333" }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={handleCreateForm}
                                            >
                                                <i className="bi bi-plus-lg"></i>
                                                Completar
                                            </motion.button>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </motion.div>
            )}

            {/* Next Stage Requirements Section */}
            {nextStageInfo && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{
                        background: nextStageRequirements.length > 0 
                            ? "linear-gradient(135deg, #fff3cd 0%, #fffbe6 100%)"
                            : "linear-gradient(135deg, #d1ecf1 0%, #e7f3f5 100%)",
                        border: nextStageRequirements.length > 0 ? "2px solid #ffc107" : "2px solid #17a2b8",
                        borderRadius: "12px",
                        padding: "20px",
                        marginBottom: "2rem"
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                        <i className="bi bi-arrow-right-circle-fill" style={{ fontSize: "1.5rem", color: nextStageRequirements.length > 0 ? "#ff8c00" : "#138496" }}></i>
                        <div>
                            <h6 style={{ margin: 0, fontWeight: 600, color: "#333" }}>
                                {nextStageRequirements.length > 0 ? "Formularios requeridos para avanzar" : "Siguiente etapa"}
                            </h6>
                            <span style={{ color: "#666", fontSize: "0.9rem" }}>
                                Etapa destino: <strong>{nextStageInfo.name}</strong>
                            </span>
                        </div>
                    </div>

                    {loadingStageRequirements ? (
                        <div style={{ textAlign: "center", padding: "16px", color: "#666" }}>
                            <Spinner /> Cargando requisitos...
                        </div>
                    ) : nextStageRequirements.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "16px", color: "#138496" }}>
                            <i className="bi bi-check-circle" style={{ fontSize: "1.5rem", marginBottom: "8px", display: "block" }}></i>
                            <p style={{ margin: 0, fontWeight: 500 }}>No hay formularios requeridos para avanzar a la siguiente etapa.</p>
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            {nextStageRequirements.map((req) => {
                                const isCompleted = formsData?.completed_forms.some(f => f.formulario_id === req.formulario);
                                return (
                                    <motion.div
                                        key={req.id_requirement}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.2 }}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "12px",
                                            background: isCompleted ? "#e8f5e8" : "rgba(255,255,255,0.8)",
                                            padding: "12px 14px",
                                            borderRadius: "8px",
                                            border: isCompleted ? "1px solid #c8e6c9" : "1px solid #fde4b6",
                                            transition: "all 0.2s ease"
                                        }}
                                    >
                                        <div style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            width: "28px",
                                            height: "28px",
                                            borderRadius: "50%",
                                            background: isCompleted ? "#c8e6c9" : "#ffe0b2",
                                            flexShrink: 0
                                        }}>
                                            {isCompleted ? (
                                                <i className="bi bi-check-circle-fill" style={{ color: "#2e7d32", fontSize: "16px" }}></i>
                                            ) : (
                                                <i className="bi bi-exclamation-circle" style={{ color: "#f57c00", fontSize: "16px" }}></i>
                                            )}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <span style={{ color: isCompleted ? "#2e7d32" : "#333", fontWeight: 500, fontSize: "0.95rem" }}>
                                                {req.formulario_nombre}
                                            </span>
                                            {isCompleted && (
                                                <span style={{ marginLeft: "8px", color: "#2e7d32", fontSize: "0.8rem", fontWeight: 600 }}>
                                                    ✓ Completado
                                                </span>
                                            )}
                                        </div>
                                        {!isCompleted && (
                                            <motion.button
                                                className="btn btn-sm"
                                                style={{
                                                    background: "#ff8c00",
                                                    color: "white",
                                                    border: "none",
                                                    borderRadius: "6px",
                                                    padding: "6px 12px",
                                                    fontSize: "0.8rem",
                                                    fontWeight: 500,
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "6px"
                                                }}
                                                whileHover={{ scale: 1.05, background: "#e67e00" }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={handleCreateForm}
                                            >
                                                <i className="bi bi-plus-lg"></i>
                                                Completar
                                            </motion.button>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </motion.div>
            )}

            {/* Header */}
            <div style={{ 
                marginBottom: "1.5rem", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "space-between"
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <i className="bi bi-file-earmark-check" style={{ fontSize: "1.5rem", color: "#0d6efd" }}></i>
                    <div>
                        <h5 style={{ margin: 0, fontWeight: 600 }}>Formularios Completados</h5>
                        <span style={{ color: "#6c757d", fontSize: "0.95rem" }}>
                            Formularios que han sido completados para este caso.
                        </span>
                    </div>
                </div>
                
                {/* Create Form Button */}
                <motion.button
                    className="btn btn-primary"
                    style={{
                        borderRadius: "8px",
                        padding: "8px 16px",
                        fontSize: "0.875rem",
                        fontWeight: 500,
                        display: "flex",
                        alignItems: "center",
                        gap: "8px"
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCreateForm}
                >
                    <i className="bi bi-plus-circle"></i>
                    Crear Formulario
                </motion.button>
            </div>

            {/* Forms Content */}
            {!formsData || formsData.completed_forms.length === 0 ? (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{
                        textAlign: "center",
                        padding: "2rem 1rem",
                        color: "#6c757d"
                    }}
                >
                    <i className="bi bi-file-earmark-x" style={{ 
                        fontSize: "3rem", 
                        color: "#dee2e6",
                        marginBottom: "1rem"
                    }}></i>
                    <p style={{ margin: 0, fontSize: "0.95rem" }}>
                        Este caso aún no tiene formularios completados.
                    </p>
                </motion.div>
            ) : (
                <>
                    {/* Forms count badge */}
                    <div style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        background: "#e8f5e8",
                        color: "#2e7d32",
                        padding: "6px 12px",
                        borderRadius: "8px",
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        marginBottom: "1.5rem"
                    }}>
                        <i className="bi bi-check-circle-fill"></i>
                        {formsData.completed_forms.length} formulario{formsData.completed_forms.length !== 1 ? 's' : ''} completado{formsData.completed_forms.length !== 1 ? 's' : ''}
                    </div>

                    {/* Forms Grid */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {formsData.completed_forms.map((form, index) => (
                            <motion.div 
                                key={form.formulario_id} 
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.2, delay: index * 0.05 }}
                                style={{
                                    background: "#f8f9fa",
                                    border: "1px solid #e9ecef",
                                    borderRadius: "8px",
                                    padding: "16px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    transition: "all 0.2s ease"
                                }}
                                whileHover={{ 
                                    backgroundColor: "#f1f3f4",
                                    scale: 1.01
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
                                    <div style={{
                                        background: "#e8f5e8",
                                        borderRadius: "50%",
                                        width: "36px",
                                        height: "36px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center"
                                    }}>
                                        <i className="bi bi-check-circle-fill" style={{ 
                                            color: "#2e7d32",
                                            fontSize: "16px"
                                        }}></i>
                                    </div>
                                    
                                    <div style={{ flex: 1 }}>
                                        <h6 style={{
                                            fontWeight: 600,
                                            color: "#212529",
                                            margin: 0,
                                            marginBottom: "4px",
                                            fontSize: "0.95rem"
                                        }}>
                                            {form.formulario_nombre}
                                        </h6>
                                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                            <span style={{
                                                display: "inline-flex",
                                                alignItems: "center",
                                                gap: "4px",
                                                background: "#e8f5e8",
                                                color: "#2e7d32",
                                                padding: "2px 6px",
                                                borderRadius: "4px",
                                                fontSize: "0.75rem",
                                                fontWeight: 600
                                            }}>
                                                <i className="bi bi-check"></i>
                                                Completado
                                            </span>
                                            <span style={{ 
                                                fontSize: "0.8rem", 
                                                color: "#6c757d",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "4px"
                                            }}>
                                                <i className="bi bi-hash"></i>
                                                ID: {form.formulario_id}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                
                                <motion.button
                                    className="btn btn-outline-success btn-sm"
                                    style={{
                                        borderRadius: "6px",
                                        padding: "6px 12px",
                                        fontSize: "0.8rem",
                                        fontWeight: 500,
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "6px"
                                    }}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleViewDetails(form.formulario_id)}
                                >
                                    <i className="bi bi-eye"></i>
                                    Ver Detalles
                                </motion.button>
                            </motion.div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}