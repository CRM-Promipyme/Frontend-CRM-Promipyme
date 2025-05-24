import Select from "react-select";
import { toast } from 'react-toastify';
import api from '../../../../../controllers/api';
import { CreateTaskModal } from "./CreateTaskModal";
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Spinner } from "../../../../../components/ui/Spinner";
import { Caso, Proceso } from '../../../../../types/workflowTypes';
import { useAuthStore } from "../../../../../stores/authStore";

interface CaseTasksProps {
    selectedCase: Caso;
    process: Proceso;
}

interface Task {
    id_tarea_caso: number;
    caso: number;
    creador_tarea: number;
    creador_tarea_first_name: string;
    creador_tarea_last_name: string;
    usuario_asignado: number;
    usuario_asignado_first_name: string;
    usuario_asignado_last_name: string;
    nombre_tarea: string;
    descripcion_tarea: string;
    fecha_creacion: string;
    completado: boolean;
    fecha_completado: string | null;
    fecha_completado_estimada: string | null;
}

interface PaginatedTasks {
    count: number;
    next: string | null;
    previous: string | null;
    results: Task[];
}

const statusOptions = [
    { value: false, label: "Pendiente" },
    { value: true, label: "Completado" }
];

export function CaseTasks({ selectedCase, process }: CaseTasksProps) {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [nextUrl, setNextUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [expandedTask, setExpandedTask] = useState<number | null>(null);
    const [editTaskId, setEditTaskId] = useState<number | null>(null);
    const [editFields, setEditFields] = useState<Partial<Task>>({});
    const containerRef = useRef<HTMLDivElement>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Auth
    const userId = useAuthStore(state => state.userId);
    const isAdmin = useAuthStore(state => state.isAdmin());

    // Fetch tasks (initial and paginated)
    const fetchTasks = async (url?: string) => {
        setLoading(true);
        try {
            const endpoint = url || `/workflows/casos/manage/tasks/list/${selectedCase.id_caso}/`;
            const res = await api.get<PaginatedTasks>(endpoint);
            setTasks(prev => url ? [...prev, ...res.data.results] : res.data.results);
            setNextUrl(res.data.next);
        } catch (err) {
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
    }, [selectedCase.id_caso]);

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
    }, [nextUrl, loading]);

    // Helpers
    const formatDate = (dateStr: string | null) =>
        dateStr ? new Date(dateStr).toLocaleDateString() : '—';

    const canQuickUpdateStatus = (task: Task) =>
        isAdmin || userId === task.usuario_asignado || userId === task.creador_tarea;

    const canEditTask = (task: Task) =>
        isAdmin || userId === task.creador_tarea;

    const handleQuickStatusChange = async (task: Task, newStatus: boolean) => {
        const payload = {
            nombre_tarea: task.nombre_tarea,
            descripcion_tarea: task.descripcion_tarea,
            fecha_completado_estimada: task.fecha_completado_estimada
                ? task.fecha_completado_estimada.slice(0, 10)
                : "",
            completado: newStatus
        };
        try {
            await api.put(`/workflows/casos/manage/tasks/${task.id_tarea_caso}/`, payload);
            setTasks(prev =>
                prev.map(t =>
                    t.id_tarea_caso === task.id_tarea_caso ? { ...t, completado: newStatus } : t
                )
            );
            toast.success("Estado actualizado.");
        } catch {
            toast.error("No se pudo actualizar el estado.");
        }
    };

    const handleEditClick = (task: Task) => {
        setEditTaskId(task.id_tarea_caso);
        setEditFields({
            nombre_tarea: task.nombre_tarea,
            descripcion_tarea: task.descripcion_tarea,
            fecha_completado_estimada: task.fecha_completado_estimada?.slice(0, 10) || "",
            completado: task.completado
        });
    };

    const handleEditFieldChange = (field: keyof Task, value: any) => {
        setEditFields(prev => ({ ...prev, [field]: value }));
    };

    const handleSaveEdit = async (task: Task) => {
        const payload = {
            nombre_tarea: editFields.nombre_tarea ?? task.nombre_tarea,
            descripcion_tarea: editFields.descripcion_tarea ?? task.descripcion_tarea,
            fecha_completado_estimada:
                (editFields.fecha_completado_estimada ?? task.fecha_completado_estimada)?.slice(0, 10) || "",
            completado: typeof editFields.completado === "boolean" ? editFields.completado : task.completado
        };
        try {
            await api.put(`/workflows/casos/manage/tasks/${task.id_tarea_caso}/`, payload);
            setTasks(prev =>
                prev.map(t =>
                    t.id_tarea_caso === task.id_tarea_caso
                        ? { ...t, ...payload }
                        : t
                )
            );
            setEditTaskId(null);
            toast.success("Tarea actualizada.");
        } catch {
            toast.error("No se pudo actualizar la tarea.");
        }
    };

    return (
        <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h4 className="h4-header" style={{ marginBottom: 0 }}>
                    <i className="bi bi-list-task" style={{ marginRight: '10px', fontSize: '1.5rem', filter: 'drop-shadow(0 0 0.5px black)' }}></i>
                    Tareas Asignadas
                </h4>
                {isAdmin && (
                    <button className="btn btn-outline-primary btn-sm" onClick={() => setShowCreateModal(true)}>
                        <i className="bi bi-plus-lg"></i> Crear Tarea
                    </button>
                )}
            </div>
            <CreateTaskModal
                show={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                caseId={selectedCase.id_caso}
                onTaskCreated={fetchTasks}
            />

            <div
                className="task-list-container"
                ref={containerRef}
                style={{
                    maxHeight: 400,
                    overflowY: 'auto',
                    borderRadius: 10,
                    padding: 16,
                    background: '#fff'
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
                                background: expandedTask === task.id_tarea_caso ? '#f8fafc' : '#fdfdfd',
                                cursor: 'pointer',
                                boxShadow: expandedTask === task.id_tarea_caso ? '0 2px 8px rgba(0,0,0,0.06)' : 'none'
                            }}
                            onClick={() => setExpandedTask(expandedTask === task.id_tarea_caso ? null : task.id_tarea_caso)}
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
                            {/* Expanded view */}
                            <AnimatePresence>
                                {expandedTask === task.id_tarea_caso && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.25 }}
                                        style={{ overflow: 'scroll', marginTop: 16 }}
                                        onClick={e => e.stopPropagation()}
                                    >
                                        {editTaskId === task.id_tarea_caso ? (
                                            <>
                                                <div style={{ fontSize: 14, marginBottom: 8 }}>
                                                    <b>Nombre:</b>
                                                    <input
                                                        className="form-control"
                                                        value={editFields.nombre_tarea || ""}
                                                        onChange={e => handleEditFieldChange("nombre_tarea", e.target.value)}
                                                    />
                                                </div>
                                                <div style={{ fontSize: 14, marginBottom: 8 }}>
                                                    <b>Descripción:</b>
                                                    <textarea
                                                        className="form-control"
                                                        value={editFields.descripcion_tarea || ""}
                                                        onChange={e => handleEditFieldChange("descripcion_tarea", e.target.value)}
                                                    />
                                                </div>
                                                <div style={{ fontSize: 14, marginBottom: 8 }}>
                                                    <b>Fecha estimada de finalización:</b>
                                                    <input
                                                        type="date"
                                                        className="form-control"
                                                        value={editFields.fecha_completado_estimada || ""}
                                                        onChange={e => handleEditFieldChange("fecha_completado_estimada", e.target.value)}
                                                    />
                                                </div>
                                                <div style={{ fontSize: 14, marginBottom: 8 }}>
                                                    <b>Estado:</b>{" "}
                                                    <Select
                                                        options={statusOptions}
                                                        value={statusOptions.find(opt => opt.value === editFields.completado)}
                                                        onChange={option => handleEditFieldChange("completado", option?.value)}
                                                        className="react-select-container"
                                                        classNamePrefix="react-select"
                                                    />
                                                </div>
                                                <div style={{ display: "flex", gap: 8 }}>
                                                    <button className="btn btn-success btn-sm" onClick={() => handleSaveEdit(task)}>Guardar</button>
                                                    <button className="btn btn-secondary btn-sm" onClick={() => setEditTaskId(null)}>Cancelar</button>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div style={{ fontSize: 14, marginBottom: 8 }}>
                                                    <b>Descripción:</b> {task.descripcion_tarea || <span className="text-muted">Sin descripción</span>}
                                                </div>
                                                <div style={{ fontSize: 14, marginBottom: 8 }}>
                                                    <b>Creador:</b> {task.creador_tarea_first_name} {task.creador_tarea_last_name}
                                                </div>
                                                <div style={{ fontSize: 14, marginBottom: 8 }}>
                                                    <b>Fecha estimada de finalización:</b> {formatDate(task.fecha_completado_estimada)}
                                                </div>
                                                <div style={{ fontSize: 14, marginBottom: 8 }}>
                                                    <b>Fecha de finalización:</b> {formatDate(task.fecha_completado)}
                                                </div>
                                                <div style={{ fontSize: 14, marginBottom: 8 }}>
                                                    <b>Estado:</b>{" "}
                                                    <Select
                                                        options={statusOptions}
                                                        value={statusOptions.find(opt =>
                                                            opt.value === Boolean(
                                                                editTaskId === task.id_tarea_caso
                                                                    ? editFields.completado
                                                                    : task.completado
                                                            )
                                                        )}
                                                        isDisabled={!canQuickUpdateStatus(task) && editTaskId !== task.id_tarea_caso}
                                                        onChange={option => {
                                                            if (editTaskId === task.id_tarea_caso) {
                                                                handleEditFieldChange("completado", option?.value);
                                                            } else if (canQuickUpdateStatus(task) && option) {
                                                                handleQuickStatusChange(task, option.value);
                                                            }
                                                        }}
                                                        className="react-select-container"
                                                        classNamePrefix="react-select"
                                                    />
                                                </div>
                                                {canEditTask(task) && (
                                                    <button className="btn btn-outline-primary btn-sm" onClick={e => { e.stopPropagation(); handleEditClick(task); }}>
                                                        <i className="bi bi-pencil"></i> Editar
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
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