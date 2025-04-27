import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { daysLeft } from "../../../../../utils/formatUtils";
import { Activity } from "../../../../../types/activityTypes";
import { formatNumber } from "../../../../../utils/formatUtils";
import { Caso, Proceso } from "../../../../../types/workflowTypes";
import { lowerColorOpacity } from "../../../../../utils/formatUtils";
import { ActivityLog } from "../../../../../components/ui/ActivityLog";

interface SelectedCaseDetailsProps {
    selectedCase: Caso;
    process: Proceso;
    caseActivities: Activity[];
    setCaseActivities: React.Dispatch<React.SetStateAction<Activity[]>>;
}

export function SelectedCaseDetails({ selectedCase, process, caseActivities, setCaseActivities }: SelectedCaseDetailsProps) {
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
                                    <Link to={`/workflows/cases/update/${selectedCase.id_caso}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                        <button
                                            className="btn btn-primary"
                                            style={{ marginBottom: '20px', marginTop: '0px' }}
                                        >
                                            Editar
                                        </button>
                                    </Link>
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
                                    <div className="case-notes-container">
                                        {/* TODO: Case notes are not functional yet */}
                                        <div className="case-item-container">
                                            <div className="case-item-header">
                                                <i className="bi bi-chat-right-dots"></i>
                                                <p>Notas y Comentarios</p>
                                            </div>
                                            <div className="case-item-body">
                                                <textarea
                                                    className="form-control"
                                                    placeholder="Escribe una nota o comentario..."
                                                    style={{ marginBottom: '10px' }}
                                                ></textarea>
                                            </div>
                                        </div>
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
        </motion.div>
    );
}
