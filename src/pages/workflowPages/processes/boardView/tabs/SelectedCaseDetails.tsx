import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { CaseTasks } from "./CaseTasks";
import { CaseAttatchments } from "./CaseAttatchments";
import { CaseContacts } from "./CaseContacts";
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
import { useAuthStore } from "../../../../../stores/authStore";

interface Attachment {
    id_adjunto: number;
    archivo: string;
    archivo_url: string;
    fecha_creacion: string;
    subido_por: string;
}

interface Document {
    id: string;
    name: string;
    url: string;
    type: 'pdf' | 'attachment';
    uploadedBy?: string;
    uploadedDate?: string;
}

interface SelectedCaseDetailsProps {
    selectedCase: Caso;
    process: Proceso;
    caseActivities: Activity[];
    setCaseActivities: React.Dispatch<React.SetStateAction<Activity[]>>;
}

export function SelectedCaseDetails({ selectedCase, process, caseActivities, setCaseActivities }: SelectedCaseDetailsProps) {
    const BASE_URL = import.meta.env.VITE_VERCEL_REACT_APP_DJANGO_API_URL;
    const authStore = useAuthStore();
    const accessToken = authStore.accessToken;

    const [exporting, setExporting] = useState(false);
    const [exportingZip, setExportingZip] = useState(false);
    const [previewing, setPreviewing] = useState(false);
    const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [selectedDocumentId, setSelectedDocumentId] = useState<string>('case-pdf');
    const [loadingAttachments, setLoadingAttachments] = useState(false);

    // Fetch attachments
    useEffect(() => {
        const fetchAttachments = async () => {
            setLoadingAttachments(true);
            try {
                const res = await axios.get(
                    `${BASE_URL}/workflows/casos/manage/attachments/${selectedCase.id_caso}/`,
                    { headers: { Authorization: `Bearer ${accessToken}` } }
                );
                setAttachments(res.data);
            } catch {
                console.error("Error fetching attachments");
            }
            setLoadingAttachments(false);
        };

        if (selectedCase.id_caso) {
            fetchAttachments();
        }
    }, [selectedCase.id_caso, BASE_URL, accessToken]);

    // Update documents list when attachments change
    useEffect(() => {
        const newDocuments: Document[] = [
            {
                id: 'case-pdf',
                name: `Caso ${String(selectedCase.id_caso).padStart(7, '0')}`,
                url: '',
                type: 'pdf'
            }
        ];

        attachments.forEach((att) => {
            newDocuments.push({
                id: `att-${att.id_adjunto}`,
                name: att.archivo,
                url: att.archivo_url,
                type: 'attachment',
                uploadedBy: att.subido_por,
                uploadedDate: att.fecha_creacion
            });
        });

        setDocuments(newDocuments);
    }, [attachments, selectedCase.id_caso]);

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
            ...(selectedCase.valor_aprobado ? [['Valor Aprobado', `RD$ ${formatNumber(parseFloat(selectedCase.valor_aprobado))}`]] : []),
            ...(selectedCase.valor_final ? [['Valor Final', `RD$ ${formatNumber(parseFloat(selectedCase.valor_final))}`]] : []),
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
            setSelectedDocumentId('case-pdf');
        } catch (error) {
            console.error("Error generating PDF preview:", error);
            toast.error("Error al generar la vista previa del PDF");
        } finally {
            setPreviewing(false);
        }
    };

    const handleDocumentSelect = (docId: string) => {
        setSelectedDocumentId(docId);
    };

    const getCurrentDocument = (): Document | null => {
        return documents.find(doc => doc.id === selectedDocumentId) || null;
    };

    const getPreviewUrl = (): string | null => {
        const doc = getCurrentDocument();
        if (!doc) return null;
        
        if (doc.type === 'pdf' && doc.id === 'case-pdf') {
            return previewBlobUrl;
        } else if (doc.type === 'attachment') {
            return doc.url;
        }
        return null;
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

    const exportCaseAsZip = async () => {
        if (!selectedCase) return;
        
        try {
            setExportingZip(true);
            console.log("Starting ZIP export for case:", selectedCase.id_caso);
            console.log("Attachments count:", attachments.length);
            console.log("Attachments data:", attachments);
            
            const zip = new JSZip();
            
            // Create a folder for the case
            const caseFolder = zip.folder(`caso_${String(selectedCase.id_caso).padStart(7, '0')}_${selectedCase.nombre_caso.replace(/[^a-z0-9]/gi, '_')}`);
            if (!caseFolder) throw new Error("Failed to create ZIP folder");
            
            // Add the case PDF
            try {
                const doc = generateCasePDF();
                const pdfBlob = doc.output('blob');
                caseFolder.file('Caso_Resumen.pdf', pdfBlob);
            } catch (error) {
                console.error("Error adding PDF to ZIP:", error);
                toast.warning("No se pudo incluir el PDF en el ZIP");
            }
            
            // Add attachments
            if (attachments && attachments.length > 0) {
                const attachmentsFolder = caseFolder.folder('Documentos_Adjuntos');
                if (!attachmentsFolder) throw new Error("Failed to create attachments folder");
                
                let successCount = 0;
                for (const attachment of attachments) {
                    try {
                        console.log("Attempting to download attachment:", attachment.id_adjunto, attachment.archivo);
                        
                        // Use the archivo_url directly (S3 pre-signed URL, no auth needed)
                        const downloadUrl = attachment.archivo_url;
                        
                        console.log("Download URL:", downloadUrl);
                        
                        const response = await axios.get(downloadUrl, {
                            responseType: 'blob',
                            timeout: 30000
                        });
                        
                        if (response.status === 200 && response.data && response.data.size > 0) {
                            attachmentsFolder.file(attachment.archivo, response.data);
                            successCount++;
                            console.log(`✓ Successfully added ${attachment.archivo} (${response.data.size} bytes)`);
                        } else {
                            console.warn(`✗ Empty or invalid response for ${attachment.archivo}`);
                        }
                    } catch (error) {
                        console.error(`✗ Error downloading ${attachment.archivo}:`, error);
                    }
                }
                
                console.log(`Downloaded ${successCount} out of ${attachments.length} attachments`);
                if (successCount === 0) {
                    toast.warning(`No se pudieron descargar los documentos adjuntos`);
                } else if (successCount < attachments.length) {
                    toast.warning(`Se descargaron ${successCount} de ${attachments.length} documentos`);
                }
            } else {
                console.log("No attachments to download");
            }
            
            // Add case metadata as formatted text file
            const metadataText = `
================================================================================
                        INFORMACIÓN DEL CASO
================================================================================

IDENTIFICACIÓN
--------------
ID del Caso:                ${String(selectedCase.id_caso).padStart(7, '0')}
Nombre del Caso:            ${selectedCase.nombre_caso}


ESTADO Y ETAPA
--------------
Estado:                     ${selectedCase.abierto ? "Abierto" : "Cerrado"}
Etapa Actual:               ${process.etapas.find((step) => step.id_etapa === selectedCase.etapa_actual)?.nombre_etapa || "N/A"}


INFORMACIÓN DE CONTACTO
-----------------------
Principal Solicitante:      ${selectedCase.contact_first_name} ${selectedCase.contact_last_name}


VALORES FINANCIEROS
-------------------
Valor del Caso:             RD$ ${formatNumber(parseFloat(selectedCase.valor_caso))}
${selectedCase.valor_aprobado ? `Valor Aprobado:             RD$ ${formatNumber(parseFloat(selectedCase.valor_aprobado))}\n` : ''}${selectedCase.valor_final ? `Valor Final:                RD$ ${formatNumber(parseFloat(selectedCase.valor_final))}\n` : ''}

FECHAS IMPORTANTES
------------------
Fecha de Creación:          ${format(new Date(selectedCase.fecha_creacion), "d 'de' MMMM 'de' yyyy 'a las' h:mm aaa", { locale: es })}
Fecha de Cierre Estimada:   ${format(new Date(selectedCase.fecha_cierre_estimada), "d 'de' MMMM 'de' yyyy 'a las' h:mm aaa", { locale: es })}
Fecha de Cierre:            ${format(new Date(selectedCase.fecha_cierre), "d 'de' MMMM 'de' yyyy 'a las' h:mm aaa", { locale: es })}
Última Actualización:       ${format(new Date(selectedCase.ultima_actualizacion), "d 'de' MMMM 'de' yyyy 'a las' h:mm aaa", { locale: es })}


DESCRIPCIÓN
-----------
${selectedCase.descripcion_caso}


DOCUMENTACIÓN
-------------
Total de Documentos Adjuntos: ${attachments.length}


================================================================================
Generado: ${format(new Date(), "d 'de' MMMM 'de' yyyy 'a las' h:mm aaa", { locale: es })}
================================================================================
            `.trim();
            
            caseFolder.file('Información_Caso.txt', metadataText);
            
            // Generate and download ZIP
            console.log("Generating ZIP file...");
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            const zipFileName = `caso_${String(selectedCase.id_caso).padStart(7, '0')}_${selectedCase.nombre_caso.replace(/[^a-z0-9]/gi, '_')}_${new Date().getTime()}.zip`;
            saveAs(zipBlob, zipFileName);
            
            console.log("ZIP export completed successfully");
            toast.success("Caso exportado como ZIP correctamente");
            
        } catch (error) {
            console.error("Error exporting case as ZIP:", error);
            toast.error("Error al exportar el caso como ZIP");
        } finally {
            setExportingZip(false);
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
                                        <span className={`case-status-badge ${selectedCase.exitoso ? "case-success" : "case-failed"}`}>
                                            {selectedCase.exitoso ? "Exitoso" : "No exitoso"}
                                        </span>
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
                                        <motion.button
                                            className="btn btn-outline-success"
                                            style={{
                                                borderRadius: "8px",
                                                padding: "8px 16px",
                                                fontSize: "0.875rem",
                                                fontWeight: 500,
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "8px"
                                            }}
                                            whileHover={{ scale: exportingZip ? 1 : 1.02 }}
                                            whileTap={{ scale: exportingZip ? 1 : 0.98 }}
                                            onClick={exportCaseAsZip}
                                            disabled={exportingZip}
                                            title="Exporta el caso con todos sus documentos como ZIP"
                                        >
                                            {exportingZip ? (
                                                <>
                                                    <Spinner className="spinner-border-sm" />
                                                    Exportando...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="bi bi-file-earmark-zip"></i>
                                                    Exportar ZIP
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
                                        {selectedCase.valor_aprobado && (
                                            <div className="case-item-container">
                                                <div className="case-item-header">
                                                    <i className="bi bi-check-circle"></i>
                                                    <p>Valor Aprobado:</p>
                                                </div>
                                                <div className="case-item-body">
                                                    <p style={{ fontWeight: 700, fontSize: "1.5rem" }}>RD$ {formatNumber(parseFloat(selectedCase.valor_aprobado))}</p>
                                                </div>
                                            </div>
                                        )}
                                        {selectedCase.valor_final && (
                                            <div className="case-item-container">
                                                <div className="case-item-header">
                                                    <i className="bi bi-flag-fill"></i>
                                                    <p>Valor Final:</p>
                                                </div>
                                                <div className="case-item-body">
                                                    <p style={{ fontWeight: 700, fontSize: "1.5rem" }}>RD$ {formatNumber(parseFloat(selectedCase.valor_final))}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="case-stage-box" style={{ color: process.color, backgroundColor: lowerColorOpacity(process.color, 0.05), borderColor: lowerColorOpacity(process.color, 0.15), marginBottom: '20px' }}>
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
                                    <Link 
                                        to={`/contacts/details/${selectedCase.contact}`} 
                                        style={{ textDecoration: 'none', color: 'inherit' }} 
                                    >
                                        <div className="case-contact-box">
                                                <i className="bi bi-file-person" style={{ fontSize: '30px' }}></i>
                                                <div>
                                                    <strong className="status-title">Principal Solicitante</strong>
                                                    <p className="status-description">{selectedCase.contact_first_name} {selectedCase.contact_last_name}</p>
                                                </div>
                                        </div>
                                    </Link>
                                    <div className="case-contacts">
                                        {selectedCase && (
                                            <CaseContacts caseId={selectedCase.id_caso} mainContactId={selectedCase.contact}/>
                                        )}
                                    </div>
                                    <div className="case-forms">
                                        {selectedCase && (
                                            <CaseFormsList caseId={selectedCase.id_caso} workflowId={process.id_proceso}/>
                                        )}
                                    </div>
                                    <div className="case-attachments">
                                        {selectedCase && (
                                            <CaseAttatchments caseId={selectedCase.id_caso}/>
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

                {/* Document Hub Preview Modal */}
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
                                    width: '95%',
                                    maxWidth: '1100px',
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
                                    <h3 style={{ margin: 0 }}>Centro de Documentos</h3>
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

                                {/* Document Tabs */}
                                <div style={{
                                    display: 'flex',
                                    overflowX: 'auto',
                                    borderBottom: '1px solid #e0e0e0',
                                    padding: '0 20px',
                                    gap: '5px',
                                    backgroundColor: '#f8f9fa'
                                }}>
                                    {documents.map((doc) => (
                                        <button
                                            key={doc.id}
                                            onClick={() => handleDocumentSelect(doc.id)}
                                            style={{
                                                padding: '12px 16px',
                                                border: 'none',
                                                background: selectedDocumentId === doc.id ? 'white' : 'transparent',
                                                borderBottom: selectedDocumentId === doc.id ? '3px solid #0d6efd' : 'none',
                                                cursor: 'pointer',
                                                fontWeight: selectedDocumentId === doc.id ? 600 : 400,
                                                color: selectedDocumentId === doc.id ? '#0d6efd' : '#666',
                                                fontSize: '0.9rem',
                                                whiteSpace: 'nowrap',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            <i className={`bi ${doc.type === 'pdf' ? 'bi-file-earmark-pdf' : 'bi-file-earmark'}`} style={{ marginRight: '6px' }}></i>
                                            {doc.name}
                                        </button>
                                    ))}
                                </div>

                                {/* Document Info */}
                                {getCurrentDocument() && getCurrentDocument()?.type === 'attachment' && (
                                    <div style={{
                                        padding: '12px 20px',
                                        backgroundColor: '#f0f8ff',
                                        borderBottom: '1px solid #dde3f0',
                                        fontSize: '0.85rem',
                                        color: '#555'
                                    }}>
                                        Subido por: <strong>{getCurrentDocument()?.uploadedBy}</strong> • 
                                        {getCurrentDocument()?.uploadedDate && (
                                            <> {format(new Date(getCurrentDocument()!.uploadedDate!), "d 'de' MMMM 'de' yyyy 'a las' h:mm aaa", { locale: es })}</>
                                        )}
                                    </div>
                                )}

                                {/* Document Viewer */}
                                <div style={{
                                    flex: 1,
                                    overflow: 'auto',
                                    padding: '20px',
                                    backgroundColor: '#f5f5f5'
                                }}>
                                    {loadingAttachments ? (
                                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                                            <Spinner />
                                        </div>
                                    ) : getPreviewUrl() ? (
                                        <iframe
                                            src={getPreviewUrl()!}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                border: 'none',
                                                borderRadius: '8px',
                                                backgroundColor: 'white'
                                            }}
                                            title="Document Preview"
                                        />
                                    ) : (
                                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#999' }}>
                                            No se puede mostrar vista previa
                                        </div>
                                    )}
                                </div>

                                {/* Modal Footer */}
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'flex-end',
                                    gap: '10px',
                                    padding: '20px',
                                    borderTop: '1px solid #e0e0e0',
                                    backgroundColor: '#f8f9fa'
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
                                    {getCurrentDocument()?.type === 'pdf' && getCurrentDocument()?.id === 'case-pdf' && (
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
                                                    <i className="bi bi-download"></i>
                                                    Descargar PDF
                                                </>
                                            )}
                                        </motion.button>
                                    )}
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
        </motion.div>
    );
}
