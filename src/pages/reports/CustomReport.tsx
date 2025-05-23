import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState, useMemo, useRef } from "react";
import { useAuthStore } from "../../stores/authStore";
import AsyncSelect from "react-select/async";
import Select from "react-select";
import api from "../../controllers/api";
import { toast } from "react-toastify";
import { Spinner } from "../../components/ui/Spinner";
import { Bar } from "react-chartjs-2";
import "../../styles/components/dashboard.css";
import { Activity } from "../../types/activityTypes";
import { ActivityLog } from "../../components/ui/ActivityLog";
import { Dashboard } from "./Dashboard";

interface CustomReportProps {
    dateStart: string;
    dateEnd: string;
}

interface ReportRow {
    user_id: number;
    username: string;
    full_name: string;
    total_tasks_assigned: number;
    total_tasks_completed: number;
    avg_task_completion_time: string | null;
    total_cases_created: number;
    total_cases_completed: number;
}

interface RoleOption {
    value: number;
    label: string;
}
interface ProcessOption {
    value: number;
    label: string;
}

type ReportType = "usuario" | "departamento";

export function CustomReport({ dateStart, dateEnd }: CustomReportProps) {
    // Report type
    const [reportType, setReportType] = useState<ReportType>("departamento");

    // Filters
    const userId = useAuthStore(state => state.userId);
    const [userActivities, setUserActivities] = useState<Activity[]>([]);
    const [user, setUser] = useState<any>(null);
    const [role, setRole] = useState<RoleOption | null>(null);
    const [process, setProcess] = useState<ProcessOption | null>(null);
    const [roles, setRoles] = useState<RoleOption[]>([]);
    const [processes, setProcesses] = useState<ProcessOption[]>([]);

    // Data
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState<ReportRow[]>([]);
    const [fetched, setFetched] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const authStore = useAuthStore();
    const [canExport, setCanExport] = useState(false);

    const handleShare = () => {
        const params = new URLSearchParams(location.search);
        params.set("shared", "1");
        const shareUrl = `${window.location.origin}${location.pathname}?${params.toString()}`;
        navigator.clipboard.writeText(shareUrl);
        toast.success("¡Enlace copiado!");
    };

    // Fetch roles and processes on mount
    useEffect(() => {
        api.get("/auth/dropdown-opts/?roles=true").then(res => {
            setRoles(res.data.roles.map((r: any) => ({
                value: r.id_rol,
                label: r.nombre_rol
            })));
        });
        api.get("/workflows/procesos/list").then(res => {
            setProcesses(res.data.processes.map((p: any) => ({
                value: p.id_proceso,
                label: p.nombre_proceso
            })));
        });
    }, []);

    // Async user search
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

    // On mount: check permissions and set initial filters from URL
    useEffect(() => {
        (async () => {
            if (authStore.isAdmin()) {
                setCanExport(true);
            } else {
                const perms = await authStore.retrievePermissions();
                const hasExport = perms.role_permissions.some((rp: any) =>
                    rp.base_permissions?.export_reports
                );
                setCanExport(hasExport);
            }

            // Read query params
            const params = new URLSearchParams(location.search);
            const qReportType = params.get("reportType") as ReportType;
            const qUser = params.get("user");
            const qRole = params.get("role");
            const qProcess = params.get("process");

            if (qReportType === "usuario") setReportType("usuario");
            else setReportType("departamento");

            if (qUser) setUser({ value: qUser, label: "" });
            if (qRole) setRole({ value: Number(qRole), label: "" });
            if (qProcess) setProcess({ value: Number(qProcess), label: "" });
        })();
        // eslint-disable-next-line
    }, []);

    // Auto-fetch report if shared=1 and all required filters are set
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const shared = params.get("shared");
        const qReportType = params.get("reportType") as ReportType;

        if (shared === "1") {
            if (
                (qReportType === "usuario" && user) ||
                (qReportType === "departamento" && (role || process))
            ) {
                fetchReport();
            }
        }
        // eslint-disable-next-line
    }, [reportType, user, role, process, dateStart, dateEnd]);

    // When generating report, update URL with relevant params
    const fetchReport = async () => {
        if (!dateStart || !dateEnd) {
            toast.error("Selecciona un rango de fechas.");
            return;
        }
        if (reportType === "usuario" && !user) {
            toast.error("Selecciona un usuario.");
            return;
        }
        setLoading(true);
        setFetched(false);
        try {
            // Build params from current URL
            const params = new URLSearchParams(location.search);

            params.set("reportType", reportType);
            if (reportType === "usuario" && user) {
                params.set("user", user.value);
                params.delete("role");
                params.delete("process");
            } else if (reportType === "departamento") {
                params.delete("user");
                if (role) params.set("role", String(role.value));
                else params.delete("role");
                if (process) params.set("process", String(process.value));
                else params.delete("process");
            }

            // Update the URL
            navigate(`${location.pathname}?${params.toString()}`, { replace: true });

            const apiParams: any = {
                date_start: dateStart,
                date_end: dateEnd
            };
            if (reportType === "usuario" && user) apiParams.user_id = user.value;
            if (reportType === "departamento") {
                if (role) apiParams.role_id = role.value;
                if (process) apiParams.process_id = process.value;
            }
            const res = await api.get("/reports/dashboard/user-role-report/", { params: apiParams });
            setReport(res.data.data);
            setFetched(true);
        } catch {
            toast.error("No se pudo generar el reporte.");
        } finally {
            setLoading(false);
        }
    };

    // Prepare data for charts
    const filteredReport = useMemo(() => {
        if (reportType === "usuario" && user) {
            return report.filter(r => r.user_id === user.value);
        }
        return report;
    }, [report, reportType, user]);

    // Chart: Average completion time (in minutes)
    const avgTimeData = useMemo(() => {
        const labels = filteredReport.map(r => r.full_name);
        const data = filteredReport.map(r =>
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
    }, [filteredReport]);

    // Chart: Cases created
    const casesCreatedData = useMemo(() => ({
        labels: filteredReport.map(r => r.full_name),
        datasets: [{
            label: "Casos Creados",
            data: filteredReport.map(r => r.total_cases_created),
            backgroundColor: "#f5c211"
        }]
    }), [filteredReport]);

    // Chart: Tasks assigned/completed
    const tasksData = useMemo(() => ({
        labels: filteredReport.map(r => r.full_name),
        datasets: [
            {
                label: "Tareas Asignadas",
                data: filteredReport.map(r => r.total_tasks_assigned),
                backgroundColor: "#0d6efd"
            },
            {
                label: "Tareas Completadas",
                data: filteredReport.map(r => r.total_tasks_completed),
                backgroundColor: "#2CBA79"
            }
        ]
    }), [filteredReport]);

    // Chart: Cases completed
    const casesCompletedData = useMemo(() => ({
        labels: filteredReport.map(r => r.full_name),
        datasets: [{
            label: "Casos Completados",
            data: filteredReport.map(r => r.total_cases_completed),
            backgroundColor: "#2CBA79"
        }]
    }), [filteredReport]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const qRole = params.get("role");
        const qProcess = params.get("process");
        const qUser = params.get("user");

        if (qUser && (!user || user.value !== qUser)) {
            // Fetch user info for label
            api.get("/auth/users/list", { params: { id: qUser } })
                .then(res => {
                    const u = res.data.results?.[0];
                    if (u) {
                        setUser({
                            value: u.id,
                            label: `${u.first_name} ${u.last_name} (${u.email})`
                        });
                    }
                })
                .catch(() => {
                    setUser({ value: qUser, label: "(Usuario desconocido)" });
                });
        } else {
            if (qRole && roles.length > 0) {
                const foundRole = roles.find(r => String(r.value) === String(qRole));
                if (foundRole) setRole(foundRole);
            }
            if (qProcess && processes.length > 0) {
                const foundProcess = processes.find(p => String(p.value) === String(qProcess));
                if (foundProcess) setProcess(foundProcess);
            }
        }
    }, [roles, processes]);

    return (
        <div style={{ width: "100%", padding: 0 }}>
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
                <div style={{ minWidth: 180 }}>
                    <label className="form-label">Tipo de Reporte</label>
                    <Select
                        options={[
                            { value: "departamento", label: "Reporte de Departamento" },
                            { value: "usuario", label: "Reporte de Usuario" }
                        ]}
                        value={
                            reportType === "usuario"
                                ? { value: "usuario", label: "Reporte de Usuario" }
                                : { value: "departamento", label: "Reporte de Departamento" }
                        }
                        onChange={opt => setReportType(opt?.value as ReportType)}
                        classNamePrefix="react-select"
                        isSearchable={false}
                    />
                </div>
                {reportType === "usuario" && (
                    <div style={{ minWidth: 220, flex: 1 }}>
                        <label className="form-label">Usuario</label>
                        <AsyncSelect
                            cacheOptions
                            loadOptions={loadUsers}
                            defaultOptions={false}
                            value={user}
                            onChange={setUser}
                            placeholder="Buscar usuario"
                            isClearable
                            classNamePrefix="react-select"
                        />
                    </div>
                )}
                {reportType === "departamento" && (
                    <>
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
                    </>
                )}
                <div>
                    <button className="btn btn-primary" style={{ minWidth: 120 }} onClick={fetchReport} disabled={loading}>
                        {loading ? "Generando..." : "Generar"}
                    </button>
                    {canExport && fetched && (
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
                    {filteredReport.length === 0 ? (
                        <div className="text-muted text-center py-4">No hay datos para este filtro.</div>
                    ) : (
                        <div>
                            <div className="charts-container" style={{ marginBottom: 32, width: "100%", display: "flex", gap: 24, flexWrap: "wrap" }}>
                                <div className="card-body chart" style={{ flex: 1, minWidth: 320 }}>
                                    <div className="chart-title">
                                        <h5 className="h4-header">Promedio de Tiempo de Tarea (min)</h5>
                                    </div>
                                    <Bar data={avgTimeData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
                                </div>
                                <div className="card-body chart" style={{ flex: 1, minWidth: 320 }}>
                                    <div className="chart-title">
                                        <h5 className="h4-header">Casos Creados</h5>
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
                                {user && (
                                    <div className="card-body activity-log">
                                        <ActivityLog activities={userActivities} setActivities={setUserActivities} entity_type='user' entity_id={userId}/>
                                    </div>
                                )}
                            </div>
                            {reportType === "departamento" && (
                                <Dashboard dateStart={dateStart} dateEnd={dateEnd} />
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}