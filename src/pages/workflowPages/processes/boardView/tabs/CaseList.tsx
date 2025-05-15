import { format } from "date-fns";
import Select from "react-select";
import { es } from "date-fns/locale";
import { toast } from "react-toastify";
import api from "../../../../../controllers/api";
import { useEffect, useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import { Caso } from "../../../../../types/workflowTypes";
import { daysLeft } from "../../../../../utils/formatUtils";
import { SelectedCaseDetails } from "./SelectedCaseDetails";
import { Activity } from "../../../../../types/activityTypes";
import { Spinner } from "../../../../../components/ui/Spinner";
import { formatNumber } from "../../../../../utils/formatUtils";
import { WorkflowKanbanProps } from "../../../../../types/kanbanBoardTypes"
import { AnimatedSelectMenu } from "../../../../../components/ui/forms/AnimatedSelectMenu";

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
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);

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
    }, [process.id_proceso, caseStatusFilter, stageIdFilter, caseNameFilter]);

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

    // Load activities on case selection
    useEffect(() => {
        if (selectedCase) {
            setLoading(true);
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
                    <div>
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
                </div>

                <div className="case-list-container-cases" ref={casesContainerRef} style={{ overflowY: "auto", maxHeight: "80vh" }}>
                    <p className="case-list-title text-muted" style={{ marginTop: '10px' }}>{caseQty} casos encontrados</p>
                    {cases.length > 0 ? (
                        cases.map((caseObj: Caso) => (
                            <div
                                key={caseObj.id_caso}
                                className="kanban-task"
                                onClick={() => {
                                    searchParams.set("selected_case", caseObj.id_caso.toString());
                                    setSearchParams(searchParams);
                                }}
                            >
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
                                                    ? "#0F7E5E"
                                                    : "#FF8A05"
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
                    {isFetchingMore && <Spinner className="spinner-border-sm" />}
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
        </div>
    )
}