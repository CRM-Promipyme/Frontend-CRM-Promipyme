import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { Spinner } from "../../../components/ui/Spinner";
import { caseFormDetail } from "../../../controllers/caseControllers";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface FieldValue {
    id_valor_campo: number;
    campo_formulario: number;
    campo_nombre: string;
    campo_tipo: string;
    campo_requerido: boolean;
    valor_campo: string;
}

interface CaseFormDetailResponse {
    case_id: number;
    case_name: string;
    form_id: number;
    form_name: string;
    form_description: string;
    field_values: FieldValue[];
}

interface CaseFormDetailProps {
    caseId: number;
    formId: number;
    onBack: () => void;
}

export function CaseFormDetail({ caseId, formId, onBack }: CaseFormDetailProps) {
    const [formData, setFormData] = useState<CaseFormDetailResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        if (caseId && formId) {
            fetchFormDetail();
        }
    }, [caseId, formId]);

    const fetchFormDetail = async () => {
        try {
            setLoading(true);
            const response = await caseFormDetail(caseId, formId);
            setFormData(response);
        } catch (error) {
            console.error(error);
            toast.error("Error al cargar los detalles del formulario");
        } finally {
            setLoading(false);
        }
    };

    const getFieldTypeIcon = (tipo: string) => {
        switch (tipo.toLowerCase()) {
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

    const formatFieldValue = (value: string, tipo: string) => {
        if (!value) return 'Sin valor';
        
        switch (tipo.toLowerCase()) {
            case 'booleano':
                return value.toLowerCase() === 'true' ? 'Sí' : 'No';
            case 'fecha':
                try {
                    return new Date(value).toLocaleDateString('es-ES');
                } catch {
                    return value;
                }
            default:
                return value;
        }
    };

    const exportToPDF = async () => {
        if (!formData) return;
        
        try {
            setExporting(true);
            
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.width;
            const margin = 20;
            
            // Header
            doc.setFontSize(18);
            doc.setFont("helvetica", "bold");
            doc.text("Detalles del Formulario", margin, 30);
            
            // Form Information
            doc.setFontSize(12);
            doc.setFont("helvetica", "normal");
            let yPosition = 50;
            
            doc.text(`Formulario: ${formData.form_name}`, margin, yPosition);
            yPosition += 10;
            
            if (formData.form_description) {
                doc.text(`Descripción: ${formData.form_description}`, margin, yPosition);
                yPosition += 10;
            }
            
            doc.text(`Caso: ${formData.case_name}`, margin, yPosition);
            yPosition += 10;
            
            doc.text(`Fecha de exportación: ${new Date().toLocaleDateString('es-ES')}`, margin, yPosition);
            yPosition += 20;
            
            // Fields Table
            if (formData.field_values.length > 0) {
                const tableData = formData.field_values.map(field => [
                    field.campo_nombre,
                    formatFieldValue(field.valor_campo, field.campo_tipo)
                ]);
                
                // Use autoTable for better table formatting
                autoTable(doc, {
                    head: [['Campo', 'Valor']],
                    body: tableData,
                    startY: yPosition,
                    margin: { left: margin, right: margin },
                    styles: {
                        fontSize: 10,
                        cellPadding: 5
                    },
                    headStyles: {
                        fillColor: [66, 139, 202],
                        textColor: 255,
                        fontStyle: 'bold'
                    },
                    columnStyles: {
                        0: { cellWidth: 40 }, // Campo
                        1: { cellWidth: 'auto' } // Valor
                    }
                });
            }
            
            // Footer
            const totalPages = doc.internal.pages.length - 1;
            for (let i = 1; i <= totalPages; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(128);
                doc.text(
                    `Página ${i} de ${totalPages} - CRM Promipyme`,
                    pageWidth - margin,
                    doc.internal.pageSize.height - 10,
                    { align: 'right' }
                );
            }
            
            // Save the PDF
            const fileName = `formulario_${formData.form_name.replace(/[^a-z0-9]/gi, '_')}_${new Date().getTime()}.pdf`;
            doc.save(fileName);
            
            toast.success("PDF exportado correctamente");
            
        } catch (error) {
            console.error("Error exporting PDF:", error);
            toast.error("Error al exportar el PDF");
        } finally {
            setExporting(false);
        }
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center py-5">
                <Spinner />
            </div>
        );
    }

    if (!formData) {
        return (
            <div style={{
                textAlign: "center",
                padding: "3rem 1rem",
                color: "#6c757d"
            }}>
                <i className="bi bi-exclamation-circle" style={{ fontSize: "3rem", marginBottom: "1rem" }}></i>
                <p>No se pudieron cargar los detalles del formulario.</p>
                <motion.button
                    className="btn btn-outline-primary"
                    onClick={onBack}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <i className="bi bi-arrow-left me-2"></i>
                    Volver
                </motion.button>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
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
                            background: "#e3f2fd",
                            color: "#1976d2",
                            padding: "4px 10px",
                            borderRadius: "8px",
                            fontSize: "0.75rem",
                            fontWeight: 600
                        }}>
                            <i className="bi bi-file-earmark-check me-1"></i>
                            Formulario Completado
                        </div>
                    </div>
                    
                    <h4 style={{
                        margin: 0,
                        fontWeight: 600,
                        color: "#212529",
                        marginBottom: "6px"
                    }}>
                        {formData.form_name}
                    </h4>
                    
                    <p style={{
                        margin: 0,
                        color: "#6c757d",
                        fontSize: "0.95rem",
                        marginBottom: "8px"
                    }}>
                        {formData.form_description || "Sin descripción"}
                    </p>
                    
                    <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "0.875rem", color: "#6c757d" }}>
                        <span>
                            <i className="bi bi-file-text me-1"></i>
                            Caso: {formData.case_name}
                        </span>
                        <span>
                            <i className="bi bi-list-ul me-1"></i>
                            {formData.field_values.length} campo{formData.field_values.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: "flex", gap: "8px" }}>
                    <motion.button
                        className="btn btn-outline-danger"
                        style={{
                            borderRadius: "8px",
                            padding: "8px 16px",
                            fontSize: "0.875rem",
                            fontWeight: 500,
                            display: "flex",
                            alignItems: "center",
                            gap: "8px"
                        }}
                        whileHover={{ scale: exporting ? 1 : 1.02 }}
                        whileTap={{ scale: exporting ? 1 : 0.98 }}
                        onClick={exportToPDF}
                        disabled={exporting}
                    >
                        {exporting ? (
                            <>
                                <Spinner size="sm" />
                                Exportando...
                            </>
                        ) : (
                            <>
                                <i className="bi bi-file-earmark-pdf"></i>
                                Exportar PDF
                            </>
                        )}
                    </motion.button>
                    
                    <motion.button
                        className="btn btn-outline-primary"
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
                        onClick={() => {
                            // TODO: Add navigation to form update
                            toast.info("Editar formulario - En desarrollo");
                        }}
                    >
                        <i className="bi bi-pencil"></i>
                        Editar
                    </motion.button>
                </div>
            </div>

            {/* Form Fields */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {formData.field_values.length === 0 ? (
                    <div style={{
                        textAlign: "center",
                        padding: "3rem 1rem",
                        color: "#6c757d"
                    }}>
                        <i className="bi bi-file-earmark-x" style={{ fontSize: "3rem", marginBottom: "1rem" }}></i>
                        <p>Este formulario no tiene campos completados.</p>
                    </div>
                ) : (
                    formData.field_values.map((field, index) => (
                        <motion.div
                            key={field.id_valor_campo}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.2, delay: index * 0.05 }}
                            style={{
                                background: "#f8f9fa",
                                border: "1px solid #e9ecef",
                                borderRadius: "8px",
                                padding: "20px"
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
                                {/* Field Icon */}
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
                                    <i className={`bi ${getFieldTypeIcon(field.campo_tipo)}`} style={{
                                        color: "#1976d2",
                                        fontSize: "18px"
                                    }}></i>
                                </div>

                                {/* Field Content */}
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                                        <h6 style={{
                                            margin: 0,
                                            fontWeight: 600,
                                            color: "#212529",
                                            fontSize: "1rem"
                                        }}>
                                            {field.campo_nombre}
                                        </h6>
                                        
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                            {field.campo_requerido && (
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
                                                {field.campo_tipo}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Field Value */}
                                    <div style={{
                                        background: "#ffffff",
                                        border: "1px solid #dee2e6",
                                        borderRadius: "6px",
                                        padding: "12px",
                                        fontSize: "0.95rem",
                                        color: field.valor_campo ? "#212529" : "#6c757d",
                                        fontWeight: field.valor_campo ? 500 : 400,
                                        minHeight: "20px"
                                    }}>
                                        {formatFieldValue(field.valor_campo, field.campo_tipo)}
                                    </div>

                                    {/* Field Metadata */}
                                    <div style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "12px",
                                        marginTop: "8px",
                                        fontSize: "0.8rem",
                                        color: "#6c757d"
                                    }}>
                                        <span>
                                            <i className="bi bi-hash me-1"></i>
                                            ID Campo: {field.campo_formulario}
                                        </span>
                                        <span>
                                            <i className="bi bi-database me-1"></i>
                                            ID Valor: {field.id_valor_campo}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </motion.div>
    );
}