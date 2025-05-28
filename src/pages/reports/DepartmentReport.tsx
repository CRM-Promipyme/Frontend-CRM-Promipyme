import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Select from "react-select";
import { Bar } from "react-chartjs-2";
import api from "../../controllers/api";
import { toast } from "react-toastify";
import { Spinner } from "../../components/ui/Spinner";
import { Activity } from "../../types/activityTypes";
import { ActivityLog } from "../../components/ui/ActivityLog";
import { Dashboard } from "./Dashboard";
import { Proceso } from "../../types/workflowTypes";
import { Role } from "../../types/authTypes";
import { ReportApiParams } from "./CustomReport";
import { ReportRow } from "../../types/reportTypes";

interface DepartmentReportProps {
    dateStart: string;
    dateEnd: string;
}

interface RoleOption {
    value: number;
    label: string;
}
interface ProcessOption {
    value: number;
    label: string;
}

export function DepartmentReport({ dateStart, dateEnd }: DepartmentReportProps) {
    const [role, setRole] = useState<RoleOption | null>(null);
    const [process, setProcess] = useState<ProcessOption | null>(null);
    const [roles, setRoles] = useState<RoleOption[]>([]);
    const [processes, setProcesses] = useState<ProcessOption[]>([]);
    const [userActivities, setUserActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState<ReportRow[]>([]);
    const [fetched, setFetched] = useState(false);

    const location = useLocation();
    const navigate = useNavigate();

    // Handle share
    const handleShare = () => {
        const params = new URLSearchParams(location.search);
        if (role) params.set("role", role.value.toString());
        if (process) params.set("process", process.value.toString());
        params.set("shared", "1");
        const shareUrl = `${window.location.origin}${location.pathname}?${params.toString()}`;
        navigator.clipboard.writeText(shareUrl);
        toast.success("¡Enlace copiado!");
    };

    // 1. Load options and set role/process from QPs
    useEffect(() => {
        Promise.all([
            api.get("/auth/dropdown-opts/?roles=true"),
            api.get("/workflows/procesos/list")
        ]).then(([rolesRes, processesRes]) => {
            const loadedRoles = rolesRes.data.roles.map((r: Role) => ({
                value: r.id_rol,
                label: r.nombre_rol
            }));
            setRoles(loadedRoles);

            const loadedProcesses = processesRes.data.processes.map((p: Proceso) => ({
                value: p.id_proceso,
                label: p.nombre_proceso
            }));
            setProcesses(loadedProcesses);

            // Set role/process from QPs if present
            const params = new URLSearchParams(location.search);
            const qRole = params.get("role");
            const qProcess = params.get("process");

            if (qRole) {
                const foundRole = loadedRoles.find((r: RoleOption) => String(r.value) === String(qRole));
                if (foundRole) setRole(foundRole);
            }
            if (qProcess) {
                const foundProcess = loadedProcesses.find((p: ProcessOption) => String(p.value) === String(qProcess));
                if (foundProcess) setProcess(foundProcess);
            }
        });
        // eslint-disable-next-line
    }, []);

    // 2. When shared=1 and role/process are set, trigger fetchReport
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const shared = params.get("shared");
        const qRole = params.get("role");
        const qProcess = params.get("process");
        if (
            shared === "1" &&
            ((qRole && role) || (qProcess && process))
        ) {
            fetchReport(true);
        }
        // eslint-disable-next-line
    }, [role, process]);

    // fetchReport: if sharedMode, don't update QPs; otherwise, update QPs and remove shared param
    const fetchReport = async (sharedMode = false) => {
        if (!dateStart || !dateEnd) {
            toast.error("Selecciona un rango de fechas.");
            return;
        }
        
        if (!role && !process) {
            toast.error("Selecciona al menos un filtro.");
            return;
        }
        setLoading(true);
        setFetched(false);

        if (!sharedMode) {
            // Update QPs, remove shared param
            const params = new URLSearchParams(location.search);
            if (role) params.set("role", role.value.toString());
            else params.delete("role");
            if (process) params.set("process", process.value.toString());
            else params.delete("process");
            params.delete("shared");
            navigate(`${location.pathname}?${params.toString()}`, { replace: true });
        }

        try {
            const apiParams: ReportApiParams = {
                date_start: dateStart,
                date_end: dateEnd
            };
            if (role) apiParams.role_id = role.value;
            if (process) apiParams.process_id = process.value;
            const res = await api.get("/reports/dashboard/user-role-report/", { params: apiParams });
            setReport(res.data.data);
            setFetched(true);
        } catch {
            toast.error("No se pudo generar el reporte.");
        } finally {
            setLoading(false);
        }
    };

    const casesCreatedData = useMemo(() => ({
        labels: report.map(r => r.full_name),
        datasets: [{
            label: "Casos Creados",
            data: report.map(r => r.total_cases_created),
            backgroundColor: "#f5c211"
        }]
    }), [report]);

    const tasksData = useMemo(() => ({
        labels: report.map(r => r.full_name),
        datasets: [
            {
                label: "Tareas Asignadas",
                data: report.map(r => r.total_tasks_assigned),
                backgroundColor: "#0d6efd"
            },
            {
                label: "Tareas Completadas",
                data: report.map(r => r.total_tasks_completed),
                backgroundColor: "#2CBA79"
            }
        ]
    }), [report]);

    const casesCompletedData = useMemo(() => ({
        labels: report.map(r => r.full_name),
        datasets: [{
            label: "Casos Completados",
            data: report.map(r => r.total_cases_completed),
            backgroundColor: "#2CBA79"
        }]
    }), [report]);

    const avgTimeData = useMemo(() => {
        const labels = report.map(r => r.full_name);
        const data = report.map(r =>
            r.avg_task_completion_time
                ? parseFloat(r.avg_task_completion_time.split(":").reduce((acc, t, i) => acc + parseFloat(t) * [60, 1, 1/60][i], 0).toFixed(2))
                : 0
        );
        return {
            labels,
            datasets: [{
                label: "Promedio (minutos)",
                data,
                backgroundColor: "#0d6efd"
            }]
        };
    }, [report]);

    return (
        <div style={{ width: "100%", padding: '10px' }}>
            {/* Filter controls */}
            <div style={{
                display: "flex",
                gap: 16,
                flexWrap: "wrap",
                alignItems: "end",
                marginBottom: 24,
                padding: "0 16px",
                width: "100%",
                maxWidth: "100vw"
            }}>
                <div style={{ minWidth: 180, flex: 1 }}>
                    <label className="form-label">Rol</label>
                    <Select
                        options={roles}
                        value={role}
                        onChange={setRole}
                        placeholder="Seleccionar rol"
                        isClearable
                        classNamePrefix="react-select"
                        filterOption={(option, input) =>
                            option.label.toLowerCase().includes(input.toLowerCase())
                        }
                    />
                </div>
                <div style={{ minWidth: 220, flex: 1 }}>
                    <label className="form-label">Proceso</label>
                    <Select
                        options={processes}
                        value={process}
                        onChange={setProcess}
                        placeholder="Seleccionar proceso"
                        isClearable
                        classNamePrefix="react-select"
                        filterOption={(option, input) =>
                            option.label.toLowerCase().includes(input.toLowerCase())
                        }
                    />
                </div>
                <div>
                    <button className="btn btn-primary" style={{ minWidth: 120 }} onClick={() => fetchReport(false)} disabled={loading}>
                        {loading ? "Generando..." : "Generar"}
                    </button>
                    {(role || process) && (
                        <button
                            className="btn btn-outline-secondary ms-2"
                            onClick={handleShare}
                            title="Compartir este reporte"
                        >
                            Compartir
                        </button>
                    )}
                </div>
            </div>

            {/* Report content */}
            {loading && (
                <div className="d-flex justify-content-center align-items-center" style={{ height: 200 }}>
                    <Spinner className='spinner-border-lg' />
                </div>
            )}

            {fetched && !loading && (
                <div style={{ width: "100%", padding: 0 }}>
                    {report.length === 0 ? (
                        <div className="text-muted text-center py-4">No hay datos para este filtro.</div>
                    ) : (
                        <div>
                            <div className="charts-container" style={{ marginBottom: 32, width: "100%", display: "flex", gap: 24, flexWrap: "wrap" }}>
                                <div className="card-body chart" style={{ flex: 1, minWidth: 320 }}>
                                    <div className="chart-title">
                                        <h5 className="h4-header">Tiempo promedio para realizar tarea (min)</h5>
                                    </div>
                                    <Bar data={avgTimeData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
                                </div>
                                <div className="card-body chart" style={{ flex: 1, minWidth: 320 }}>
                                    <div className="chart-title">
                                        <h5 className="h4-header">Casos Trabajados</h5>
                                    </div>
                                    <Bar data={casesCreatedData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
                                </div>
                                <div className="card-body chart" style={{ flex: 1, minWidth: 320 }}>
                                    <div className="chart-title">
                                        <h5 className="h4-header">Tareas Asignadas vs Completadas</h5>
                                    </div>
                                    <Bar data={tasksData} options={{ responsive: true, plugins: { legend: { position: "bottom" } } }} />
                                </div>
                                <div className="card-body chart" style={{ flex: 1, minWidth: 320 }}>
                                    <div className="chart-title">
                                        <h5 className="h4-header">Casos Completados</h5>
                                    </div>
                                    <Bar data={casesCompletedData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
                                </div>
                                {report.length > 0 && (
                                    <div className="card-body activity-log">
                                        <ActivityLog activities={userActivities} setActivities={setUserActivities} entity_type='user' entity_id={report[0].user_id}/>
                                    </div>
                                )}
                            </div>
                            <Dashboard dateStart={dateStart} dateEnd={dateEnd} />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}