import { toast } from 'react-toastify';
import { Pie, Bar, Line } from 'react-chartjs-2';
import { useState, useEffect } from "react";
import "../../styles/components/dashboard.css";
import { Spinner } from "../../components/ui/Spinner";
import { DashboardCase } from '../../types/workflowTypes';
import { DashboardTotals } from "../../types/dashboardTypes";
import { AnimatedNumberCounter } from '../../components/ui/AnimatedNumberCounter';
import { fetchDashboardInfo, fetchEnhancedDashboard, fetchCustomKPIs, createCustomKPI, updateCustomKPI, deleteCustomKPI, EnhancedDashboardFilters } from "../../controllers/dashboardControllers";
import { ActivityLog } from '../../components/ui/ActivityLog';
import { useAuthStore } from "../../stores/authStore";
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

interface DashboardProps {
    dateStart: string;
    dateEnd: string;
    sucursal_id?: number;
    region?: string;
    restructurado?: string;
}

interface CustomKPI {
    id: number;
    name: string;
    description: string;
    metric_type: string;
    metric_type_display: string;
    value: number;
    unit: string;
}

interface RestructuredMetrics {
    restructured: {
        label: string;
        total_cases: number;
        completed_cases: number;
        successful_cases: number;
        failed_cases: number;
        pending_cases: number;
        total_value: number;
        success_rate: number;
    };
    non_restructured: {
        label: string;
        total_cases: number;
        completed_cases: number;
        successful_cases: number;
        failed_cases: number;
        pending_cases: number;
        total_value: number;
        success_rate: number;
    };
}

export function Dashboard({ dateStart, dateEnd, sucursal_id, region, restructurado }: DashboardProps) {
    const authStore = useAuthStore();
    const isAdminUser = authStore.isAdmin();
    
    const [loading, setLoading] = useState(true);
    const [totals, setTotals] = useState<DashboardTotals | null>(null);
    const [cases, setCases] = useState<DashboardCase[]>([]);
    const [caseActivities, setCaseActivities] = useState<Activity[]>([]);
    const [customKPIs, setCustomKPIs] = useState<CustomKPI[]>([]);
    const [restructuredMetrics, setRestructuredMetrics] = useState<RestructuredMetrics | null>(null);
    const [casesBySuccursal, setCasesBySuccursal] = useState<any[]>([]);
    const [casesByRegion, setCasesByRegion] = useState<any[]>([]);
    const [casesByFondo, setCasesByFondo] = useState<any[]>([]);
    const [topProducts, setTopProducts] = useState<any[]>([]);
    const [topDenialReasons, setTopDenialReasons] = useState<any[]>([]);
    
    // KPI Management Modal State
    const [showKPIModal, setShowKPIModal] = useState(false);
    const [editingKPIId, setEditingKPIId] = useState<number | null>(null);
    const [kpiFormLoading, setKpiFormLoading] = useState(false);
    const [kpiForm, setKpiForm] = useState({
        name: '',
        description: '',
        metric_type: 'success_rate',
        active: true
    });
    
    const metricTypes = [
        { value: 'total_cases', label: 'Total de Casos' },
        { value: 'completed_cases', label: 'Casos Completados' },
        { value: 'successful_cases', label: 'Casos Exitosos' },
        { value: 'failed_cases', label: 'Casos Fallidos' },
        { value: 'pending_cases', label: 'Casos Pendientes' },
        { value: 'success_rate', label: 'Tasa de Éxito (%)' },
        { value: 'completion_rate', label: 'Tasa de Finalización (%)' },
        { value: 'total_value', label: 'Valor Total (COP)' },
        { value: 'average_value', label: 'Valor Promedio (COP)' },
    ];
    
    const totalsList = totals ? [
        { label: "Cantidad de Procesos", value: totals.total_workflows, icon: "bi-diagram-3", variant: "secondary" },
        { label: "Total de Casos", value: totals.total_cases, icon: "bi-collection", variant: "primary" },
        { label: "Casos Completados", value: totals.total_completed_cases, icon: "bi-check-circle", variant: "info" },
        { label: "Casos Pendientes", value: totals.total_pending_cases, icon: "bi-clock", variant: "warning" },
        { label: "Casos Exitosos", value: totals.total_successful_cases, icon: "bi-trophy", variant: "success" },
        { label: "Casos Fallidos", value: totals.total_failed_cases, icon: "bi-x-circle", variant: "danger" },
    ] : [];
    
    // Fetch KPIs on component mount
    useEffect(() => {
        const loadKPIs = async () => {
            try {
                const data = await fetchCustomKPIs();
                if (data?.data) {
                    setCustomKPIs(data.data);
                }
            } catch (error) {
                console.error("Error fetching KPIs:", error);
            }
        };
        loadKPIs();
    }, []);
    
    useEffect(() => {
        const loadInformation = async () => {
            try {
                setLoading(true);
                
                // Use enhanced dashboard if available
                const filters: EnhancedDashboardFilters = {
                    date_start: dateStart,
                    date_end: dateEnd,
                    sucursal_id,
                    region,
                    restructurado: restructurado ? (restructurado === 'true' ? true : false) : undefined
                };
                
                const response = await fetchEnhancedDashboard(filters);
                
                if (response?.data) {
                    if (response.data.summary) {
                        setTotals({
                            total_workflows: response.data.summary.total_workflows,
                            total_cases: response.data.summary.total_cases,
                            total_completed_cases: response.data.summary.total_completed_cases,
                            total_pending_cases: response.data.summary.total_pending_cases,
                            total_successful_cases: response.data.summary.total_successful_cases,
                            total_failed_cases: response.data.summary.total_failed_cases,
                        } as DashboardTotals);
                    }
                    setCases(response.data.recent_cases || []);
                    setCustomKPIs(response.data.custom_kpis || []);
                    setRestructuredMetrics(response.data.restructured_metrics || null);
                    setCasesBySuccursal(response.data.cases_by_sucursal || []);
                    setCasesByRegion(response.data.cases_by_region || []);
                    setCasesByFondo(response.data.cases_by_fondo || []);
                    setTopProducts(response.data.top_products || []);
                    setTopDenialReasons(response.data.top_denial_reasons || []);
                } else {
                    // Fallback to old endpoint if new one fails
                    const fallbackResponse = await fetchDashboardInfo(dateStart, dateEnd);
                    setTotals(fallbackResponse.data.totals);
                    setCases(fallbackResponse.data.cases);
                }
            } catch (error) {
                console.error("Error fetching dashboard info:", error);
                toast.error("Error al cargar la información del dashboard.");
            } finally {
                setLoading(false);
            }
        };
        
        // if dates are empty, show the spinner
        if (dateStart === "" || dateEnd === "") {
            setLoading(true);
            return;
        }
        
        if (dateStart && dateEnd) {
            loadInformation();
        }
    }, [dateStart, dateEnd, sucursal_id, region, restructurado]);
    
    // KPI Management Handlers
    const handleOpenKPIModal = async () => {
        if (!isAdminUser) {
            toast.error("Solo administradores pueden gestionar KPIs");
            return;
        }
        setShowKPIModal(true);
    };

    const handleSaveKPI = async () => {
        if (!isAdminUser) {
            toast.error("Solo administradores pueden guardar KPIs");
            return;
        }

        if (!kpiForm.name.trim() || !kpiForm.description.trim()) {
            toast.warning("El nombre y la descripción son obligatorios");
            return;
        }

        setKpiFormLoading(true);
        try {
            if (editingKPIId) {
                await updateCustomKPI(editingKPIId, kpiForm);
                toast.success("KPI actualizado correctamente");
            } else {
                await createCustomKPI(kpiForm);
                toast.success("KPI creado correctamente");
            }
            
            // Refresh KPIs
            const data = await fetchCustomKPIs();
            if (data?.data) {
                setCustomKPIs(data.data);
            }
            
            // Reset form
            setKpiForm({
                name: '',
                description: '',
                metric_type: 'success_rate',
                active: true
            });
            setEditingKPIId(null);
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Error al guardar el KPI");
        } finally {
            setKpiFormLoading(false);
        }
    };

    const handleEditKPI = (kpi: CustomKPI) => {
        if (!isAdminUser) {
            toast.error("Solo administradores pueden editar KPIs");
            return;
        }
        
        setEditingKPIId(kpi.id);
        setKpiForm({
            name: kpi.name,
            description: kpi.description,
            metric_type: kpi.metric_type,
            active: true
        });
    };

    const handleDeleteKPI = async (kpi_id: number) => {
        if (!isAdminUser) {
            toast.error("Solo administradores pueden eliminar KPIs");
            return;
        }

        if (!window.confirm("¿Estás seguro de que deseas eliminar este KPI?")) {
            return;
        }

        try {
            await deleteCustomKPI(kpi_id);
            toast.success("KPI eliminado correctamente");
            
            // Refresh KPIs
            const data = await fetchCustomKPIs();
            if (data?.data) {
                setCustomKPIs(data.data);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Error al eliminar el KPI");
        }
    };

    const handleCloseKPIModal = () => {
        setShowKPIModal(false);
        setEditingKPIId(null);
        setKpiForm({
            name: '',
            description: '',
            metric_type: 'success_rate',
            active: true
        });
    };
    
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
    
    const pieOptions: ChartOptions<'pie'> = {
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
    
    const barOptions: ChartOptions<'bar'> = {
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

                    {/* CUSTOM KPIs SECTION */}
                    {(customKPIs.length > 0 || isAdminUser) && (
                        <div className="custom-kpis-section" style={{ marginBottom: '30px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginLeft: '25px', marginRight: '25px', marginBottom: '20px' }}>
                                <h3 style={{ fontWeight: 600, color: '#212529', margin: 0 }}>
                                    Indicadores Clave de Desempeño (KPIs)
                                </h3>
                                {isAdminUser && (
                                    <button
                                        onClick={handleOpenKPIModal}
                                        className="btn btn-sm btn-outline-secondary"
                                        style={{ padding: '6px 10px' }}
                                        title="Administrar KPIs"
                                    >
                                        <i className="bi bi-gear"></i>
                                    </button>
                                )}
                            </div>
                            {customKPIs.length > 0 ? (
                                <div className="charts-container" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                                    {customKPIs.map(kpi => (
                                    <div key={kpi.id} className="card-body" style={{ textAlign: 'center', borderLeft: '4px solid #0d6efd' }}>
                                        <h6 style={{ marginBottom: '8px', color: '#0d6efd', fontWeight: 600 }}>
                                            {kpi.name}
                                        </h6>
                                        <p style={{ color: '#6c757d', fontSize: '12px', marginBottom: '12px' }}>
                                            {kpi.description}
                                        </p>
                                        <div style={{ fontSize: '24px', fontWeight: 700, color: '#212529', marginBottom: '4px' }}>
                                            {typeof kpi.value === 'number' ? kpi.value.toLocaleString('es-CO', { maximumFractionDigits: 2 }) : kpi.value}
                                        </div>
                                        <small style={{ color: '#6c757d', fontWeight: 500 }}>
                                            {kpi.unit}
                                        </small>
                                    </div>
                                ))}
                                </div>
                            ) : (
                                <div style={{ padding: '20px', textAlign: 'center', color: '#6c757d' }}>
                                    <p><i className="bi bi-info-circle me-2"></i>No hay KPIs creados. Haz clic en el icono de engranaje para crear uno.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* RESTRUCTURED METRICS SECTION */}
                    {restructuredMetrics && (
                        <div style={{ marginBottom: '30px' }}>
                            <h3 style={{ marginLeft: '25px', marginBottom: '20px', fontWeight: 600, color: '#212529' }}>
                                Análisis: Casos Restructurados vs No Restructurados
                            </h3>
                            <div className="charts-container" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
                                {/* Restructured Card */}
                                <div className="card-body" style={{ borderTop: '3px solid #dc3545' }}>
                                    <h6 style={{ marginBottom: '15px', color: '#dc3545', fontWeight: 600 }}>
                                        {restructuredMetrics.restructured.label}
                                    </h6>
                                    <div style={{ fontSize: '12px', lineHeight: '1.8' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                            <span style={{ color: '#6c757d' }}>Total:</span>
                                            <strong>{restructuredMetrics.restructured.total_cases}</strong>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                            <span style={{ color: '#6c757d' }}>Completados:</span>
                                            <strong>{restructuredMetrics.restructured.completed_cases}</strong>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                            <span style={{ color: '#6c757d' }}>Exitosos:</span>
                                            <strong style={{ color: '#2CBA79' }}>{restructuredMetrics.restructured.successful_cases}</strong>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                            <span style={{ color: '#6c757d' }}>Fallidos:</span>
                                            <strong style={{ color: '#dc3545' }}>{restructuredMetrics.restructured.failed_cases}</strong>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                            <span style={{ color: '#6c757d' }}>Pendientes:</span>
                                            <strong>{restructuredMetrics.restructured.pending_cases}</strong>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', paddingTop: '6px', borderTop: '1px solid #dee2e6' }}>
                                            <span style={{ color: '#6c757d' }}>Valor Total:</span>
                                            <strong>${restructuredMetrics.restructured.total_value.toLocaleString('es-CO')}</strong>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #dee2e6', fontWeight: 700, color: '#0d6efd' }}>
                                            <span>Tasa Éxito:</span>
                                            <span>{restructuredMetrics.restructured.success_rate.toFixed(2)}%</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Non-Restructured Card */}
                                <div className="card-body" style={{ borderTop: '3px solid #2CBA79' }}>
                                    <h6 style={{ marginBottom: '15px', color: '#2CBA79', fontWeight: 600 }}>
                                        {restructuredMetrics.non_restructured.label}
                                    </h6>
                                    <div style={{ fontSize: '12px', lineHeight: '1.8' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                            <span style={{ color: '#6c757d' }}>Total:</span>
                                            <strong>{restructuredMetrics.non_restructured.total_cases}</strong>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                            <span style={{ color: '#6c757d' }}>Completados:</span>
                                            <strong>{restructuredMetrics.non_restructured.completed_cases}</strong>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                            <span style={{ color: '#6c757d' }}>Exitosos:</span>
                                            <strong style={{ color: '#2CBA79' }}>{restructuredMetrics.non_restructured.successful_cases}</strong>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                            <span style={{ color: '#6c757d' }}>Fallidos:</span>
                                            <strong style={{ color: '#dc3545' }}>{restructuredMetrics.non_restructured.failed_cases}</strong>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                            <span style={{ color: '#6c757d' }}>Pendientes:</span>
                                            <strong>{restructuredMetrics.non_restructured.pending_cases}</strong>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', paddingTop: '6px', borderTop: '1px solid #dee2e6' }}>
                                            <span style={{ color: '#6c757d' }}>Valor Total:</span>
                                            <strong>${restructuredMetrics.non_restructured.total_value.toLocaleString('es-CO')}</strong>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #dee2e6', fontWeight: 700, color: '#0d6efd' }}>
                                            <span>Tasa Éxito:</span>
                                            <span>{restructuredMetrics.non_restructured.success_rate.toFixed(2)}%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* CHARTS SECTION */}
                    {/* Cases by Sucursal */}
                    {casesBySuccursal.length > 0 && (
                        <div className="charts-container">
                            <div className="card-body chart">
                                <div className="chart-title">
                                    <h5 className="h4-header">Casos por Sucursal</h5>
                                    <p className="text-muted mb-3">Distribución y tasa de éxito</p>
                                </div>
                                <Bar data={{
                                    labels: casesBySuccursal.map(s => s.nombre_sucursal),
                                    datasets: [
                                        {
                                            label: 'Total Casos',
                                            data: casesBySuccursal.map(s => s.total_cases),
                                            backgroundColor: '#0d6efd',
                                            borderColor: '#0d6efd',
                                            borderWidth: 1
                                        },
                                        {
                                            label: 'Exitosos',
                                            data: casesBySuccursal.map(s => s.successful_cases),
                                            backgroundColor: '#2CBA79',
                                            borderColor: '#2CBA79',
                                            borderWidth: 1
                                        }
                                    ]
                                }} options={barOptions} />
                            </div>
                        </div>
                    )}

                    {/* Cases by Region */}
                    {casesByRegion.length > 0 && (
                        <div className="charts-container">
                            <div className="card-body chart pie-chart">
                                <div className="chart-title">
                                    <h5 className="h4-header">Distribución por Región</h5>
                                    <p className="text-muted mb-3">Casos por región geográfica</p>
                                </div>
                                <div style={{ position: "relative", width: "100%", height: "260px" }}>
                                    <Pie data={{
                                        labels: casesByRegion.map(r => r.region),
                                        datasets: [{
                                            data: casesByRegion.map(r => r.total_cases),
                                            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
                                            borderColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
                                            borderWidth: 1
                                        }]
                                    }} options={{ ...pieOptions }} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Cases by Fondo */}
                    {casesByFondo.length > 0 && (
                        <div className="charts-container">
                            <div className="card-body chart">
                                <div className="chart-title">
                                    <h5 className="h4-header">Casos por Fondo Crediticio</h5>
                                    <p className="text-muted mb-3">Distribución y rendimiento por fondo</p>
                                </div>
                                <Bar data={{
                                    labels: casesByFondo.map(f => f.nombre_fondo),
                                    datasets: [
                                        {
                                            label: 'Total Casos',
                                            data: casesByFondo.map(f => f.total_cases),
                                            backgroundColor: '#0d6efd',
                                            borderColor: '#0d6efd',
                                            borderWidth: 1
                                        },
                                        {
                                            label: 'Completados',
                                            data: casesByFondo.map(f => f.completed_cases),
                                            backgroundColor: '#FFC107',
                                            borderColor: '#FFC107',
                                            borderWidth: 1
                                        }
                                    ]
                                }} options={barOptions} />
                            </div>
                        </div>
                    )}

                    {/* Top Products */}
                    {topProducts.length > 0 && (
                        <div className="charts-container">
                            <div className="card-body chart">
                                <div className="chart-title">
                                    <h5 className="h4-header">Productos Principales</h5>
                                    <p className="text-muted mb-3">Top 10 productos por volumen y éxito</p>
                                </div>
                                <Bar data={{
                                    labels: topProducts.map(p => p.nombre_producto),
                                    datasets: [
                                        {
                                            label: 'Total Casos',
                                            data: topProducts.map(p => p.total_cases),
                                            backgroundColor: '#36A2EB',
                                            borderColor: '#36A2EB',
                                            borderWidth: 1
                                        },
                                        {
                                            label: 'Exitosos',
                                            data: topProducts.map(p => p.successful_cases),
                                            backgroundColor: '#2CBA79',
                                            borderColor: '#2CBA79',
                                            borderWidth: 1
                                        }
                                    ]
                                }} options={barOptions} />
                            </div>
                        </div>
                    )}

                    {/* Top Denial Reasons */}
                    {topDenialReasons.length > 0 && (
                        <div className="charts-container">
                            <div className="card-body chart pie-chart">
                                <div className="chart-title">
                                    <h5 className="h4-header">Razones Principales de Rechazo</h5>
                                    <p className="text-muted mb-3">Motivos más frecuentes de negación</p>
                                </div>
                                <div style={{ position: "relative", width: "100%", height: "260px" }}>
                                    <Pie data={{
                                        labels: topDenialReasons.map(r => r.razon_rechazo),
                                        datasets: [{
                                            data: topDenialReasons.map(r => r.total_denials),
                                            backgroundColor: ['#FF6384', '#FF9999', '#FFCC99', '#FFFF99', '#CCFF99'],
                                            borderColor: ['#FF6384', '#FF9999', '#FFCC99', '#FFFF99', '#CCFF99'],
                                            borderWidth: 1
                                        }]
                                    }} options={{ ...pieOptions }} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* RECENT CASES TABLE */}
                    {cases.length > 0 && (
                        <div style={{ marginTop: '30px', marginBottom: '30px', marginLeft: '25px', marginRight: '25px' }}>
                            <h3 style={{ marginBottom: '20px', fontWeight: 600, color: '#212529' }}>
                                Casos Recientes
                            </h3>
                            <div className="table-responsive">
                                <table className="table table-striped table-hover">
                                    <thead style={{ backgroundColor: '#f8f9fa', borderTop: '1px solid #dee2e6' }}>
                                        <tr>
                                            <th style={{ fontSize: '12px', fontWeight: 600, color: '#495057' }}>ID Caso</th>
                                            <th style={{ fontSize: '12px', fontWeight: 600, color: '#495057' }}>Nombre</th>
                                            <th style={{ fontSize: '12px', fontWeight: 600, color: '#495057' }}>Sucursal</th>
                                            <th style={{ fontSize: '12px', fontWeight: 600, color: '#495057' }}>Región</th>
                                            <th style={{ fontSize: '12px', fontWeight: 600, color: '#495057' }}>Fondo</th>
                                            <th style={{ fontSize: '12px', fontWeight: 600, color: '#495057' }}>Producto</th>
                                            <th style={{ fontSize: '12px', fontWeight: 600, color: '#495057' }}>Valor</th>
                                            <th style={{ fontSize: '12px', fontWeight: 600, color: '#495057' }}>Proceso</th>
                                            <th style={{ fontSize: '12px', fontWeight: 600, color: '#495057' }}>Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {cases.slice(0, 20).map((caso, idx) => (
                                            <tr key={idx} style={{ fontSize: '12px', borderBottom: '1px solid #dee2e6' }}>
                                                <td style={{ color: '#0d6efd', fontWeight: 500 }}>#{caso.id_caso}</td>
                                                <td>{caso.nombre_caso}</td>
                                                <td>{(caso as any).sucursal_nombre || 'N/A'}</td>
                                                <td>{(caso as any).region || 'N/A'}</td>
                                                <td>{(caso as any).fondo_nombre || 'N/A'}</td>
                                                <td>{(caso as any).producto_nombre || 'N/A'}</td>
                                                <td>
                                                    ${caso.valor_caso?.toLocaleString('es-CO', { maximumFractionDigits: 0 }) || '0'}
                                                </td>
                                                <td>{caso.proceso}</td>
                                                <td>
                                                    {caso.abierto ? (
                                                        <span className="badge bg-warning">Abierto</span>
                                                    ) : caso.exitoso ? (
                                                        <span className="badge bg-success">Exitoso</span>
                                                    ) : (
                                                        <span className="badge bg-danger">Rechazado</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    <div className="charts-container">
                        <div className="card-body chart pie-chart">
                            <div className="chart-title">
                                <h5 className="h4-header">Distribución de Casos</h5>
                                <p className="text-muted mb-3">Abiertos vs. Cerrados</p>
                            </div>
                            <div style={{ position: "relative", width: "100%", height: "260px" }}>
                                <Pie data={openClosedData} options={{ ...pieOptions }} />
                            </div>
                        </div>
                        <div className="card-body chart pie-chart">
                            <div className="chart-title">
                                <h5 className="h4-header">Estado de Casos</h5>
                                <p className="text-muted mb-3">Exitosos vs. Fallidos</p>
                            </div>
                            <div style={{ position: "relative", width: "100%", height: "260px" }}>
                                <Pie data={successFailedData} options={{ ...pieOptions, cutout: '70%' }} />
                            </div>
                        </div>
                        <div className="card-body chart">
                            <div className="chart-title">
                                <h5 className="h4-header">Casos por Proceso</h5>
                                <p className="text-muted mb-3">Distribución por tipo de proceso</p>
                            </div>
                            <Bar data={processData} options={barOptions} />
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

                    {/* KPI MANAGEMENT MODAL */}
                    {showKPIModal && isAdminUser && (
                        <div style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            zIndex: 1050
                        }}>
                            <div style={{
                                backgroundColor: 'white',
                                borderRadius: '8px',
                                width: '90%',
                                maxWidth: '800px',
                                maxHeight: '90vh',
                                overflowY: 'auto',
                                padding: '30px',
                                boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                                    <h3 style={{ margin: 0, fontWeight: 600, color: '#212529' }}>
                                        <i className="bi bi-gear me-2"></i>Administrar KPIs
                                    </h3>
                                    <button
                                        onClick={handleCloseKPIModal}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            fontSize: '24px',
                                            color: '#6c757d',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        ×
                                    </button>
                                </div>

                                {/* KPI FORM */}
                                <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
                                    <h5 style={{ marginBottom: '15px', fontWeight: 600, color: '#212529' }}>
                                        {editingKPIId ? 'Editar KPI' : 'Crear Nuevo KPI'}
                                    </h5>
                                    
                                    <div style={{ marginBottom: '15px' }}>
                                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, fontSize: '14px' }}>
                                            Nombre <span style={{ color: '#dc3545' }}>*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={kpiForm.name}
                                            onChange={(e) => setKpiForm({ ...kpiForm, name: e.target.value })}
                                            placeholder="Ej: Tasa de Éxito Objetivo"
                                        />
                                    </div>

                                    <div style={{ marginBottom: '15px' }}>
                                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, fontSize: '14px' }}>
                                            Descripción <span style={{ color: '#dc3545' }}>*</span>
                                        </label>
                                        <textarea
                                            className="form-control"
                                            value={kpiForm.description}
                                            onChange={(e) => setKpiForm({ ...kpiForm, description: e.target.value })}
                                            placeholder="Ej: Porcentaje de tasa de éxito general"
                                            rows={3}
                                        />
                                    </div>

                                    <div style={{ marginBottom: '15px' }}>
                                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, fontSize: '14px' }}>
                                            Tipo de Métrica <span style={{ color: '#dc3545' }}>*</span>
                                        </label>
                                        <select
                                            className="form-control"
                                            value={kpiForm.metric_type}
                                            onChange={(e) => setKpiForm({ ...kpiForm, metric_type: e.target.value })}
                                        >
                                            {metricTypes.map(type => (
                                                <option key={type.value} value={type.value}>
                                                    {type.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button
                                            onClick={handleSaveKPI}
                                            disabled={kpiFormLoading}
                                            className="btn btn-primary"
                                            style={{ flex: 1 }}
                                        >
                                            {kpiFormLoading ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                    Guardando...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="bi bi-check-circle me-2"></i>
                                                    {editingKPIId ? 'Actualizar' : 'Crear'} KPI
                                                </>
                                            )}
                                        </button>
                                        {editingKPIId && (
                                            <button
                                                onClick={() => {
                                                    setEditingKPIId(null);
                                                    setKpiForm({
                                                        name: '',
                                                        description: '',
                                                        metric_type: 'success_rate',
                                                        active: true
                                                    });
                                                }}
                                                className="btn btn-outline-secondary"
                                            >
                                                Cancelar Edición
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* KPI LIST */}
                                <h5 style={{ marginBottom: '15px', fontWeight: 600, color: '#212529' }}>
                                    KPIs Existentes ({customKPIs.length})
                                </h5>
                                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                    {customKPIs.length === 0 ? (
                                        <p style={{ color: '#6c757d', textAlign: 'center', padding: '20px' }}>
                                            No hay KPIs creados aún.
                                        </p>
                                    ) : (
                                        <table className="table table-sm table-hover">
                                            <thead style={{ backgroundColor: '#f8f9fa' }}>
                                                <tr>
                                                    <th style={{ fontSize: '12px', fontWeight: 600 }}>Nombre</th>
                                                    <th style={{ fontSize: '12px', fontWeight: 600 }}>Descripción</th>
                                                    <th style={{ fontSize: '12px', fontWeight: 600 }}>Tipo de Métrica</th>
                                                    <th style={{ fontSize: '12px', fontWeight: 600, textAlign: 'center' }}>Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {customKPIs.map(kpi => (
                                                    <tr key={kpi.id}>
                                                        <td style={{ fontSize: '12px', fontWeight: 500 }}>
                                                            {kpi.name}
                                                        </td>
                                                        <td style={{ fontSize: '12px', color: '#6c757d' }}>
                                                            {kpi.description}
                                                        </td>
                                                        <td style={{ fontSize: '12px' }}>
                                                            <span className="badge bg-info">
                                                                {metricTypes.find(t => t.value === kpi.metric_type)?.label || kpi.metric_type}
                                                            </span>
                                                        </td>
                                                        <td style={{ textAlign: 'center', fontSize: '12px' }}>
                                                            <button
                                                                onClick={() => handleEditKPI(kpi)}
                                                                className="btn btn-sm btn-outline-primary me-2"
                                                                title="Editar"
                                                            >
                                                                <i className="bi bi-pencil"></i>
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteKPI(kpi.id)}
                                                                className="btn btn-sm btn-outline-danger"
                                                                title="Eliminar"
                                                            >
                                                                <i className="bi bi-trash"></i>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>

                                <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                    <button
                                        onClick={handleCloseKPIModal}
                                        className="btn btn-secondary"
                                    >
                                        Cerrar
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </>
    );
}
