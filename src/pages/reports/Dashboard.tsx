import { toast } from 'react-toastify';
import { Pie, Bar, Line } from 'react-chartjs-2';
import { useState, useEffect } from "react";
import "../../styles/components/dashboard.css";
import { Spinner } from "../../components/ui/Spinner";
import { DashboardCase } from '../../types/workflowTypes';
import { useSidebarStore } from "../../stores/sidebarStore";
import { DashboardTotals } from "../../types/dashboardTypes";
import { AnimatedNumberCounter } from '../../components/ui/AnimatedNumberCounter';
import { fetchDashboardInfo } from "../../controllers/dashboardControllers";
import { ActivityLog } from '../../components/ui/ActivityLog';
import {
    Chart,
    ArcElement,
    BarElement,
    LineElement,
    PointElement,
    CategoryScale,
    LinearScale,
    Tooltip,
    Legend,
    ChartOptions,
} from 'chart.js';
import { parseISO, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Activity } from '../../types/activityTypes';

Chart.register(
    ArcElement,
    BarElement,
    LineElement,
    PointElement,
    CategoryScale,
    LinearScale,
    Tooltip,
    Legend
);

export function Dashboard() {
    const sidebarWidthPx = useSidebarStore((state) => state.sidebarWidthPx);
    const [loading, setLoading] = useState(true);
    const [totals, setTotals] = useState<DashboardTotals | null>(null);
    const [cases, setCases] = useState<DashboardCase[]>([]);
    const [caseActivities, setCaseActivities] = useState<Activity[]>([]);

    const totalsList = totals ? [
        { label: "Cantidad de Procesos", value: totals.total_workflows, icon: "bi-diagram-3", variant: "secondary" },
        { label: "Total de Casos", value: totals.total_cases, icon: "bi-collection", variant: "primary" },
        { label: "Casos Completados", value: totals.total_completed_cases, icon: "bi-check-circle", variant: "info" },
        { label: "Casos Pendientes", value: totals.total_pending_cases, icon: "bi-clock", variant: "warning" },
        { label: "Casos Exitosos", value: totals.total_successful_cases, icon: "bi-trophy", variant: "success" },
        { label: "Casos Fallidos", value: totals.total_failed_cases, icon: "bi-x-circle", variant: "danger" },
    ] : [];

    useEffect(() => {
        const loadInformation = async () => {
            try {
                const response = await fetchDashboardInfo();
                setTotals(response.data.totals);
                setCases(response.data.cases);
            } catch (error) {
                console.error("Error fetching dashboard info:", error);
                toast.error("Error al cargar la información del dashboard.");
            } finally {
                setLoading(false);
            }
        };
        
        loadInformation();
    }, []);

    const openCases = cases.filter(c => c.abierto).length;
    const closedCases = cases.filter(c => !c.abierto).length;
    const successfulCases = cases.filter(c => c.exitoso).length;
    const failedCases = cases.filter(c => !c.exitoso).length;

    const processCounts = cases.reduce((acc, c) => {
        acc[c.proceso] = (acc[c.proceso] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const orderedSpanishMonths = [
        "enero", "febrero", "marzo", "abril", "mayo", "junio",
        "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
    ];
    
    const monthlyPerformanceRaw = cases.reduce((acc, c) => {
        const date = parseISO(c.fecha_cierre);
        const month = format(date, 'MMMM', { locale: es }); // full lowercase Spanish name
        acc[month] = (acc[month] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    
    const monthlyPerformance = orderedSpanishMonths.reduce((acc, month) => {
        acc[month] = monthlyPerformanceRaw[month] || 0;
        return acc;
    }, {} as Record<string, number>);

    const sharedOptions: ChartOptions<'pie' | 'bar'> = {
        responsive: true,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    boxWidth: 15,
                    padding: 20,
                }
            },
            tooltip: {
                callbacks: {
                    label: (ctx) => `${ctx.label}: ${ctx.raw} casos`
                }
            }
        }
    };

    const lineOptions: ChartOptions<'line'> = {
        responsive: true,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: (ctx) => `${ctx.raw} casos`
                }
            }
        },
        scales: {
            y: { beginAtZero: true, ticks: { stepSize: 1 } }
        }
    };

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

    const lineData = {
        labels: Object.keys(monthlyPerformance),
        datasets: [{
            label: "Casos Completados por Mes",
            data: Object.values(monthlyPerformance),
            borderColor: "#0d6efd",
            backgroundColor: "#0d6efd88",
            tension: 0.4,
            pointRadius: 4,
            fill: false,
        }],
    };

    return (
        <>
            {loading ? (
                <div className="d-flex justify-content-center align-items-center" style={{ height: "70vh" }}>
                    <Spinner className='spinner-border-lg' />
                </div>
            ) : (
                <>
                    <div className="totals-container">
                        {totalsList.map((item, idx) => (
                            <div key={idx} className="card-body">
                                <i className={`bi ${item.icon} text-${item.variant} me-3`} style={{ fontSize: "2rem" }}></i>
                                <div>
                                    <h6 className="mb-1 text-muted">
                                        {item.label}
                                    </h6>
                                    <h4 className={`text-${item.variant} fw-bold`}>
                                        <AnimatedNumberCounter value={item.value} />
                                    </h4>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="charts-container">
                        <div className="card-body chart pie-chart">
                            <div className="chart-title">
                                <h5 className="h4-header">Distribución de Casos</h5>
                                <p className="text-muted mb-3">Abiertos vs. Cerrados</p>
                            </div>
                            <div style={{ position: "relative", width: "100%", height: "260px" }}>
                                <Pie data={openClosedData} options={{ ...sharedOptions, cutout: '70%' }} />
                            </div>
                        </div>
                        <div className="card-body chart pie-chart">
                            <div className="chart-title">
                                <h5 className="h4-header">Estado de Casos</h5>
                                <p className="text-muted mb-3">Exitosos vs. Fallidos</p>
                            </div>
                            <div style={{ position: "relative", width: "100%", height: "260px" }}>
                                <Pie data={successFailedData} options={{ ...sharedOptions, cutout: '70%' }} />
                            </div>
                        </div>
                        <div className="card-body chart">
                            <div className="chart-title">
                                <h5 className="h4-header">Casos por Proceso</h5>
                                <p className="text-muted mb-3">Distribución por tipo de proceso</p>
                            </div>
                            <Bar data={processData} options={sharedOptions} />
                        </div>
                        <div className="card-body chart">
                            <div className="chart-title">
                                <h5 className="h4-header">Rendimiento</h5>
                                <p className="text-muted mb-3">Casos completados por mes</p>
                            </div>
                            <Line data={lineData} options={lineOptions} />
                        </div>
                        <div className="card-body activity-log">
                            <ActivityLog activities={caseActivities} setActivities={setCaseActivities} entity_type='case'/>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
