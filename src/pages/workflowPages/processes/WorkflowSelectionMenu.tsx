import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import "../../../styles/workflows/workflowStyles.css";
import { Proceso } from "../../../types/workflowTypes";
import { Spinner } from "../../../components/ui/Spinner";
import { lowerColorOpacity } from "../../../utils/formatUtils";
import { useSidebarStore } from "../../../stores/sidebarStore";
import { SidebarLayout } from "../../../components/layouts/SidebarLayout";
import { fetchProcesses } from "../../../controllers/workflowControllers";
import { AnimatedNumberCounter } from "../../../components/ui/AnimatedNumberCounter";

export function WorkflowSelectionMenu() {
    // Global States
    const sidebarWidthPx = useSidebarStore((state) => state.sidebarWidthPx);

    // Local States
    const [processes, setProcesses] = useState<Proceso[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    // Filter controls
    const [processNameFilter, setProcessNameFilter] = useState<string>("");
    const [debouncedFilter, setDebouncedFilter] = useState<string>("");
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);

    const handleFilterChange = (value: string) => {
        setProcessNameFilter(value);
        
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }
        
        debounceTimer.current = setTimeout(() => {
            setDebouncedFilter(value);
        }, 500); // 500ms debounce delay
    };

    // Fetch processes from the backend on component mount
    useEffect(() => {
        const loadProcesses = async () => {
            try {
                const data = await fetchProcesses(debouncedFilter);

                // Sort by most stages to least stages
                data.sort((a, b) => b.etapas.length - a.etapas.length);

                setProcesses(data);
                console.log(data);
            } catch {
                toast.error("Ha ocurrido un error al cargar los procesos, por favor, intente más tarde...");
            } finally {
                setLoading(false);
            }
        };

        loadProcesses();

        // Clean up the timer when component unmounts
        return () => {
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
            }
        };
    }, [debouncedFilter]);

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
                Procesos Registrados en el Sistema
                <span className="badge bg-promipyme ms-2">
                    <AnimatedNumberCounter value={processes.length} />
                </span>
            </h1>

            <div className="filter-controllers" style={{ justifyContent: "space-between", marginTop: '30px', marginBottom: '30px' }}>
                <div className="d-flex align-items-center" style={{ gap: "20px" }}>
                    <button className="filter-btn btn btn-outline-danger" onClick={() => {
                        setProcessNameFilter("");
                    }}>
                        <i className="bi bi-x-circle"></i> Limpiar Filtros
                    </button>
                    <input
                        type="text"
                        className="form-control text-search"
                        placeholder="Filtrar por nombre..."
                        value={processNameFilter}
                        onChange={(e) => handleFilterChange(e.target.value)}
                    />
                    <Link to="/workflows/processes/create">
                        <button className="filter-btn btn btn-primary">
                            <i className="bi bi-plus-lg" style={{ marginRight: '5px' }}></i>
                            Crear un Nuevo Proceso
                        </button>
                    </Link>
                </div>
            </div>
            {processes.length === 0 ? (
                <div className="alert alert-warning" role="alert">
                    No se encontraron procesos registrados en el sistema.
                </div>
            ): (
                <div className="processes-container" style={{ marginLeft: '30px', marginRight: '30px', marginTop: '60px' }}>
                    {processes.map((process) => (
                        <div key={process.id_proceso} className="workflow-card card-body" style={{ marginTop: '0px', padding: '0px' }}>
                            <Link to={`/workflows/board-view/${process.id_proceso}`} style={{ textDecoration: 'none', width: '400px' }}>
                                <span className="badge workflow-badge-bg" style={{ backgroundColor: lowerColorOpacity(process.color, 0.2), width: '100%' }}>
                                    <p style={{ color: process.color }}>{process.nombre_proceso}</p>
                                    <p style={{ color: process.color }}>{process.etapas.length}</p>
                                </span>
                                <span className="status-badge" style={{ marginLeft: '10px' }}>Activo</span>
                                <div className={"workflow-steps-container"}>
                                    {process.etapas.map((step) => (
                                        <span key={step.id_etapa} className="badge step-badge-bg">
                                            {step.orden_etapa} - {step.nombre_etapa}
                                        </span>
                                    ))}
                                </div>
                            </Link>
                        </div>
                    ))}
                </div>
            )}
        </SidebarLayout>
    );
}
