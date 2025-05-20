import { useState, useEffect, useMemo } from "react";
import AsyncSelect from "react-select/async";
import Select from "react-select";
import api from "../../controllers/api";
import { toast } from "react-toastify";
import { Spinner } from "../../components/ui/Spinner";
import { Pie, Bar } from "react-chartjs-2";
import "../../styles/components/dashboard.css";

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

export function CustomReport({ dateStart, dateEnd }: CustomReportProps) {
    // Filters
    const [user, setUser] = useState<any>(null);
    const [role, setRole] = useState<RoleOption | null>(null);
    const [process, setProcess] = useState<ProcessOption | null>(null);
    const [roles, setRoles] = useState<RoleOption[]>([]);
    const [processes, setProcesses] = useState<ProcessOption[]>([]);

    // Data
    const [loading, setLoading] = useState(false);
    const [dashboardTotals, setDashboardTotals] = useState<any>(null);
    const [dashboardCases, setDashboardCases] = useState<any[]>([]);
    const [report, setReport] = useState<ReportRow[]>([]);
    const [fetched, setFetched] = useState(false);

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

    // Fetch both dashboard and report data
    const fetchReport = async () => {
        if (!dateStart || !dateEnd) {
            toast.error("Selecciona un rango de fechas.");
            return;
        }
        setLoading(true);
        setFetched(false);
        try {
            const params: any = {
                date_start: dateStart,
                date_end: dateEnd
            };
            if (user) params.user_id = user.value;
            if (role) params.role_id = role.value;
            if (process) params.process_id = process.value;

            // Fetch both endpoints in parallel
            const [dashboardRes, reportRes] = await Promise.all([
                api.get("/reports/dashboard", { params }),
                api.get("/reports/dashboard/user-role-report/", { params })
            ]);
            setDashboardTotals(dashboardRes.data.data.totals);
            setDashboardCases(dashboardRes.data.data.cases);
            setReport(reportRes.data.data);
            setFetched(true);
        } catch {
            toast.error("No se pudo generar el reporte.");
        } finally {
            setLoading(false);
        }
    };

    // General dashboard charts
    const openCases = dashboardCases.filter(c => c.abierto).length;
    const closedCases = dashboardCases.filter(c => !c.abierto).length;
    const successfulCases = dashboardCases.filter(c => c.exitoso).length;
    const failedCases = dashboardCases.filter(c => !c.exitoso).length;
    const processCounts = dashboardCases.reduce((acc, c) => {
        acc[c.proceso] = (acc[c.proceso] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const openClosedData = {
        labels: ['Abiertos', 'Cerrados'],
        datasets: [{
            data: [openCases, closedCases],
            backgroundColor: ['#0d6efd', '#dc3545'],
            borderWidth: 0,
        }],
    };

    const successFailedData = {
        labels: ['Exitosos', 'Fallidos'],
        datasets: [{
            data: [successfulCases, failedCases],
            backgroundColor: ['#2CBA79', '#E00B0B'],
            borderWidth: 0,
        }],
    };

    const processData = {
        labels: Object.keys(processCounts),
        datasets: [{
            label: 'Casos por Proceso',
            data: Object.values(processCounts),
            backgroundColor: '#0d6efd',
            borderRadius: 6,
        }],
    };

    // Custom report charts
    const chartData = useMemo(() => {
        if (!report.length) return null;
        return {
            assigned: {
                labels: report.map(r => r.full_name),
                datasets: [{
                    label: "Tareas Asignadas",
                    data: report.map(r => r.total_tasks_assigned),
                    backgroundColor: "#0d6efd"
                }]
            },
            completed: {
                labels: report.map(r => r.full_name),
                datasets: [{
                    label: "Tareas Completadas",
                    data: report.map(r => r.total_tasks_completed),
                    backgroundColor: "#2CBA79"
                }]
            },
            cases: {
                labels: report.map(r => r.full_name),
                datasets: [{
                    label: "Casos Creados",
                    data: report.map(r => r.total_cases_created),
                    backgroundColor: "#f5c211"
                }]
            }
        };
    }, [report]);

    // Totals cards
    const totalsList = dashboardTotals ? [
        { label: "Cantidad de Procesos", value: dashboardTotals.total_workflows, icon: "bi-diagram-3", variant: "secondary" },
        { label: "Total de Casos", value: dashboardTotals.total_cases, icon: "bi-collection", variant: "primary" },
        { label: "Casos Completados", value: dashboardTotals.total_completed_cases, icon: "bi-check-circle", variant: "info" },
        { label: "Casos Pendientes", value: dashboardTotals.total_pending_cases, icon: "bi-clock", variant: "warning" },
        { label: "Casos Exitosos", value: dashboardTotals.total_successful_cases, icon: "bi-trophy", variant: "success" },
        { label: "Casos Fallidos", value: dashboardTotals.total_failed_cases, icon: "bi-x-circle", variant: "danger" },
    ] : [];

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
                    <button className="btn btn-primary" style={{ minWidth: 120 }} onClick={fetchReport} disabled={loading}>
                        {loading ? "Generando..." : "Generar"}
                    </button>
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
                    {/* Totals cards */}
                    <div className="totals-container" style={{ marginBottom: 16, width: "100%", flexWrap: "wrap" }}>
                        {totalsList.map((item, idx) => (
                            <div key={idx} className="card-body">
                                <i className={`bi ${item.icon} text-${item.variant} me-3`} style={{ fontSize: "2rem" }}></i>
                                <div>
                                    <h6 className="mb-1 text-muted">{item.label}</h6>
                                    <h4 className={`text-${item.variant} fw-bold`}>{item.value}</h4>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* General charts */}
                    <div className="charts-container" style={{ marginBottom: 24, width: "100%", display: "flex", gap: 24, flexWrap: "wrap" }}>
                        <div className="card-body chart pie-chart" style={{ flex: 1, minWidth: 320 }}>
                            <div className="chart-title">
                                <h5 className="h4-header">Distribución de Casos</h5>
                                <p className="text-muted mb-3">Abiertos vs. Cerrados</p>
                            </div>
                            <div style={{ position: "relative", width: "100%", height: "260px" }}>
                                <Pie data={openClosedData} options={{ responsive: true, plugins: { legend: { position: 'bottom' } }, cutout: '70%' }} />
                            </div>
                        </div>
                        <div className="card-body chart pie-chart" style={{ flex: 1, minWidth: 320 }}>
                            <div className="chart-title">
                                <h5 className="h4-header">Estado de Casos</h5>
                                <p className="text-muted mb-3">Exitosos vs. Fallidos</p>
                            </div>
                            <div style={{ position: "relative", width: "100%", height: "260px" }}>
                                <Pie data={successFailedData} options={{ responsive: true, plugins: { legend: { position: 'bottom' } }, cutout: '70%' }} />
                            </div>
                        </div>
                        <div className="card-body chart" style={{ flex: 1, minWidth: 320 }}>
                            <div className="chart-title">
                                <h5 className="h4-header">Casos por Proceso</h5>
                                <p className="text-muted mb-3">Distribución por tipo de proceso</p>
                            </div>
                            <Bar data={processData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
                        </div>
                    </div>

                    {/* Custom report charts and table */}
                    {report.length === 0 ? (
                        <div className="text-muted text-center py-4">No hay datos para este filtro.</div>
                    ) : (
                        <div>
                            <div className="charts-container" style={{ marginBottom: 32, width: "100%", display: "flex", gap: 24, flexWrap: "wrap" }}>
                                <div className="card-body chart pie-chart" style={{ flex: 1, minWidth: 320 }}>
                                    <div className="chart-title">
                                        <h5 className="h4-header">Tareas Asignadas</h5>
                                    </div>
                                    <Bar data={chartData!.assigned} options={{ responsive: true, plugins: { legend: { display: false } } }} />
                                </div>
                                <div className="card-body chart pie-chart" style={{ flex: 1, minWidth: 320 }}>
                                    <div className="chart-title">
                                        <h5 className="h4-header">Tareas Completadas</h5>
                                    </div>
                                    <Bar data={chartData!.completed} options={{ responsive: true, plugins: { legend: { display: false } } }} />
                                </div>
                                <div className="card-body chart pie-chart" style={{ flex: 1, minWidth: 320 }}>
                                    <div className="chart-title">
                                        <h5 className="h4-header">Casos Creados</h5>
                                    </div>
                                    <Bar data={chartData!.cases} options={{ responsive: true, plugins: { legend: { display: false } } }} />
                                </div>
                            </div>
                            <div className="card-body" style={{ marginTop: 24, width: "100%", overflowX: "auto" }}>
                                <h5 className="h4-header" style={{ marginBottom: 16 }}>Detalle de Usuarios</h5>
                                <table className="table table-striped table-bordered" style={{ minWidth: 900 }}>
                                    <thead>
                                        <tr>
                                            <th>Usuario</th>
                                            <th>Tareas Asignadas</th>
                                            <th>Tareas Completadas</th>
                                            <th>Promedio Tiempo de Tarea</th>
                                            <th>Casos Creados</th>
                                            <th>Casos Completados</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {report.map(row => (
                                            <tr key={row.user_id}>
                                                <td>
                                                    <b>{row.full_name}</b>
                                                    <div className="text-muted" style={{ fontSize: 13 }}>{row.username}</div>
                                                </td>
                                                <td>{row.total_tasks_assigned}</td>
                                                <td>{row.total_tasks_completed}</td>
                                                <td>{row.avg_task_completion_time ?? <span className="text-muted">—</span>}</td>
                                                <td>{row.total_cases_created}</td>
                                                <td>{row.total_cases_completed}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}