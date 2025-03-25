import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "react-toastify";
import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import { Caso } from "../../../../../types/workflowTypes";
import { daysLeft } from "../../../../../utils/formatUtils";
import { Activity } from "../../../../../types/activityTypes";
import { Spinner } from "../../../../../components/ui/Spinner";
import { formatNumber } from "../../../../../utils/formatUtils";
import { lowerColorOpacity } from "../../../../../utils/formatUtils";
import { ActivityLog } from "../../../../../components/ui/ActivityLog";
import { WorkflowKanbanProps } from "../../../../../types/kanbanBoardTypes"
import { fetchProcessCases } from "../../../../../controllers/caseControllers";
import { fetchEntityActivities } from "../../../../../controllers/activityControllers";

export function CaseList({ process }: WorkflowKanbanProps) {
    // Local states
    const [loading, setLoading] = useState(true);
    const [cases, setCases] = useState<Caso[]>([]);
    const [caseQty, setCaseQty] = useState(0);
    const [selectedCase, setSelectedCase] = useState<Caso | null>(null);
    const [caseActivities, setCaseActivities] = useState<Activity[]>([]);
    const [searchParams, setSearchParams] = useSearchParams();
    // const [nextPaginationUrl, setNextPaginationUrl] = useState('');

    // collect active case from URL search params
    useEffect(() => {
        const caseFromUrl = searchParams.get("selected_case");
        if (caseFromUrl) {
            const caseObj = cases.find((caseObj) => caseObj.id_caso === parseInt(caseFromUrl));
            setSelectedCase(caseObj || null);
        }
    }, [searchParams, cases]);

    // Load cases on component mount
    useEffect(() => {
        const loadCases = async () => {
            try {
                if (process.id_proceso) {
                    const response = await fetchProcessCases(process.id_proceso);

                    setCaseQty(response.count);
                    setCases(response.results);
                    // setNextPaginationUrl(response.next);
                }
            } catch {
                console.log("Error loading cases...");
                toast.error("Ha ocurrido un error al cargar los casos, por favor, intente más tarde...");
            }
        }
        
        loadCases();
        setLoading(false);
    }, [process]);

    // Load activities on case selection
    useEffect(() => {
        const loadCaseActivities = async () => {
            try {
                // Parse int to str
                const caseId = selectedCase?.id_caso.toString();
                const activities = await fetchEntityActivities('case', caseId as string );
                setCaseActivities(activities);
            } catch (error) {
                console.error("Error fetching case activities:", error);
                toast.error("Ha ocurrido un error al cargar las actividades del caso, por favor, intente más tarde...");
            }
        }

        if (selectedCase) {
            setLoading(true);
            loadCaseActivities();
            setLoading(false);
        }
    }, [selectedCase]);

    if (loading) {
        return (
            <Spinner className="spinner-border-lg" />
        )
    }

    return (
        <div className="case-list-container">
            <div className="case-list-sidepanel">
                <div className="case-list-sidepanel-search-controls">
                    <input
                        style={{ marginBottom: "15px" }}
                        type="text"
                        name="first_name"
                        className="form-control"
                        id="first_name"
                        // value={formData.first_name}
                        // onChange={handleChange}
                        placeholder="Filtrar por nombre..."
                        required
                    />
                </div>
                <div className="case-list-container-cases">
                    <p className="case-list-title text-muted">{caseQty} casos encontrados</p>
                    {cases.length > 0 ? (
                        cases.map((caseObj: Caso) => (
                            <div key={caseObj.id_caso} className="kanban-task" onClick={() => {
                                searchParams.set("selected_case", caseObj.id_caso.toString()); // update the case
                                setSearchParams(searchParams);
                            }}>
                                <h4 className="case-title">{caseObj.nombre_caso}</h4>

                                <div className="case-contact-information">
                                    <i className="bi bi-person"></i>
                                    <p>{caseObj.contact_first_name}</p>
                                    <p>{caseObj.contact_last_name}</p>
                                </div>

                                <div className="case-dates">
                                    <div className="case-date">
                                        <div className="date-item">
                                            <i className="bi bi-calendar"></i>
                                            <p className="date-label">Creado:</p>
                                        </div>
                                        <p className="item-value">{format(new Date(caseObj.fecha_creacion), "PPP", { locale: es })}</p>
                                    </div>
                                    <div className="case-date">
                                        <div className="date-item">
                                            <i className="bi bi-clock"></i>
                                            <p className="date-label">Fecha de cierre:</p>
                                        </div>
                                        <p className="item-value">{format(new Date(caseObj.fecha_cierre), "PPP", { locale: es })}</p>
                                    </div>
                                </div>

                                <div className="case-dates" style={{ justifyContent: "space-between", gap: "unset", textAlign: "right" }}>
                                    <div className="case-date">
                                        <div className="date-item">
                                            <i className="bi bi-currency-dollar"></i>
                                            <p>Valor:</p>
                                        </div>
                                        <p className="item-value">RD$ {formatNumber(parseFloat(caseObj.valor_caso))}</p>
                                    </div>
                                    <div className="case-date">
                                        <div className="date-item">
                                            <i className="bi bi-clock"></i>
                                            <p>Tiempo Restante:</p>
                                        </div>
                                        <p
                                            className="item-value"
                                            style={{
                                                color: daysLeft(new Date(caseObj.fecha_cierre_estimada)) >= 0
                                                    ? "#0F7E5E"  // Green for positive (or zero) days
                                                    : "#FF8A05"  // Orange for negative days
                                            }}
                                        >
                                            {daysLeft(new Date(caseObj.fecha_cierre_estimada))} días
                                        </p>
                                    </div>
                                </div>

                                {caseObj.abierto ? (
                                    <span className="case-status-badge case-open">Abierto</span>
                                ) : (
                                    <span className="case-status-badge case-closed">Cerrado</span>
                                )}
                            </div>
                        ))
                    ) : (
                        <p className="text-muted text-center">No hay casos disponibles en el sistema.</p>
                    )}
                </div>
            </div>
            <motion.div
                className="selected-case-container"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
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
                                    <div className="case-activities">
                                        <ActivityLog activities={caseActivities} />
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
        </div>
    )
}