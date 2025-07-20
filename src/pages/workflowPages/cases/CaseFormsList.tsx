import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { Spinner } from "../../../components/ui/Spinner";
import { simpleFetchCaseForms } from "../../../controllers/caseControllers";
import { CaseFormDetail } from "./CaseFormDetail";

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

export function CaseFormsList({ caseId }: { caseId: number }) {
    const [formsData, setFormsData] = useState<CaseFormsResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [selectedFormId, setSelectedFormId] = useState<number | null>(null);

    useEffect(() => {
        if (caseId) {
            fetchCaseForms();
        }
    }, [caseId]);

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

    const handleViewDetails = (formId: number) => {
        setSelectedFormId(formId);
    };

    const handleBackToList = () => {
        setSelectedFormId(null);
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center py-4">
                <Spinner />
            </div>
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
            {/* Header */}
            <div style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "10px" }}>
                <i className="bi bi-file-earmark-check" style={{ fontSize: "1.5rem", color: "#0d6efd" }}></i>
                <div>
                    <h5 style={{ margin: 0, fontWeight: 600 }}>Formularios Completados</h5>
                    <span style={{ color: "#6c757d", fontSize: "0.95rem" }}>
                        Formularios que han sido completados para este caso.
                    </span>
                </div>
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