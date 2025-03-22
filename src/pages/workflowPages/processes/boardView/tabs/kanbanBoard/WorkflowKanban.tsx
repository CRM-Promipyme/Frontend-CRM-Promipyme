import { Link } from "react-router-dom";
import api from "../../../../../../controllers/api";
import { useState, useMemo, useEffect } from "react";
import {
    DndContext,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragStartEvent,
    DragOverlay,
    rectIntersection
} from "@dnd-kit/core";
import { KanbanTask } from "./KanbanTask";
import { KanbanColumn } from "./KanbanColumn";
import { Caso } from "../../../../../../types/workflowTypes";
import { Spinner } from "../../../../../../components/ui/Spinner";
import { fetchStageCases } from "../../../../../../controllers/caseControllers";
import { SortableContext, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Column, WorkflowKanbanProps } from "../../../../../../types/kanbanBoardTypes";

export function WorkflowKanban({ process }: WorkflowKanbanProps) {
    // Local States
    const [activeTask, setActiveTask] = useState<Caso | null>(null);
    const [isDragging, setIsDragging] = useState(false); // Track drag state
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );
    const [columns, setColumns] = useState<Column[]>([]);
    const [color, setColor] = useState<string>("#000000");
    const [loading, setLoading] = useState(true);

    const columnIds = useMemo(() => columns.map(col => col.id), [columns]);

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        setIsDragging(true);

        const sourceColumn = columns.find(col => col.cases.some(caso => caso.id_caso === active.id));
        if (sourceColumn) {
            const found = sourceColumn.cases.find(caso => caso.id_caso === active.id);
            setActiveTask(found || null);
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveTask(null);
        setIsDragging(false);

        // If there is no target column or the task is dropped in the same column, do nothing
        if (!over || active.id === over.id) return;

        // Get source and target column IDs
        const sourceColumnId = active.data.current?.columnId;
        const targetColumnId = over.data.current?.columnId || over.id;

        // If there is no source or target column, or the source and target columns are the same, do nothing
        if (!sourceColumnId || !targetColumnId || sourceColumnId === targetColumnId) return;

        // Move the task to the target column
        setColumns((prevColumns) => {
            // Find the source and target columns
            const sourceColumn = prevColumns.find(col => col.id === sourceColumnId);
            const targetColumn = prevColumns.find(col => col.id === targetColumnId);

            // If there is no source or target column, do nothing
            if (!sourceColumn || !targetColumn) return prevColumns;

            // Find the task index in the source column
            const taskIndex = sourceColumn.cases.findIndex(caso => caso.id_caso === active.id);
            if (taskIndex === -1) return prevColumns;

            const moved = sourceColumn.cases[taskIndex];
            sourceColumn.cases.splice(taskIndex, 1);
            targetColumn.cases = [...targetColumn.cases, moved];

            return [...prevColumns];
        });
    };

    // Component mount
    useEffect(() => {
        setColor(process.color);
    
        if (process.etapas) {
            const initialColumns = process.etapas.map((etapa) => ({
                id: etapa.id_etapa.toString(),
                title: etapa.nombre_etapa,
                cases: [],
                nextPageUrl: null,
            }));
    
            setColumns(initialColumns);
    
            // Fetch all stages in parallel
            Promise.all(
                process.etapas.map((etapa) =>
                    fetchStageCases(process.id_proceso, etapa.id_etapa).then((result) => ({
                        etapaId: etapa.id_etapa.toString(),
                        data: result,
                    }))
                )
            ).then((results) => {
                setColumns((prev) =>
                    prev.map((col) => {
                        const res = results.find((r) => r.etapaId === col.id);
                        return res && res.data
                            ? { ...col, cases: res.data.results, nextPageUrl: res.data.next }
                            : col;
                    })
                );
            }).finally(() => {
                setLoading(false);
            });
        }
    }, [process]);

    const onLoadMore = async (columnId: string) => {
        const col = columns.find(c => c.id === columnId);
        if (!col?.nextPageUrl) return;
    
        try {
            const res = await api.get(col.nextPageUrl);
            const data = await res.data;
    
            setColumns(prev =>
                prev.map(c =>
                    c.id === columnId
                        ? {
                            ...c,
                            cases: [...c.cases, ...data.results],
                            nextPageUrl: data.next,
                        }
                        : c
                )
            );
        } catch (err) {
            console.error("Error loading more cases:", err);
        }
    };

    // TODO: Perform action when dragging to other column, allow accessing the case details
    // TODO: Filter cases by name and select columns to show
    return (
        <>
            <div className="kanban-board-controls">
                <input type="text" className="form-control" placeholder="Buscar Caso" style={{ maxWidth: '400px' }}/>
                {process && (
                    <Link to={`/workflows/cases/create/${process.id_proceso}`}>
                        <button className="btn btn-primary">
                            <i className="bi bi-plus-lg" style={{ marginRight: '5px' }}></i>
                            Crear un Caso
                        </button>
                    </Link>
                )}
            </div>
            <div className="kanban-board">
            {loading ? (
                <div className="d-flex justify-content-center align-items-center" style={{ height: "70vh" }}>
                    <Spinner />
                </div>
            ) : (
                <DndContext
                    sensors={sensors}
                    collisionDetection={rectIntersection}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <div className="kanban-columns">
                        <SortableContext items={columnIds}>
                            {columns.map((column) => (
                                <KanbanColumn
                                    key={column.id}
                                    column={column}
                                    isDragging={isDragging}
                                    color={color}
                                    onLoadMore={onLoadMore}
                                />
                            ))}
                        </SortableContext>
                    </div>

                    <DragOverlay>
                        {activeTask ? <KanbanTask case={activeTask} columnId="" isOverlay /> : null}
                    </DragOverlay>
                </DndContext>
            )}
            </div>
        </>
    );
}
