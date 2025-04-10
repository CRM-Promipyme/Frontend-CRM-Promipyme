import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarLayout } from "../../../components/layouts/SidebarLayout";
import { useSidebarStore } from "../../../stores/sidebarStore";
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
import { toast } from "react-toastify";
import { Spinner } from "../../../components/ui/Spinner";
import { SortableItem } from "../../../components/ui/SortableItem";
import { createWorkflow } from "../../../controllers/workflowControllers";
import { showResponseErrors } from "../../../utils/formatUtils";
import "../../../styles/workflows/workflowFormStyles.css"

interface Etapa {
    id: string;
    nombre_etapa: string;
    orden_etapa: number;
}


export function CreateWorkflow() {
    // Global States
    const sidebarWidthPx = useSidebarStore((state) => state.sidebarWidthPx);

    // Local States
    const [loading, setLoading] = useState<boolean>(false);
    const [nombreProceso, setNombreProceso] = useState<string>("");
    const [etapas, setEtapas] = useState<Etapa[]>([]);
    const [color, setColor] = useState<string>("#8A355E");
    const navigate = useNavigate();

    // DND Sensors (used for drag-and-drop)
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Method to add a new stage
    const addEtapa = () => {
        setEtapas((prevEtapas) => [
            ...prevEtapas,
            {
                id: `etapa-${Date.now()}`, // Ensure unique ID
                nombre_etapa: "",
                orden_etapa: prevEtapas.length + 1,
            },
        ]);
    };

    // Method to remove a stage
    const removeEtapa = (id: string) => {
        setEtapas((prevEtapas) => {
            // Filter out the stage with the matching ID
            const updatedEtapas = prevEtapas.filter((etapa) => etapa.id !== id);
    
            // Recalculate the order of the remaining stages
            return [...updatedEtapas.map((etapa, index) => ({
                ...etapa,
                orden_etapa: index + 1, // Recalculate order
            }))];
        });
    };

    // Method to update a stage's name
    const updateEtapaName = (id: string, name: string) => {
        setEtapas((prevEtapas) =>
            prevEtapas.map((etapa) =>
                etapa.id === id ? { ...etapa, nombre_etapa: name } : etapa
            )
        );
    };

    // Method to handle stage reordering
    const onDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        setEtapas((prevEtapas) => {
            const oldIndex = prevEtapas.findIndex((etapa) => etapa.id === active.id);
            const newIndex = prevEtapas.findIndex((etapa) => etapa.id === over.id);
            const sortedEtapas = arrayMove(prevEtapas, oldIndex, newIndex);

            return sortedEtapas.map((etapa, index) => ({
                ...etapa,
                orden_etapa: index + 1, // Recalculate order
            }));
        });
    };

    // Method to handle form submission
    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        // Validate required fields
        if (!nombreProceso.trim()) {
            toast.error("El nombre del proceso es obligatorio.");
            return;
        }

        // Validate that there's at least one stage added
        if (etapas.length === 0) {
            toast.error("Debes agregar al menos una etapa al proceso.");
            return;
        }

        // Prepare the workflow data for submission
        const workflowData = {
            nombre_proceso: nombreProceso,
            etapas: etapas.map(({ ...rest }) => rest),
            color: color,
        };

        // Submit the workflow data to the backend
        setLoading(true);

        // const workflow = await createWorkflow(workflowData);
        console.log(workflowData);
        createWorkflow(workflowData)
            .then((workflow) => {
                console.log("Workflow created:", workflow);
                toast.success("Proceso creado exitosamente.");
                navigate("/workflows/processes/menu");
            })
            .catch((error) => {
                console.error("Error creating workflow:", error);
                showResponseErrors(error.response?.data);
            })
            .finally(() => {
                setLoading(false);
            });
    };

    return (
        <SidebarLayout sidebarWidthPx={sidebarWidthPx}>
            <h1 className="page-title">Crea un Nuevo Proceso</h1>

            <div className="workflow-form-card card-body">
                <form onSubmit={handleSubmit} className="p-3">
                    {/* Process Name */}
                    <div className="mb-3">
                        <label htmlFor="nombreProceso">Nombre del Proceso</label>
                        <input
                            id="nombreProceso"
                            type="text"
                            value={nombreProceso}
                            onChange={(e) => setNombreProceso(e.target.value)}
                            required
                            placeholder="Ejemplo: Despacho de Documentos"
                            className="form-control"
                            style={{ width: '500px' }}
                        />
                    </div>

                    {/* Color Picker */}
                    <div className="mb-3">
                        <label htmlFor="colorPicker">Color del Proceso</label>
                        <input
                            id="colorPicker"
                            type="color"
                            value={color}
                            onChange={(e) => setColor(e.target.value)}
                            className="form-control form-control-color"
                        />
                    </div>

                    {/* Etapas Section */}
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

                    {/* Add Stage Button */}
                    <button type="button" className="btn btn-success mt-2" onClick={addEtapa}>
                        <i className="bi bi-plus-circle"></i> Agregar Etapa
                    </button>

                    {/* Submit Button */}
                    <button type="submit" className="btn btn-primary mt-3 w-100">
                        {loading ? <Spinner /> : "Guardar Proceso"}
                    </button>
                </form>
            </div>
        </SidebarLayout>
    );
}
