import { Link } from "react-router-dom";
import { useState, useMemo, useEffect } from "react";
import {
    DndContext,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragStartEvent,
    DragOverlay,
} from "@dnd-kit/core";
import { KanbanTask } from "./KanbanTask";
import { KanbanColumn } from "./KanbanColumn";
import { Column, Task, WorkflowKanbanProps } from "../../../../../../types/kanbanBoardTypes";
import { SortableContext, sortableKeyboardCoordinates } from "@dnd-kit/sortable";

export function WorkflowKanban({ process }: WorkflowKanbanProps) {
    // Local States
    const [activeTask, setActiveTask] = useState<Task | null>(null);
    const [isDragging, setIsDragging] = useState(false); // Track drag state
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );
    const [columns, setColumns] = useState<Column[]>([]);
    const [color, setColor] = useState<string>("#000000");

    const columnIds = useMemo(() => columns.map(col => col.id), [columns]);

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        setIsDragging(true);

        const sourceColumn = columns.find(col => col.tasks.some(task => task.id === active.id));
        if (sourceColumn) {
            const task = sourceColumn.tasks.find(task => task.id === active.id);
            setActiveTask(task || null);
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
            const taskIndex = sourceColumn.tasks.findIndex(task => task.id === active.id);
            if (taskIndex === -1) return prevColumns;

            // Move the task to the target column
            const movedTask = sourceColumn.tasks[taskIndex];
            sourceColumn.tasks.splice(taskIndex, 1);
            targetColumn.tasks = [...targetColumn.tasks, movedTask];

            return [...prevColumns];
        });
    };

    // Component mount
    useEffect(() => {
        // Set process color
        setColor(process.color);

        // Set columns with the process' stages
        if (process.etapas) {
            const newColumns = process.etapas.map((etapa) => ({
                id: etapa.id_etapa.toString(),
                title: etapa.nombre_etapa,
                tasks: [],
            }));
            setColumns(newColumns);
        }

        // Set test tasks to test the drag and drop functionality
        setColumns((prevColumns) => {
            // add to first column
            const newColumns = prevColumns.map((col, index) => {
                if (index === 0) {
                    return {
                        ...col,
                        tasks: [
                            ...col.tasks,
                            { id: "1", title: "Task 1" },
                            { id: "2", title: "Task 2" },
                        ],
                    };
                }
                return col;
            });

            return newColumns;
        });

        // TODO: Set real cases as tasks
    }, [process]);

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
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCorners}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <div className="kanban-columns">
                        <SortableContext items={columnIds}>
                            {columns.map((column) => (
                                <KanbanColumn key={column.id} column={column} isDragging={isDragging} color={color}/>
                            ))}
                        </SortableContext>
                    </div>

                    <DragOverlay>
                        {activeTask ? <KanbanTask task={activeTask} columnId="" isOverlay /> : null}
                    </DragOverlay>
                </DndContext>
            </div>
        </>
    );
}
