import { format } from "date-fns";
import Select from "react-select";
import AsyncSelect from "react-select/async";
import { es } from "date-fns/locale";
import { toast } from "react-toastify";
import api from "../../../../../controllers/api";
import { useEffect, useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import { Caso, Proceso } from "../../../../../types/workflowTypes";
import { daysLeft } from "../../../../../utils/formatUtils";
import { SelectedCaseDetails } from "./SelectedCaseDetails";
import { Activity } from "../../../../../types/activityTypes";
import { Spinner } from "../../../../../components/ui/Spinner";
import { formatNumber } from "../../../../../utils/formatUtils";
import { WorkflowKanbanProps } from "../../../../../types/kanbanBoardTypes"
import { AnimatedSelectMenu } from "../../../../../components/ui/forms/AnimatedSelectMenu";
import { bulkAssignCases } from "../../../../../controllers/caseControllers";
import { fetchProcesses } from "../../../../../controllers/workflowControllers";

export function CaseList({ process }: WorkflowKanbanProps) {
    // Local states
    const [loading, setLoading] = useState(true);
    const [cases, setCases] = useState<Caso[]>([]);
    const [caseQty, setCaseQty] = useState(0);
    const [selectedCase, setSelectedCase] = useState<Caso | null>(null);
    const [caseActivities, setCaseActivities] = useState<Activity[]>([]);
    const [searchParams, setSearchParams] = useSearchParams();
    const [nextPaginationUrl, setNextPaginationUrl] = useState<string | null>(null);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const casesContainerRef = useRef<HTMLDivElement>(null);
    const [caseStatusFilter, setCaseStatusFilter] = useState<string>("");
    const [stageIdFilter, setStageIdFilter] = useState<string>("");
    const [caseNameFilter, setCaseNameFilter] = useState<string>("");
    const [cedulaFilter, setCedulaFilter] = useState<string>("");
    const [isCompactLayout, setIsCompactLayout] = useState(false);
    const [isSidebarMinimized, setIsSidebarMinimized] = useState(false);
    const [archiveFilter, setArchiveFilter] = useState('');
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Bulk assignment states
    const [selectedCaseIds, setSelectedCaseIds] = useState<Set<number>>(new Set());
    const [showBulkAssignmentModal, setShowBulkAssignmentModal] = useState(false);
    const [allProcesses, setAllProcesses] = useState<Proceso[]>([]);
    const [bulkAssignmentFormData, setBulkAssignmentFormData] = useState({
        process_id: "",
        stage_id: "",
        change_motive: "",
        assignee_id: ""
    });
    const [selectedAssignee, setSelectedAssignee] = useState<any>(null);
    const [isSubmittingBulkAssignment, setIsSubmittingBulkAssignment] = useState(false);
    const [isExportingCases, setIsExportingCases] = useState(false);

    // collect active case from URL search params
    useEffect(() => {
        const caseFromUrl = searchParams.get("selected_case");
        if (caseFromUrl) {
            const caseObj = cases.find((caseObj) => caseObj.id_caso === parseInt(caseFromUrl));
            setSelectedCase(caseObj || null);
        }
    }, [searchParams, cases]);

    // Load cases with debounce on filters change
    useEffect(() => {
        if (!process.id_proceso) return;

        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }

        debounceTimer.current = setTimeout(async () => {
            try {
                setLoading(true);

                const params: Record<string, string> = {
                    process_id: process.id_proceso.toString(),
                };
                if (caseStatusFilter) params.case_status = caseStatusFilter;
                if (stageIdFilter) params.stage_id = stageIdFilter;
                if (caseNameFilter) params.case_name = caseNameFilter;
                if (cedulaFilter) params.cedula = cedulaFilter;
                if (archiveFilter === 'include-archived') params.include_archived = "true";
                if (archiveFilter === 'archived-only') params.archived_only = "true";

                const queryString = new URLSearchParams(params).toString();
                const response = await api.get(`/workflows/casos/list/?${queryString}`);

                setCaseQty(response.data.count);
                setCases(response.data.results);
                setNextPaginationUrl(response.data.next);
            } catch (error) {
                console.error("Error loading cases:", error);
                toast.error("Ha ocurrido un error al cargar los casos, por favor, intente más tarde...");
            } finally {
                setLoading(false);
            }
        }, 500);

        return () => {
            if (debounceTimer.current) clearTimeout(debounceTimer.current);
        };
    }, [process.id_proceso, caseStatusFilter, stageIdFilter, caseNameFilter, cedulaFilter, archiveFilter]);

    // Infinite scroll observer
    useEffect(() => {
        const loadMoreCases = async () => {
            if (!nextPaginationUrl) return;

            try {
                setIsFetchingMore(true);
                const response = await fetchMoreCases(nextPaginationUrl);

                if (response) {
                    setCases(prev => [...prev, ...response.results]);
                    setNextPaginationUrl(response.next);
                }
            } catch {
                console.error("Error loading more cases...");
            } finally {
                setIsFetchingMore(false);
            }
        };

        const handleScroll = () => {
            if (!casesContainerRef.current || !nextPaginationUrl || isFetchingMore) return;

            const { scrollTop, scrollHeight, clientHeight } = casesContainerRef.current;

            if (scrollTop + clientHeight >= scrollHeight - 50) { // 50px of threshold
                loadMoreCases();
            }
        };

        const container = casesContainerRef.current;
        if (container) {
            container.addEventListener("scroll", handleScroll);
        }

        return () => {
            if (container) {
                container.removeEventListener("scroll", handleScroll);
            }
        };
    }, [nextPaginationUrl, isFetchingMore]);


    async function fetchMoreCases(url: string) {
        try {
            const response = await api.get(url);
            return response.data;
        } catch (error) {
            console.error("Error fetching more cases:", error);
            return null;
        }
    }

    async function refetchCases() {
        try {
            setLoading(true);
            const params: Record<string, string> = {
                process_id: process.id_proceso.toString(),
            };
            if (caseStatusFilter) params.case_status = caseStatusFilter;
            if (stageIdFilter) params.stage_id = stageIdFilter;
            if (caseNameFilter) params.case_name = caseNameFilter;
            if (cedulaFilter) params.cedula = cedulaFilter;

            const queryString = new URLSearchParams(params).toString();
            const response = await api.get(`/workflows/casos/list/?${queryString}`);

            setCaseQty(response.data.count);
            setCases(response.data.results);
            setNextPaginationUrl(response.data.next);
        } catch (error) {
            console.error("Error refetching cases:", error);
            toast.error("Error al refrescar la lista de casos");
        } finally {
            setLoading(false);
        }
    }

    // Load activities on case selection
    useEffect(() => {
        if (selectedCase) {
            setLoading(true);
            setLoading(false);
        }
    }, [selectedCase]);

    // Fetch all processes when bulk assignment modal opens
    useEffect(() => {
        if (showBulkAssignmentModal && allProcesses.length === 0) {
            const loadProcesses = async () => {
                try {
                    const processes = await fetchProcesses();
                    setAllProcesses(processes);
                } catch (error) {
                    console.error("Error fetching processes:", error);
                    toast.error("Error al cargar los procesos");
                }
            };
            loadProcesses();
        }
    }, [showBulkAssignmentModal]);

    const handleCaseSelection = (caseId: number) => {
        const newSelectedIds = new Set(selectedCaseIds);
        if (newSelectedIds.has(caseId)) {
            newSelectedIds.delete(caseId);
        } else {
            newSelectedIds.add(caseId);
        }
        setSelectedCaseIds(newSelectedIds);
    };

    const handleBulkAssignmentSubmit = async () => {
        if (selectedCaseIds.size === 0) {
            toast.warning("Por favor selecciona al menos un caso");
            return;
        }

        if (!bulkAssignmentFormData.process_id || !bulkAssignmentFormData.stage_id) {
            toast.warning("Por favor selecciona un proceso y una etapa");
            return;
        }

        if (!bulkAssignmentFormData.change_motive.trim()) {
            toast.warning("Por favor indica el motivo del cambio");
            return;
        }

        setIsSubmittingBulkAssignment(true);
        try {
            await bulkAssignCases(
                Array.from(selectedCaseIds),
                parseInt(bulkAssignmentFormData.process_id.toString()),
                parseInt(bulkAssignmentFormData.stage_id.toString()),
                bulkAssignmentFormData.change_motive,
                selectedAssignee?.value ? parseInt(selectedAssignee.value) : undefined
            );

            toast.success(`${selectedCaseIds.size} casos reasignados correctamente`);
            setShowBulkAssignmentModal(false);
            setSelectedCaseIds(new Set());
            setSelectedAssignee(null);
            setBulkAssignmentFormData({
                process_id: "",
                stage_id: "",
                change_motive: "",
                assignee_id: ""
            });

            // Refresh the case list
            await refetchCases();
        } catch (error) {
            console.error("Error bulk assigning cases:", error);
            toast.error("Error al reasignar los casos");
        } finally {
            setIsSubmittingBulkAssignment(false);
        }
    };

    const exportSelectedCasesAsTxt = async () => {
        if (selectedCaseIds.size === 0) {
            toast.warning("Por favor selecciona al menos un caso");
            return;
        }

        try {
            setIsExportingCases(true);

            // Get all selected cases
            const selectedCases = cases.filter(c => selectedCaseIds.has(c.id_caso));
            
            if (selectedCases.length === 0) {
                toast.error("No se encontraron los casos seleccionados");
                return;
            }

            // Build the text content
            let textContent = `
================================================================================
                    EXPORTACIÓN DE CASOS
================================================================================

Proceso: ${process.nombre_proceso}
Fecha de Exportación: ${format(new Date(), "d 'de' MMMM 'de' yyyy 'a las' h:mm aaa", { locale: es })}
Total de Casos: ${selectedCases.length}

================================================================================
`;

            for (const caseObj of selectedCases) {
                const etapaActual = process.etapas.find((step) => step.id_etapa === caseObj.etapa_actual)?.nombre_etapa || "N/A";
                
                textContent += `

--------------------------------------------------------------------------------
CASO #${String(caseObj.id_caso).padStart(7, '0')} - ${caseObj.nombre_caso}
--------------------------------------------------------------------------------

INFORMACIÓN GENERAL
-------------------
Estado:                     ${caseObj.abierto ? "Abierto" : "Cerrado"}
Etapa Actual:               ${etapaActual}
Creado:                     ${format(new Date(caseObj.fecha_creacion), "d 'de' MMMM 'de' yyyy 'a las' h:mm aaa", { locale: es })}
Última Actualización:       ${format(new Date(caseObj.ultima_actualizacion), "d 'de' MMMM 'de' yyyy 'a las' h:mm aaa", { locale: es })}

CONTACTO PRINCIPAL
------------------
Nombre:                     ${caseObj.contact_first_name} ${caseObj.contact_last_name}

VALORES FINANCIEROS
-------------------
Valor del Caso:             RD$ ${formatNumber(parseFloat(caseObj.valor_caso))}
${caseObj.valor_aprobado ? `Valor Aprobado:             RD$ ${formatNumber(parseFloat(caseObj.valor_aprobado))}\n` : ''}${caseObj.valor_final ? `Valor Final:                RD$ ${formatNumber(parseFloat(caseObj.valor_final))}\n` : ''}

FECHAS IMPORTANTES
------------------
Fecha de Cierre:            ${format(new Date(caseObj.fecha_cierre), "d 'de' MMMM 'de' yyyy 'a las' h:mm aaa", { locale: es })}
Fecha de Cierre Estimada:   ${format(new Date(caseObj.fecha_cierre_estimada), "d 'de' MMMM 'de' yyyy 'a las' h:mm aaa", { locale: es })}
Días Restantes:             ${daysLeft(new Date(caseObj.fecha_cierre_estimada))} días

DESCRIPCIÓN
-----------
${caseObj.descripcion_caso || "(Sin descripción)"}
`;
            }

            textContent += `

================================================================================
Fin de Exportación
================================================================================
            `.trim();

            // Create and download the file
            const blob = new Blob([textContent], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `casos_exportados_${format(new Date(), "yyyy-MM-dd_HH-mm-ss")}.txt`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            // Report the export
            const caseIds = Array.from(selectedCaseIds);
            await api.post('workflows/casos/export/report/', {
                case_ids: caseIds
            });

            toast.success(`${selectedCases.length} caso(s) exportado(s) correctamente`);

        } catch (error) {
            console.error("Error exporting cases:", error);
            toast.error("Error al exportar los casos");
        } finally {
            setIsExportingCases(false);
        }
    };

    const loadUsers = async (inputValue: string) => {
        if (!inputValue) return [];
        try {
            const res = await api.get("/auth/users/list", {
                params: { name: inputValue }
            });
            return res.data.results.map((u: any) => ({
                value: u.id,
                label: `${u.first_name} ${u.last_name} (${u.email})`
            }));
        } catch {
            return [];
        }
    };

    const selectedProcess = bulkAssignmentFormData.process_id 
        ? allProcesses.find((p) => p.id_proceso === parseInt(bulkAssignmentFormData.process_id))
        : undefined;
    const selectedProcessStages = selectedProcess?.etapas || [];

    if (loading) {
        return (
            <Spinner className="spinner-border-lg" />
        )
    }

    return (
        <div className="case-list-container" style={{ display: "flex", height: "100%", gap: 0, position: "relative" }}>
            {/* Floating Button - Only visible when sidebar is minimized */}
            <AnimatePresence>
                {isSidebarMinimized && (
                    <motion.button
                        onClick={() => setIsSidebarMinimized(false)}
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -30 }}
                        transition={{ duration: 0.3 }}
                        style={{
                            zIndex: 9999,
                            height: "40px",
                            width: "40px",
                            padding: "0",
                            borderRadius: "8px",
                            border: "2px solid #0dcaf0",
                            backgroundColor: "rgba(13, 202, 240, 0.1)",
                            color: "#0dcaf0",
                            cursor: "pointer",
                            boxShadow: "0 4px 12px rgba(13, 202, 240, 0.2)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "1.3rem"
                        }}
                        whileHover={{ scale: 1.15, boxShadow: "0 6px 16px rgba(13, 202, 240, 0.3)", backgroundColor: "rgba(13, 202, 240, 0.15)" }}
                        whileTap={{ scale: 0.9 }}
                        title="Expandir panel de casos"
                    >
                        <i className="bi bi-chevron-right"></i>
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <motion.div
                className="case-list-sidepanel"
                initial={false}
                animate={{
                    width: isSidebarMinimized ? 0 : "420px",
                    opacity: isSidebarMinimized ? 0 : 1,
                    marginRight: isSidebarMinimized ? 0 : "0px"
                }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                style={{
                    overflow: "hidden",
                    flexShrink: 0
                }}
            >
                {/* Minimize Button - Inside sidebar, at the top */}
                <motion.button
                    onClick={() => setIsSidebarMinimized(true)}
                    style={{
                        width: "100%",
                        padding: "12px",
                        borderRadius: "0",
                        border: "none",
                        borderBottom: "1px solid #e0e0e0",
                        backgroundColor: "#f8f9fa",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-end",
                        gap: "8px",
                        fontSize: "0.85rem",
                        color: "#666",
                        marginBottom: "10px"
                    }}
                    whileHover={{ backgroundColor: "#efefef" }}
                    whileTap={{ scale: 0.98 }}
                    title="Minimizar panel de casos"
                >
                    Maximizar Caso
                    <i className="bi bi-chevron-left"></i>
                </motion.button>

                <div className="case-list-sidepanel-search-controls">
                    {/* Layout toggle button */}
                    <p style={{ fontSize: "0.75rem", color: "#6c757d", marginBottom: "8px", fontWeight: 600, textTransform: "uppercase" }}>
                        Modo de visualización
                    </p>
                    <div style={{ marginBottom: "15px", display: "flex", gap: "8px" }}>
                        <button
                            onClick={() => setIsCompactLayout(false)}
                            className={`btn ${!isCompactLayout ? "btn-primary" : "btn-outline-primary"}`}
                            style={{
                                flex: 1,
                                fontSize: "0.85rem",
                                padding: "6px 12px",
                                borderRadius: "6px"
                            }}
                        >
                            <i className="bi bi-list-ul"></i> Completo
                        </button>
                        <button
                            onClick={() => setIsCompactLayout(true)}
                            className={`btn ${isCompactLayout ? "btn-primary" : "btn-outline-primary"}`}
                            style={{
                                flex: 1,
                                fontSize: "0.85rem",
                                padding: "6px 12px",
                                borderRadius: "6px"
                            }}
                        >
                            <i className="bi bi-list"></i> Compacto
                        </button>
                    </div>

                    <p style={{ fontSize: "0.75rem", color: "#6c757d", marginBottom: "8px", fontWeight: 600, textTransform: "uppercase" }}>
                        Filtros
                    </p>

                    {/* Name input stays regular */}
                    <input
                        style={{ marginBottom: "15px" }}
                        type="text"
                        name="case_name"
                        className="form-control"
                        value={caseNameFilter}
                        onChange={(e) => setCaseNameFilter(e.target.value)}
                        placeholder="Filtrar por nombre..."
                    />

                    {/* Cedula input */}
                    <input
                        style={{ marginBottom: "15px" }}
                        type="text"
                        name="cedula"
                        className="form-control"
                        value={cedulaFilter}
                        onChange={(e) => setCedulaFilter(e.target.value)}
                        placeholder="Filtrar por cédula..."
                    />

                    {/* Status dropdown */}
                    <div style={{ marginBottom: "15px" }}>
                        <Select
                            options={[
                                { value: "", label: "Todos los estados" },
                                { value: "open", label: "Abiertos" },
                                { value: "closed", label: "Cerrados" }
                            ]}
                            value={
                                caseStatusFilter !== ""
                                    ? { value: caseStatusFilter, label: caseStatusFilter === "open" ? "Abiertos" : "Cerrados" }
                                    : { value: "", label: "Todos los estados" }
                            }
                            onChange={(opt) => setCaseStatusFilter((opt as { value: string })?.value ?? "")}
                            isClearable
                            components={{ Menu: AnimatedSelectMenu }}
                            menuPortalTarget={document.body}
                            styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                            placeholder="Filtrar por estado..."
                        />
                    </div>

                    {/* Stage dropdown */}
                    <div style={{ marginBottom: "15px" }}>
                        <Select
                            options={[
                                { value: "", label: "Todas las etapas" },
                                ...process.etapas.map((etapa) => ({
                                    value: etapa.id_etapa.toString(),
                                    label: etapa.nombre_etapa
                                }))
                            ]}
                            value={
                                stageIdFilter !== ""
                                    ? process.etapas
                                        .map(etapa => ({ value: etapa.id_etapa.toString(), label: etapa.nombre_etapa }))
                                        .find(opt => opt.value === stageIdFilter) || null
                                    : { value: "", label: "Todas las etapas" }
                            }
                            onChange={(opt) => setStageIdFilter((opt as { value: string })?.value ?? "")}
                            isClearable
                            components={{ Menu: AnimatedSelectMenu }}
                            menuPortalTarget={document.body}
                            styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                            placeholder="Filtrar por etapa..."
                        />
                    </div>

                    {/* Archive filter radio buttons */}
                    <div style={{ marginBottom: "15px" }}>
                        <p style={{ fontSize: "0.75rem", color: "#6c757d", marginBottom: "8px", fontWeight: 600, textTransform: "uppercase" }}>
                            <i className="bi bi-archive" style={{ marginRight: "6px" }}></i>
                            Filtro de Archivados
                        </p>
                        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="radio"
                                    name="archiveFilter"
                                    id="archiveFilterNone"
                                    value=""
                                    checked={archiveFilter === ''}
                                    onChange={() => setArchiveFilter('')}
                                />
                                <label className="form-check-label" htmlFor="archiveFilterNone" style={{ cursor: 'pointer', marginLeft: "6px", userSelect: 'none' }}>
                                    Solo activos
                                </label>
                            </div>
                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="radio"
                                    name="archiveFilter"
                                    id="archiveFilterInclude"
                                    value="include-archived"
                                    checked={archiveFilter === 'include-archived'}
                                    onChange={() => setArchiveFilter('include-archived')}
                                />
                                <label className="form-check-label" htmlFor="archiveFilterInclude" style={{ cursor: 'pointer', marginLeft: "6px", userSelect: 'none' }}>
                                    Incluir archivados
                                </label>
                            </div>
                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="radio"
                                    name="archiveFilter"
                                    id="archiveFilterOnly"
                                    value="archived-only"
                                    checked={archiveFilter === 'archived-only'}
                                    onChange={() => setArchiveFilter('archived-only')}
                                />
                                <label className="form-check-label" htmlFor="archiveFilterOnly" style={{ cursor: 'pointer', marginLeft: "6px", userSelect: 'none' }}>
                                    Solo archivados
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="case-list-container-cases" ref={casesContainerRef} style={{ overflowY: "auto", maxHeight: "80vh" }}>
                    <p className="case-list-title text-muted" style={{ marginTop: '10px' }}>{caseQty} casos encontrados</p>
                    {cases.length > 0 ? (
                        cases.map((caseObj: Caso) => (
                            <div
                                key={caseObj.id_caso}
                                className="kanban-task"
                                style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}
                                onClick={() => {
                                    searchParams.set("selected_case", caseObj.id_caso.toString());
                                    setSearchParams(searchParams);
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedCaseIds.has(caseObj.id_caso)}
                                    onChange={(e) => {
                                        e.stopPropagation();
                                        handleCaseSelection(caseObj.id_caso);
                                    }}
                                    style={{ marginTop: "8px", cursor: "pointer", flex: "0 0 auto" }}
                                />
                                <div style={{ flex: 1 }}>
                                    <p className="case-number" style={{ fontSize: "0.85rem", color: "#6c757d", marginBottom: "5px" }}>
                                        Caso #{String(caseObj.id_caso).padStart(7, '0')}
                                    </p>
                                    <h4 className="case-title">{caseObj.nombre_caso}</h4>

                                {!isCompactLayout && (
                                    <div className="case-contact-information">
                                        <i className="bi bi-person"></i>
                                        <p>{caseObj.contact_first_name}</p>
                                        <p>{caseObj.contact_last_name}</p>
                                    </div>
                                )}

                                {isCompactLayout && (
                                    <p style={{ fontSize: "0.85rem", color: "#6c757d", margin: "6px 0" }}>
                                        {caseObj.contact_first_name} {caseObj.contact_last_name}
                                    </p>
                                )}

                                {!isCompactLayout && (
                                    <>
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
                                                            ? "#0F7E5E"
                                                            : "#FF8A05"
                                                    }}
                                                >
                                                    {daysLeft(new Date(caseObj.fecha_cierre_estimada))} días
                                                </p>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {isCompactLayout && (
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", marginTop: "6px" }}>
                                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
                                            {caseObj.abierto ? (
                                                <span className="case-status-badge case-open">Abierto</span>
                                            ) : (
                                                <span className="case-status-badge case-closed">Cerrado</span>
                                            )}
                                            {caseObj.archived && (
                                                <span className="case-status-badge" style={{ backgroundColor: "#6c757d", color: "white", fontSize: "0.75rem", padding: "4px 8px" }}>
                                                    <i className="bi bi-archive" style={{ marginRight: "3px" }}></i>
                                                    Archivado
                                                </span>
                                            )}
                                        </div>
                                        <p
                                            style={{
                                                color: daysLeft(new Date(caseObj.fecha_cierre_estimada)) >= 0
                                                    ? "#0F7E5E"
                                                    : "#FF8A05",
                                                fontSize: "0.8rem",
                                                margin: 0,
                                                fontWeight: 500
                                            }}
                                        >
                                            {daysLeft(new Date(caseObj.fecha_cierre_estimada))} días
                                        </p>
                                    </div>
                                )}

                                {!isCompactLayout && (
                                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                        {caseObj.abierto ? (
                                            <span className="case-status-badge case-open">Abierto</span>
                                        ) : (
                                            <>
                                                <span className="case-status-badge case-closed">Cerrado</span>
                                                <span className={`case-status-badge ${caseObj.exitoso ? "case-success" : "case-failed"}`}>
                                                    {caseObj.exitoso ? "Exitoso" : "No exitoso"}
                                                </span>
                                            </>
                                        )}
                                        {caseObj.archived && (
                                            <span className="case-status-badge" style={{ backgroundColor: "#6c757d", color: "white" }}>
                                                <i className="bi bi-archive" style={{ marginRight: "4px" }}></i>
                                                Archivado
                                            </span>
                                        )}
                                    </div>
                                )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-muted text-center">No hay casos disponibles en el sistema.</p>
                    )}
                    {isFetchingMore && <Spinner className="spinner-border-sm" />}
                </div>
            </motion.div>

            {/* Selected Case Details */}
            <motion.div
                className="selected-case-container"
                animate={{
                    flex: isSidebarMinimized ? 1 : "1 1 auto"
                }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                style={{ overflow: "auto", flex: 1 }}
            >
                <AnimatePresence mode="wait">
                    {selectedCase ? (
                        <SelectedCaseDetails
                            selectedCase={selectedCase}
                            process={process}
                            caseActivities={caseActivities}
                            setCaseActivities={setCaseActivities}
                        />
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

            {/* Floating Action Bar - Bulk Assignment */}
            <AnimatePresence>
                {selectedCaseIds.size > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 30 }}
                        style={{
                            position: "fixed",
                            bottom: "20px",
                            left: "50%",
                            transform: "translateX(-50%)",
                            zIndex: 999,
                            backgroundColor: "#0d6efd",
                            color: "white",
                            padding: "12px 20px",
                            borderRadius: "8px",
                            boxShadow: "0 4px 20px rgba(13, 110, 253, 0.3)",
                            display: "flex",
                            alignItems: "center",
                            gap: "15px"
                        }}
                    >
                        <span style={{ fontWeight: 600 }}>
                            {selectedCaseIds.size} caso{selectedCaseIds.size > 1 ? "s" : ""} seleccionado{selectedCaseIds.size > 1 ? "s" : ""}
                        </span>
                        <button
                            onClick={() => setShowBulkAssignmentModal(true)}
                            style={{
                                backgroundColor: "white",
                                color: "#0d6efd",
                                border: "none",
                                padding: "6px 16px",
                                borderRadius: "6px",
                                fontWeight: 600,
                                cursor: "pointer",
                                fontSize: "0.85rem"
                            }}
                        >
                            <i className="bi bi-arrow-left-right me-1"></i>
                            Reasignar
                        </button>
                        <button
                            onClick={exportSelectedCasesAsTxt}
                            disabled={isExportingCases}
                            style={{
                                backgroundColor: "rgba(255,255,255,0.9)",
                                color: "#0d6efd",
                                border: "none",
                                padding: "6px 16px",
                                borderRadius: "6px",
                                fontWeight: 600,
                                cursor: isExportingCases ? "not-allowed" : "pointer",
                                fontSize: "0.85rem",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                opacity: isExportingCases ? 0.7 : 1
                            }}
                        >
                            {isExportingCases ? (
                                <>
                                    <Spinner className="spinner-border-sm" />
                                    Exportando...
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-download"></i>
                                    Exportar
                                </>
                            )}
                        </button>
                        <button
                            onClick={() => setSelectedCaseIds(new Set())}
                            style={{
                                backgroundColor: "rgba(255,255,255,0.2)",
                                color: "white",
                                border: "none",
                                padding: "6px 12px",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontSize: "1rem"
                            }}
                        >
                            <i className="bi bi-x"></i>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bulk Assignment Modal */}
            <AnimatePresence>
                {showBulkAssignmentModal && (
                    <motion.div
                        className="case-contacts-modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowBulkAssignmentModal(false)}
                    >
                        <motion.div
                            className="case-contacts-modal"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            style={{ maxWidth: "500px" }}
                        >
                            <div className="case-contacts-modal-header">
                                <h5>Reasignar Casos</h5>
                                <button
                                    className="btn-close"
                                    onClick={() => setShowBulkAssignmentModal(false)}
                                    disabled={isSubmittingBulkAssignment}
                                    aria-label="Close"
                                ></button>
                            </div>

                            <div className="case-contacts-modal-body">
                                <div style={{ marginBottom: "15px", padding: "12px", backgroundColor: "#f8f9fa", borderRadius: "6px" }}>
                                    <p style={{ marginBottom: "0", fontWeight: 600, color: "#333" }}>
                                        {selectedCaseIds.size} caso{selectedCaseIds.size > 1 ? "s" : ""} seleccionado{selectedCaseIds.size > 1 ? "s" : ""}
                                    </p>
                                </div>

                                <div className="form-group mb-3">
                                    <label className="form-label">Proceso <span style={{ color: '#dc3545' }}>*</span></label>
                                    <Select
                                        options={allProcesses.map((proc) => ({
                                            value: proc.id_proceso,
                                            label: proc.nombre_proceso,
                                        }))}
                                        value={
                                            bulkAssignmentFormData.process_id !== ""
                                                ? {
                                                    value: parseInt(bulkAssignmentFormData.process_id),
                                                    label: allProcesses.find((p) => p.id_proceso === parseInt(bulkAssignmentFormData.process_id))?.nombre_proceso || "",
                                                  }
                                                : null
                                        }
                                        onChange={(option: any) => {
                                            setBulkAssignmentFormData({
                                                ...bulkAssignmentFormData,
                                                process_id: option?.value?.toString() || "",
                                                stage_id: ""
                                            });
                                        }}
                                        placeholder="Selecciona un proceso"
                                        isClearable
                                        components={{ Menu: AnimatedSelectMenu }}
                                        menuPortalTarget={document.body}
                                        styles={{
                                            menuPortal: (base) => ({ ...base, zIndex: 10000 }),
                                            control: (base) => ({ ...base, borderRadius: '8px', border: '1px solid #dee2e6' }),
                                        }}
                                    />
                                </div>

                                {selectedProcessStages.length > 0 && (
                                    <div className="form-group mb-3">
                                        <label className="form-label">Etapa <span style={{ color: '#dc3545' }}>*</span></label>
                                        <Select
                                            options={selectedProcessStages.map((stage) => ({
                                                value: stage.id_etapa.toString(),
                                                label: stage.nombre_etapa,
                                            }))}
                                            value={
                                                bulkAssignmentFormData.stage_id !== ""
                                                    ? {
                                                        value: bulkAssignmentFormData.stage_id,
                                                        label: selectedProcessStages.find((s) => s.id_etapa.toString() === bulkAssignmentFormData.stage_id)?.nombre_etapa || "",
                                                      }
                                                    : null
                                            }
                                            onChange={(option: any) => {
                                                setBulkAssignmentFormData({
                                                    ...bulkAssignmentFormData,
                                                    stage_id: option?.value || ""
                                                });
                                            }}
                                            placeholder="Selecciona una etapa"
                                            isClearable
                                            components={{ Menu: AnimatedSelectMenu }}
                                            menuPortalTarget={document.body}
                                            styles={{
                                                menuPortal: (base) => ({ ...base, zIndex: 10000 }),
                                                control: (base) => ({ ...base, borderRadius: '8px', border: '1px solid #dee2e6' }),
                                            }}
                                        />
                                    </div>
                                )}

                                <div className="form-group mb-3">
                                    <label className="form-label">Motivo del Cambio <span style={{ color: '#dc3545' }}>*</span></label>
                                    <textarea
                                        className="form-control"
                                        rows={3}
                                        value={bulkAssignmentFormData.change_motive}
                                        onChange={(e) => {
                                            setBulkAssignmentFormData({
                                                ...bulkAssignmentFormData,
                                                change_motive: e.target.value
                                            });
                                        }}
                                        placeholder="Describe el motivo de la reasignación"
                                        disabled={isSubmittingBulkAssignment}
                                        style={{ borderRadius: '8px', border: '1px solid #dee2e6' }}
                                    />
                                </div>

                                <div className="form-group mb-3">
                                    <label className="form-label">Asignar a Usuario (Opcional)</label>
                                    <AsyncSelect
                                        cacheOptions
                                        loadOptions={loadUsers}
                                        defaultOptions={false}
                                        value={selectedAssignee}
                                        onChange={(option) => setSelectedAssignee(option)}
                                        placeholder="Buscar usuario por nombre o email"
                                        isClearable
                                        isDisabled={isSubmittingBulkAssignment}
                                        classNamePrefix="react-select"
                                        components={{ Menu: AnimatedSelectMenu }}
                                        menuPortalTarget={document.body}
                                        styles={{
                                            menuPortal: (base) => ({ ...base, zIndex: 10000 }),
                                            control: (base) => ({ ...base, borderRadius: '8px', border: '1px solid #dee2e6' }),
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="case-contacts-modal-footer">
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => setShowBulkAssignmentModal(false)}
                                    disabled={isSubmittingBulkAssignment}
                                >
                                    Cancelar
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleBulkAssignmentSubmit}
                                    disabled={isSubmittingBulkAssignment}
                                >
                                    {isSubmittingBulkAssignment ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                            Reasignando...
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-arrow-left-right me-1"></i>Reasignar
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}