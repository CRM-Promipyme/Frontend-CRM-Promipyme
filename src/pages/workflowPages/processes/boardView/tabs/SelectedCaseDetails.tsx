import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Link } from "react-router-dom";
import { useState } from "react";
import { toast } from "react-toastify";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CaseTasks } from "./CaseTasks";
import { CaseAttatchments } from "./CaseAttatchments";
import { motion, AnimatePresence } from "framer-motion";
import { NotesSection } from "./kanbanBoard/NotesSection";
import { daysLeft } from "../../../../../utils/formatUtils";
import { CaseFormsList } from "../../../cases/CaseFormsList";
import { Activity } from "../../../../../types/activityTypes";
import { formatNumber } from "../../../../../utils/formatUtils";
import { Caso, Proceso } from "../../../../../types/workflowTypes";
import { lowerColorOpacity } from "../../../../../utils/formatUtils";
import { ActivityLog } from "../../../../../components/ui/ActivityLog";
import { Spinner } from "../../../../../components/ui/Spinner";

interface SelectedCaseDetailsProps {
    selectedCase: Caso;
    process: Proceso;
    caseActivities: Activity[];
    setCaseActivities: React.Dispatch<React.SetStateAction<Activity[]>>;
}

export function SelectedCaseDetails({ selectedCase, process, caseActivities, setCaseActivities }: SelectedCaseDetailsProps) {
    const [exporting, setExporting] = useState(false);
    const [previewing, setPreviewing] = useState(false);
    const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);

    const generateCasePDF = () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;
        const margin = 20;
        
        // Header
        doc.setFontSize(20);
        doc.setFont("helvetica", "bold");
        doc.text("Detalles del Caso", margin, 30);
        
        // Case Information
        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        let yPosition = 50;
        
        doc.text(`# de Caso: ${String(selectedCase.id_caso).padStart(7, '0')}`, margin, yPosition);
        yPosition += 10;
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text(`${selectedCase.nombre_caso}`, margin, yPosition);
        yPosition += 12;
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        
        // Description
        if (selectedCase.descripcion_caso) {
            doc.text("Descripción:", margin, yPosition);
            yPosition += 6;
            const splitDescription = doc.splitTextToSize(selectedCase.descripcion_caso, pageWidth - 2 * margin);
            doc.setFontSize(10);
            doc.text(splitDescription, margin, yPosition);
            yPosition += splitDescription.length * 5 + 5;
            doc.setFontSize(11);
        }
        
        // Case Details Table
        const caseDetailsData = [
            ['Valor del Caso', `RD$ ${formatNumber(parseFloat(selectedCase.valor_caso))}`],
            ['Contacto', `${selectedCase.contact_first_name} ${selectedCase.contact_last_name}`],
            ['Etapa Actual', selectedCase.etapa_actual && process.etapas.find((step) => step.id_etapa === selectedCase.etapa_actual) 
                ? process.etapas.find((step) => step.id_etapa === selectedCase.etapa_actual)?.nombre_etapa || 'N/A'
                : 'N/A'],
            ['Estado', selectedCase.abierto ? 'Abierto' : 'Cerrado'],
        ];
        
        autoTable(doc, {
            head: [['Campo', 'Valor']],
            body: caseDetailsData,
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
            }
        });
        
        yPosition = (doc as any).lastAutoTable.finalY + 15;
        
        // Important Dates
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("Fechas Importantes:", margin, yPosition);
        yPosition += 8;
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        const datesData = [
            ['Creado', format(new Date(selectedCase.fecha_creacion), "d 'de' MMMM 'de' yyyy", { locale: es })],
            ['Cierre Estimado', format(new Date(selectedCase.fecha_cierre_estimada), "d 'de' MMMM 'de' yyyy", { locale: es })],
            ['Última Actualización', format(new Date(selectedCase.ultima_actualizacion), "d 'de' MMMM 'de' yyyy", { locale: es })],
        ];
        
        autoTable(doc, {
            head: [['Campo', 'Fecha']],
            body: datesData,
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
            }
        });
        
        // Signature Section
        const signatureSectionY = Math.min(pageHeight - 80, (doc as any).lastAutoTable.finalY + 30);
        
        doc.setDrawColor(100);
        doc.setLineWidth(0.5);
        
        // Signature line
        doc.line(margin, signatureSectionY + 40, margin + 60, signatureSectionY + 40);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text("Firma del Cliente", margin, signatureSectionY + 45);
        
        // Date line
        doc.line(margin + 80, signatureSectionY + 40, margin + 140, signatureSectionY + 40);
        doc.text("Fecha", margin + 80, signatureSectionY + 45);
        
        // Footer
        const totalPages = doc.internal.pages.length - 1;
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(128);
            doc.text(
                `Página ${i} de ${totalPages} - CRM Promipyme`,
                pageWidth - margin,
                pageHeight - 10,
                { align: 'right' }
            );
        }
        
        return doc;
    };

    const previewCaseToPDF = async () => {
        if (!selectedCase) return;
        
        try {
            setPreviewing(true);
            const doc = generateCasePDF();
            const blob = doc.output('blob');
            const blobUrl = URL.createObjectURL(blob);
            setPreviewBlobUrl(blobUrl);
        } catch (error) {
            console.error("Error generating PDF preview:", error);
            toast.error("Error al generar la vista previa del PDF");
        } finally {
            setPreviewing(false);
        }
    };

    const exportCaseToPDF = async () => {
        if (!selectedCase) return;
        
        try {
            setExporting(true);
            const doc = generateCasePDF();
            
            // Save the PDF
            const fileName = `caso_${String(selectedCase.id_caso).padStart(7, '0')}_${selectedCase.nombre_caso.replace(/[^a-z0-9]/gi, '_')}_${new Date().getTime()}.pdf`;
            doc.save(fileName);
            
            toast.success("PDF exportado correctamente");
            
        } catch (error) {
            console.error("Error exporting PDF:", error);
            toast.error("Error al exportar el PDF");
        } finally {
            setExporting(false);
        }
    };

    return (
        <motion.div 
            key={selectedCase.id_caso}
            className="selected-case"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
        >
            <AnimatePresence mode="wait">
                    {selectedCase ? (
                        <motion.div 
                            key={selectedCase.id_caso}
                            className="selected-case"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <p className="case-number" style={{ fontSize: "0.85rem", color: "#6c757d", marginBottom: "5px" }}>
                                Caso #{String(selectedCase.id_caso).padStart(7, '0')}
                            </p>

                            <div className="case-title">
                                <h3 style={{ fontWeight: 700 }}>{selectedCase.nombre_caso}</h3>
                                {selectedCase.abierto ? (
                                    <div className="case-status">
                                        <span className="case-status-badge case-open">Abierto</span>
                                        <span className="case-status-badge case-in-progress">En proceso</span>
                                        {selectedCase.exitoso && (
                                            <span className="case-status-badge case-open">Exitoso</span>
                                        )}
                                    </div>
                                ) : (
                                    <div className="case-status">
                                        <span className="case-status-badge case-closed">Cerrado</span>
                                    </div>
                                )}
                            </div>
                            
                            <div className="column-container">
                                <div className="column">
                                    <div style={{ display: "flex", gap: "10px", marginBottom: '20px', marginTop: '0px' }}>
                                        <Link to={`/workflows/cases/update/${selectedCase.id_caso}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                            <button className="btn btn-primary">
                                                Editar
                                            </button>
                                        </Link>
                                        <motion.button
                                            className="btn btn-outline-info"
                                            style={{
                                                borderRadius: "8px",
                                                padding: "8px 16px",
                                                fontSize: "0.875rem",
                                                fontWeight: 500,
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "8px"
                                            }}
                                            whileHover={{ scale: previewing ? 1 : 1.02 }}
                                            whileTap={{ scale: previewing ? 1 : 0.98 }}
                                            onClick={previewCaseToPDF}
                                            disabled={previewing}
                                        >
                                            {previewing ? (
                                                <>
                                                    <Spinner className="spinner-border-sm" />
                                                    Generando...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="bi bi-eye"></i>
                                                    Vista Previa
                                                </>
                                            )}
                                        </motion.button>
                                        <motion.button
                                            className="btn btn-outline-warning"
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
                                            onClick={exportCaseToPDF}
                                            disabled={exporting}
                                        >
                                            {exporting ? (
                                                <>
                                                    <Spinner className="spinner-border-sm" />
                                                    Exportando...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="bi bi-file-earmark-pdf"></i>
                                                    Exportar PDF
                                                </>
                                            )}
                                        </motion.button>
                                    </div>
                                    <div className="case-item-container">
                                        <div className="case-item-header">
                                            <i className="bi bi-file-earmark-text"></i>
                                            <p>Descripción</p>
                                        </div>
                                        <div className="case-item-body">
                                            <p>{selectedCase.descripcion_caso}</p>
                                        </div>
                                        <div className="case-item-container">
                                            <div className="case-item-header">
                                                <i className="bi bi-currency-dollar"></i>
                                                <p>Valor del Caso:</p>
                                            </div>
                                            <div className="case-item-body">
                                                <p style={{ fontWeight: 700, fontSize: "1.5rem" }}>RD$ {formatNumber(parseFloat(selectedCase.valor_caso))}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <Link 
                                        to={`/contacts/details/${selectedCase.contact}`} 
                                        style={{ textDecoration: 'none', color: 'inherit' }} 
                                    >
                                        <div className="case-contact-box" style={{ marginBottom: '20px' }}>
                                                <i className="bi bi-file-person" style={{ fontSize: '30px' }}></i>
                                                <div>
                                                    <strong className="status-title">Contacto Relacionado</strong>
                                                    <p className="status-description">{selectedCase.contact_first_name} {selectedCase.contact_last_name}</p>
                                                </div>
                                        </div>
                                    </Link>
                                    <div className="case-stage-box" style={{ color: process.color, backgroundColor: lowerColorOpacity(process.color, 0.05), borderColor: lowerColorOpacity(process.color, 0.15) }}>
                                        <i className="bi bi-kanban" style={{ fontSize: '25px' }}></i>
                                        <div>
                                            <strong className="status-title" style={{ color: process.color }}>Etapa Actual</strong>
                                            {selectedCase.etapa_actual && process.etapas.find((step) => step.id_etapa === selectedCase.etapa_actual) ? (
                                                <p className="status-description">{process.etapas.find((step) => step.id_etapa === selectedCase.etapa_actual)?.nombre_etapa}</p>
                                            ) : (
                                                <p className="status-description">N/A</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="case-attachments">
                                        {selectedCase && (
                                            <CaseAttatchments caseId={selectedCase.id_caso}/>
                                        )}
                                    </div>
                                    <div className="case-forms">
                                        {selectedCase && (
                                            <CaseFormsList caseId={selectedCase.id_caso} workflowId={process.id_proceso}/>
                                        )}
                                    </div>
                                    <div className="case-notes-container">
                                        <NotesSection
                                            id={selectedCase.id_caso} 
                                        />
                                    </div>
                                </div>
                                <div className="column">
                                    <div className="case-item-container" style={{ padding: '20px' }}>
                                        <div className="case-item-header" style={{ marginBottom: '5px'}}>
                                            <i className="bi bi-calendar-week"></i>
                                            <p style={{ fontWeight: 650, }}>Fechas Importantes</p>
                                        </div>
                                        <div className="case-item-body">
                                            <div className="case-item">
                                                <p className="label">Creado:</p>
                                                <p>{format(new Date(selectedCase.fecha_creacion), "d 'de' MMMM 'de' yyyy '-' h:mm aaa", { locale: es })}</p>
                                            </div>
                                            <div className="case-item">
                                                <p className="label">Fecha de Cierre:</p>
                                                <p>{format(new Date(selectedCase.fecha_cierre), "d 'de' MMMM 'de' yyyy '-' h:mm aaa", { locale: es })}</p>
                                            </div>
                                            <div className="case-item">
                                                <p className="label">Fecha de Cierre Estimada:</p>
                                                <p>{format(new Date(selectedCase.fecha_cierre_estimada), "d 'de' MMMM 'de' yyyy '-' h:mm aaa", { locale: es })}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="case-item-container" style={{ padding: '20px' }}>
                                        <div className="case-item-header" style={{ marginBottom: '5px'}}>
                                            <i className="bi bi-clock"></i>
                                            <p style={{ fontWeight: 650, }}>Estado en el tiempo</p>
                                        </div>
                                        <div className="case-item-body">
                                            <div className="case-item">
                                                <p className="label">Días restantes:</p>
                                                <span className="case-status-badge" style={{ backgroundColor: '#f8f8f8' }}>
                                                    <p
                                                        style={{
                                                            color: daysLeft(new Date(selectedCase.fecha_cierre_estimada)) >= 0
                                                                ? "#0F7E5E"  // Green for positive (or zero) days
                                                                : "#FF8A05"  // Orange for negative days
                                                            , fontWeight: 700
                                                        }}
                                                    >
                                                        {daysLeft(new Date(selectedCase.fecha_cierre_estimada))} días
                                                    </p>
                                                </span>
                                            </div>
                                            <div className="case-item">
                                                <p className="label">Última actualización:</p>
                                                <p>{format(new Date(selectedCase.ultima_actualizacion), "d 'de' MMMM 'de' yyyy '-' h:mm aaa", { locale: es })}</p>
                                            </div>
                                        </div>
                                    </div>
                                    {selectedCase.abierto && (
                                        <>
                                            {daysLeft(new Date(selectedCase.fecha_cierre_estimada)) >= 0 ? (
                                                <div className="case-status-box">
                                                    <i className="bi bi-check-circle"></i>
                                                    <div>
                                                        <strong className="status-title">Caso en tiempo</strong>
                                                        <p className="status-description">Este caso está progresando según lo programado.</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="case-status-box closed">
                                                    <i className="bi bi-check-circle"></i>
                                                    <div>
                                                        <strong className="status-title">Caso atrasado</strong>
                                                        <p className="status-description">Este caso está atrasado en base a la fecha de cierre estimada.</p>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                    <div className="case-tasks">
                                        {selectedCase && (
                                            <CaseTasks selectedCase={selectedCase}/>
                                        )}
                                    </div>
                                    <div className="case-activities">
                                        {selectedCase && (
                                            <ActivityLog activities={caseActivities} setActivities={setCaseActivities} entity_type="case" entity_id={selectedCase?.id_caso.toString()}/>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.p 
                            key="empty-selection"
                            className="text-muted text-center"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            Seleccione un caso para ver más detalles...
                        </motion.p>
                    )}
                </AnimatePresence>

                {/* PDF Preview Modal */}
                <AnimatePresence>
                    {previewBlobUrl && (
                        <motion.div
                            className="modal-overlay"
                            style={{
                                position: 'fixed',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 1000,
                                padding: '20px'
                            }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => {
                                if (previewBlobUrl) URL.revokeObjectURL(previewBlobUrl);
                                setPreviewBlobUrl(null);
                            }}
                        >
                            <motion.div
                                className="modal-content"
                                style={{
                                    backgroundColor: 'white',
                                    borderRadius: '12px',
                                    width: '90%',
                                    maxWidth: '900px',
                                    height: '85vh',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)'
                                }}
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '20px',
                                    borderBottom: '1px solid #e0e0e0'
                                }}>
                                    <h3 style={{ margin: 0 }}>Vista Previa del PDF</h3>
                                    <button
                                        onClick={() => {
                                            if (previewBlobUrl) URL.revokeObjectURL(previewBlobUrl);
                                            setPreviewBlobUrl(null);
                                        }}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            fontSize: '24px',
                                            cursor: 'pointer',
                                            color: '#666'
                                        }}
                                    >
                                        ✕
                                    </button>
                                </div>
                                <div style={{
                                    flex: 1,
                                    overflow: 'auto',
                                    padding: '20px'
                                }}>
                                    <iframe
                                        src={previewBlobUrl}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            border: 'none',
                                            borderRadius: '8px'
                                        }}
                                        title="PDF Preview"
                                    />
                                </div>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'flex-end',
                                    gap: '10px',
                                    padding: '20px',
                                    borderTop: '1px solid #e0e0e0'
                                }}>
                                    <button
                                        onClick={() => {
                                            if (previewBlobUrl) URL.revokeObjectURL(previewBlobUrl);
                                            setPreviewBlobUrl(null);
                                        }}
                                        className="btn btn-secondary"
                                        style={{
                                            borderRadius: '8px',
                                            padding: '8px 16px'
                                        }}
                                    >
                                        Cerrar
                                    </button>
                                    <motion.button
                                        onClick={exportCaseToPDF}
                                        disabled={exporting}
                                        className="btn btn-warning"
                                        style={{
                                            borderRadius: '8px',
                                            padding: '8px 16px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}
                                        whileHover={{ scale: exporting ? 1 : 1.02 }}
                                        whileTap={{ scale: exporting ? 1 : 0.98 }}
                                    >
                                        {exporting ? (
                                            <>
                                                <Spinner className="spinner-border-sm" />
                                                Exportando...
                                            </>
                                        ) : (
                                            <>
                                                <i className="bi bi-file-earmark-pdf"></i>
                                                Descargar PDF
                                            </>
                                        )}
                                    </motion.button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
        </motion.div>
    );
}
