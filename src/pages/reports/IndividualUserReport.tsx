import { useState, useMemo, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AsyncSelect from "react-select/async";
import { Bar } from "react-chartjs-2";
import api from "../../controllers/api";
import { toast } from "react-toastify";
import { Spinner } from "../../components/ui/Spinner";
import { Activity } from "../../types/activityTypes";
import { ActivityLog } from "../../components/ui/ActivityLog";
import { User } from "../../types/authTypes";
import { useAuthStore } from "../../stores/authStore";
import { ReportRow } from "../../types/reportTypes";

interface IndividualUserReportProps {
    dateStart: string;
    dateEnd: string;
}

export function IndividualUserReport({ dateStart, dateEnd }: IndividualUserReportProps) {
    const userId = useAuthStore(state => state.userId);
    const [user, setUser] = useState<any>(null);
    const [userActivities, setUserActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState<ReportRow[]>([]);
    const [fetched, setFetched] = useState(false);

    const location = useLocation();
    const navigate = useNavigate();

    // Handle share
    const handleShare = () => {
        if (!user) {
            toast.error("Selecciona un usuario para compartir.");
            return;
        }
        const params = new URLSearchParams();
        params.set("user", user.value);
        params.set("shared", "1");
        params.set("active_tab", "reporte-usuario");
        const shareUrl = `${window.location.origin}${location.pathname}?${params.toString()}`;
        navigator.clipboard.writeText(shareUrl);
        toast.success("¡Enlace copiado!");
    };

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const qUser = params.get("user");
        if (!qUser) {
            setUser(null);
            return;
        }
        // Only update if different
        if (!user || String(user.value) !== String(qUser)) {
            api.get("/auth/users/list", { params: { id: qUser } })
                .then(res => {
                    const u = res.data.results?.[0];
                    if (u) {
                        setUser({
                            value: u.id,
                            label: `${u.first_name} ${u.last_name} (${u.email})`
                        });
                    } else {
                        setUser({ value: qUser, label: "(Usuario desconocido)" });
                    }
                })
                .catch(() => {
                    setUser({ value: qUser, label: "(Usuario desconocido)" });
                });
        }
        // eslint-disable-next-line
    }, [location.search]);

    // Only trigger fetchReport when user state matches QP and shared=1
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const shared = params.get("shared");
        const qUser = params.get("user");
        if (
            shared === "1" &&
            qUser &&
            user &&
            String(user.value) === String(qUser)
        ) {
            fetchReport(true);
        }
        // eslint-disable-next-line
    }, [user, location.search]);

    // Async user search
    const loadUsers = async (inputValue: string) => {
        if (!inputValue) return [];
        try {
            const res = await api.get("/auth/users/list", {
                params: { name: inputValue }
            });
            return res.data.results.map((u: User) => ({
                value: u.id,
                label: `${u.first_name} ${u.last_name} (${u.email})`
            }));
        } catch {
            return [];
        }
    };

    // fetchReport: if sharedMode, don't update QPs; otherwise, update QPs and remove shared param
    const fetchReport = async (sharedMode = false) => {
        if (!dateStart || !dateEnd) {
            toast.error("Selecciona un rango de fechas.");
            return;
        }
        if (!user) {
            toast.error("Selecciona un usuario.");
            return;
        }
        setLoading(true);
        setFetched(false);

        if (!sharedMode) {
            // Update QPs, remove shared param
            const params = new URLSearchParams(location.search);
            params.set("user", user.value);
            params.delete("shared"); // <--- this is important!
            navigate(`${location.pathname}?${params.toString()}`, { replace: true });
        }

        try {
            const apiParams = {
                date_start: dateStart,
                date_end: dateEnd,
                user_id: user.value,
            };
            const res = await api.get("/reports/dashboard/user-role-report/", { params: apiParams });
            setReport(res.data.data);
            setFetched(true);
        } catch {
            toast.error("No se pudo generar el reporte.");
        } finally {
            setLoading(false);
        }
    };

    const filteredReport = useMemo(() => {
        if (user) {
            return report.filter(r => r.user_id === user.value);
        }
        return report;
    }, [report, user]);

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

    const casesCreatedData = useMemo(() => ({
        labels: filteredReport.map(r => r.full_name),
        datasets: [{
            label: "Casos Creados",
            data: filteredReport.map(r => r.total_cases_created),
            backgroundColor: "#f5c211"
        }]
    }), [filteredReport]);

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

    const casesCompletedData = useMemo(() => ({
        labels: filteredReport.map(r => r.full_name),
        datasets: [{
            label: "Casos Completados",
            data: filteredReport.map(r => r.total_cases_completed),
            backgroundColor: "#2CBA79"
        }]
    }), [filteredReport]);

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
                <div>
                    <button className="btn btn-primary" style={{ minWidth: 120 }} onClick={() => fetchReport(false)} disabled={loading}>
                        {loading ? "Generando..." : "Generar"}
                    </button>
                    {user && (
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
                                {user && userId != null && (
                                    <div className="card-body activity-log">
                                        <ActivityLog activities={userActivities} setActivities={setUserActivities} entity_type='user' entity_id={userId}/>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}