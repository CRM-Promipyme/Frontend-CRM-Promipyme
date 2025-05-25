import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { AxiosError } from "axios";
import { toast } from "react-toastify";
import { useState, useEffect } from "react";
import api from "../../../../../controllers/api";
import { AnimatePresence, motion } from "framer-motion";
import { Spinner } from "../../../../../components/ui/Spinner";
import { showResponseErrors } from "../../../../../utils/formatUtils";
import { SortableItem } from "../../../../../components/ui/SortableItem";
import { WorkflowSettingsProps } from "../../../../../types/kanbanBoardTypes";

interface Etapa {
    id: string;
    nombre_etapa: string;
    orden_etapa: number;
    id_etapa?: number;
}

export function EditWorkflow({ process, setProcess }: WorkflowSettingsProps) {
    const [editMode, setEditMode] = useState(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [nombreProceso, setNombreProceso] = useState<string>("");
    const [etapas, setEtapas] = useState<Etapa[]>([]);
    const [color, setColor] = useState<string>("#8A355E");

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        if (process) {
            setNombreProceso(process.nombre_proceso);
            setColor(process.color);
            setEtapas(
                process.etapas.map((etapa, index) => ({
                    id: `etapa-${etapa.id_etapa}`,
                    id_etapa: etapa.id_etapa,
                    nombre_etapa: etapa.nombre_etapa,
                    orden_etapa: etapa.orden_etapa || index + 1,
                }))
            );
        }
    }, [process]);

    const addEtapa = () => {
        setEtapas((prev) => [
            ...prev,
            {
                id: `etapa-${Date.now()}`,
                nombre_etapa: "",
                orden_etapa: prev.length + 1,
            },
        ]);
    };

    const removeEtapa = (id: string) => {
        setEtapas((prev) =>
            prev.filter((etapa) => etapa.id !== id).map((etapa, index) => ({
                ...etapa,
                orden_etapa: index + 1,
            }))
        );
    };

    const updateEtapaName = (id: string, name: string) => {
        setEtapas((prev) =>
            prev.map((etapa) => (etapa.id === id ? { ...etapa, nombre_etapa: name } : etapa))
        );
    };

    const onDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        setEtapas((prev) => {
            const oldIndex = prev.findIndex((etapa) => etapa.id === active.id);
            const newIndex = prev.findIndex((etapa) => etapa.id === over.id);
            const sorted = arrayMove(prev, oldIndex, newIndex);
            return sorted.map((etapa, index) => ({ ...etapa, orden_etapa: index + 1 }));
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!nombreProceso.trim()) {
            toast.error("El nombre del proceso es obligatorio.");
            return;
        }

        if (etapas.length === 0) {
            toast.error("Debes agregar al menos una etapa.");
            return;
        }

        const payload = {
            nombre_proceso: nombreProceso,
            etapas: etapas.map(({ id, ...rest }) => rest),
            color: color,
        };

        try {
            setLoading(true);
            const response = await api.put(`/workflows/procesos/manage/update/${process.id_proceso}/`, payload);
            toast.success("Proceso actualizado correctamente.");
            setProcess(response.data?.process);
            setEditMode(false);
        } catch (error) {   
            const axiosError = error as AxiosError;
            showResponseErrors(axiosError.response?.data);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="workflow-form-card card-body" style={{ flexDirection: "column" }}>
            <form onSubmit={handleSubmit} className="p-3">
                <h4 className="h4-header" style={{ marginBottom: '10px' }}>Configuración del Flujo de Trabajo</h4>
                <div className="d-flex justify-content-between align-items-center">
                    <motion.button
                        type="button"
                        className={`btn ${editMode ? "btn-outline-danger" : "btn-outline-primary"}`}
                        onClick={() => setEditMode((prev) => !prev)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}

                    >
                        {editMode ? "Cancelar" : "Editar"}
                    </motion.button>

                    <AnimatePresence>
                        {editMode && (
                            <motion.button
                                type="button"
                                className="btn btn-primary"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleSubmit}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                                key="save-button"
                            >
                                {loading ? <Spinner /> : "Guardar Cambios"}
                            </motion.button>
                        )}
                    </AnimatePresence>
                </div>

                <div className="mb-3 mt-3">
                    <label htmlFor="nombreProceso">Nombre del Proceso</label>
                    <input
                        id="nombreProceso"
                        type="text"
                        value={nombreProceso}
                        onChange={(e) => setNombreProceso(e.target.value)}
                        className="form-control"
                        disabled={!editMode}
                    />
                </div>

                <div className="mb-3">
                    <label htmlFor="colorPicker">Color del Proceso</label>
                    <input
                        id="colorPicker"
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="form-control form-control-color"
                        disabled={!editMode}
                    />
                </div>

                <h5>Etapas</h5>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                    <SortableContext items={etapas.map((etapa) => etapa.id)} strategy={verticalListSortingStrategy}>
                        {etapas.map((etapa) => (
                            <SortableItem
                                key={etapa.id}
                                etapa={etapa}
                                updateEtapaName={updateEtapaName}
                                removeEtapa={removeEtapa}
                            />
                        ))}
                    </SortableContext>
                </DndContext>

                <AnimatePresence>
                    {editMode && (
                        <motion.button
                            type="button"
                            className="btn btn-success mt-3"
                            onClick={addEtapa}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            transition={{ duration: 0.3 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            key="add-etapa-button"
                        >
                            <i className="bi bi-plus-circle"></i> Agregar Etapa
                        </motion.button>
                    )}
                </AnimatePresence>
            </form>
        </div>
    )
}