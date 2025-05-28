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
    const containerRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    // Fetch tasks (initial and paginated)
    const fetchTasks = async (url?: string) => {
        setLoading(true);
        try {
            const endpoint = url || `/workflows/casos/manage/tasks/user/list/${userId}/`;
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
        fetchTasks();
        // eslint-disable-next-line
    }, [userId]);

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

    return (
        <div style={{ width: '100%' }}>
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
                {tasks.length === 0 && !loading && (
                    <div className="text-muted text-center py-4">No hay tareas asignadas a este caso.</div>
                )}
                <AnimatePresence>
                    {tasks.map(task => (
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