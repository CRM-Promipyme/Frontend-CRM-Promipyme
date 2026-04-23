import { format } from "date-fns";
import Select from "react-select";
import { es } from "date-fns/locale";
import { toast } from "react-toastify";
import api from "../../../controllers/api";
import { useSearchParams } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "../../../stores/authStore";
import { daysLeft } from "../../../utils/formatUtils";
import "../../../styles/workflows/workflowStyles.css";
import { Activity } from "../../../types/activityTypes";
import { motion, AnimatePresence } from "framer-motion";
import { Spinner } from "../../../components/ui/Spinner";
import { formatNumber } from "../../../utils/formatUtils";
import { Caso, Proceso } from "../../../types/workflowTypes";
import { Branch, Region } from "../../../types/branchTypes";
import { useSidebarStore } from "../../../stores/sidebarStore";
import { SidebarLayout } from "../../../components/layouts/SidebarLayout";
import { SelectedCaseDetails } from "./boardView/tabs/SelectedCaseDetails";
import { AnimatedSelectMenu } from "../../../components/ui/forms/AnimatedSelectMenu";
import { AnimatedNumberCounter } from "../../../components/ui/AnimatedNumberCounter";
import { fetchBranches, fetchRegions } from "../../../controllers/branchControllers";

export function BaseCaseList() {
    // Global States
    const sidebarWidthPx = useSidebarStore((state) => state.sidebarWidthPx);
    const accessToken = useAuthStore((state) => state.accessToken);
    
    // Local States
    const [process, setProcess] = useState<Proceso | null>(null);
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
    const [caseNameFilter, setCaseNameFilter] = useState<string>("");
    const [branches, setBranches] = useState<Branch[]>([]);
    const [regions, setRegions] = useState<Region[]>([]);
    const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
    const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);
    
    // Fetch Branches and Regions on component mount
    useEffect(() => {
        if (!accessToken) return;

        const loadBranchesAndRegions = async () => {
            try {
                if (branches.length === 0) {
                    const branchesData = await fetchBranches(100, 0); // Fetch up to 100 branches
                    setBranches(branchesData.results);
                }
                if (regions.length === 0) {
                    const regionsData = await fetchRegions(100, 0); // Fetch up to 100 regions
                    setRegions(regionsData.results);
                }
            } catch {
                toast.error("No se pudieron obtener las sucursales y regiones.");
            }
        };
        loadBranchesAndRegions();
    }, [accessToken, branches, regions]);
    
    // collect active case from URL search params
    useEffect(() => {
        const fetchProcess = async (processId: number) => {
            try {
                const response = await api.get(`/workflows/procesos/list?process_id=${processId}`);
                return response.data?.process || null;
            } catch (error) {
                console.error("Error fetching process:", error);
                return null;
            }
        }

        const caseFromUrl = searchParams.get("selected_case");
        if (caseFromUrl) {
            const caseObj = cases.find((caseObj) => caseObj.id_caso === parseInt(caseFromUrl));
            
            const processId = caseObj?.proceso;
            if (processId) {
                fetchProcess(processId).then((fetchedProcess) => {
                    setProcess(fetchedProcess);
                });
            }

            setSelectedCase(caseObj || null);
        }
    }, [searchParams, cases]);
    
    // Load cases with debounce on filters change
    useEffect(() => {
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }
        
        debounceTimer.current = setTimeout(async () => {
            try {
                setLoading(true);
                
                const params: Record<string, string> = {};
                if (caseStatusFilter) params.case_status = caseStatusFilter;
                if (caseNameFilter) params.case_name = caseNameFilter;
                if (selectedBranch) params.sucursal_id = String(selectedBranch.id);
                if (selectedRegion) params.region_id = String(selectedRegion.id);
                
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
    }, [caseStatusFilter, caseNameFilter, selectedBranch, selectedRegion]);
    
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
    
    // Render different UI states
    if (loading) {
        return (
            <SidebarLayout sidebarWidthPx={sidebarWidthPx}>
                <Spinner />
            </SidebarLayout>
        );
    }
    
    return (
        <SidebarLayout sidebarWidthPx={sidebarWidthPx}>
            <h1 className="page-title">
                Lista de Casos en el Sistema
                <span className="badge bg-promipyme ms-2">
                    <AnimatedNumberCounter value={caseQty} />
                </span>
            </h1>
            
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
                        
                        {/* Branch filter dropdown */}
                        <div style={{ marginBottom: "15px" }}>
                            <Select
                                isClearable
                                options={branches}
                                value={selectedBranch}
                                onChange={(selected) => setSelectedBranch(selected as Branch | null)}
                                getOptionLabel={(option: Branch) => option.nombre_sucursal}
                                getOptionValue={(option: Branch) => String(option.id)}
                                placeholder="Filtrar por sucursal..."
                                components={{ Menu: AnimatedSelectMenu }}
                                menuPortalTarget={document.body}
                                styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                            />
                        </div>

                        {/* Region filter dropdown */}
                        <div style={{ marginBottom: "15px" }}>
                            <Select
                                isClearable
                                options={regions}
                                value={selectedRegion}
                                onChange={(selected) => setSelectedRegion(selected as Region | null)}
                                getOptionLabel={(option: Region) => option.nombre_region}
                                getOptionValue={(option: Region) => String(option.id)}
                                placeholder="Filtrar por región..."
                                components={{ Menu: AnimatedSelectMenu }}
                                menuPortalTarget={document.body}
                                styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
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
                        {selectedCase && process ? (
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
        </SidebarLayout>
    );
}
