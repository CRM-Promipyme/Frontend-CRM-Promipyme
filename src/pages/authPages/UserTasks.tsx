import { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import api from "../../controllers/api";
import { useNavigate } from "react-router-dom";
import { Spinner } from "../../components/ui/Spinner";
import { Task, PaginatedTasks, Caso } from "../../types/workflowTypes";
import { useState, useEffect } from "react";

interface UserTasksProps {
    userId: string | number;
}

interface CaseData {
    case: Caso
}

export function UserTasks({ userId }: UserTasksProps) {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [nextUrl, setNextUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [filterStatus, setFilterStatus] = useState<'pending' | 'completed' | 'all'>('pending');
    const containerRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    // Fetch tasks (initial and paginated)
    const fetchTasks = async (url?: string, status?: 'pending' | 'completed' | 'all') => {
        setLoading(true);
        try {
            let endpoint: string = url || `/workflows/casos/manage/tasks/user/list/${userId}/`;
            if (!url && status && status !== 'all') {
                endpoint += `?status=${status}`;
            }
            const res = await api.get<PaginatedTasks>(endpoint);
            setTasks(prev => url ? [...prev, ...res.data.results] : res.data.results);
            setNextUrl(res.data.next);
        } catch {
            toast.error("No se pudieron cargar las tareas.");
        } finally {
            setLoading(false);
        }
    };

    // Initial fetch
    useEffect(() => {
        setTasks([]);
        setNextUrl(null);
        fetchTasks(undefined, filterStatus);
        // eslint-disable-next-line
    }, [userId, filterStatus]);

    // Infinite scroll handler
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleScroll = () => {
            if (
                container.scrollTop + container.clientHeight >= container.scrollHeight - 10 &&
                nextUrl &&
                !loading
            ) {
                fetchTasks(nextUrl);
            }
        };

        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, [nextUrl, loading, tasks]);

    // Helpers
    const formatDate = (dateStr: string | null) =>
        dateStr ? new Date(dateStr).toLocaleDateString() : '—';

    const getFilteredTasks = () => {
        // Return all tasks since we're now filtering via API
        return tasks;
    };

    return (
        <div style={{ width: '100%' }}>
            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <button
                    type="button"
                    onClick={() => setFilterStatus('pending')}
                    style={{
                        padding: '8px 16px',
                        borderRadius: '6px',
                        border: 'none',
                        fontSize: '13px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        backgroundColor: filterStatus === 'pending' ? '#0d6efd' : '#e5e7eb',
                        color: filterStatus === 'pending' ? '#fff' : '#333',
                        transition: 'all 0.2s ease'
                    }}
                >
                    <i className="bi bi-clock-history" style={{ marginRight: '6px' }}></i>
                    Pendientes
                </button>
                <button
                    type="button"
                    onClick={() => setFilterStatus('completed')}
                    style={{
                        padding: '8px 16px',
                        borderRadius: '6px',
                        border: 'none',
                        fontSize: '13px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        backgroundColor: filterStatus === 'completed' ? '#198754' : '#e5e7eb',
                        color: filterStatus === 'completed' ? '#fff' : '#333',
                        transition: 'all 0.2s ease'
                    }}
                >
                    <i className="bi bi-check-circle" style={{ marginRight: '6px' }}></i>
                    Completadas
                </button>
                <button
                    type="button"
                    onClick={() => setFilterStatus('all')}
                    style={{
                        padding: '8px 16px',
                        borderRadius: '6px',
                        border: 'none',
                        fontSize: '13px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        backgroundColor: filterStatus === 'all' ? '#6c757d' : '#e5e7eb',
                        color: filterStatus === 'all' ? '#fff' : '#333',
                        transition: 'all 0.2s ease'
                    }}
                >
                    <i className="bi bi-funnel" style={{ marginRight: '6px' }}></i>
                    Todas
                </button>
            </div>

            <div
                className="task-list-container"
                ref={containerRef}
                style={{
                    maxHeight: 400,
                    overflowY: 'auto',
                    borderRadius: 10,
                    padding: 16,
                    background: '#fff',
                    width: '100%',
                }}
            >
                {getFilteredTasks().length === 0 && !loading && (
                    <div className="text-muted text-center py-4">
                        {filterStatus === 'pending' && 'No hay tareas pendientes.'}
                        {filterStatus === 'completed' && 'No hay tareas completadas.'}
                        {filterStatus === 'all' && 'No hay tareas asignadas.'}
                    </div>
                )}
                <AnimatePresence>
                    {getFilteredTasks().map(task => (
                        <motion.div
                            key={task.id_tarea_caso}
                            layout
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            transition={{ duration: 0.2 }}
                            style={{
                                border: '1px solid #e5e7eb',
                                borderRadius: 8,
                                marginBottom: 14,
                                padding: 14,
                                background: '#fdfdfd',
                                cursor: 'pointer',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                            }}
                            onClick={async () => {
                                const response = await api.get(`/workflows/casos/list/?case_id=${task.caso}`);
                                const caseData: CaseData = response.data;
                                const processId = caseData.case.proceso;
                                navigate(`/workflows/board-view/${processId}?active_tab=case-list-tab&selected_case=${task.caso}`);
                            }}
                        >
                            {/* Collapsed view */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: 16 }}>{task.nombre_tarea}</div>
                                    <div style={{ fontSize: 13, color: '#888' }}>
                                        Asignado a: {task.usuario_asignado_first_name} {task.usuario_asignado_last_name}
                                    </div>
                                    <div style={{ fontSize: 13, color: '#888' }}>
                                        Fecha asignación: {formatDate(task.fecha_creacion)}
                                    </div>
                                </div>
                                <div>
                                    <span className={`badge ${task.completado ? 'bg-success' : 'bg-secondary'}`}>
                                        {task.completado ? 'Completado' : 'Pendiente'}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
                {loading && (
                    <Spinner className='spinner-border-lg' />
                )}
            </div>
        </div>
    );
}