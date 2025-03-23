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
import { PopupModal } from "../../../../../../components/ui/PopupModal";
import { SortableContext, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Column, WorkflowKanbanProps } from "../../../../../../types/kanbanBoardTypes";
import { fetchStageCases, updateCaseStage } from "../../../../../../controllers/caseControllers";
import { toast } from "react-toastify";

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
    const [pendingMove, setPendingMove] = useState<{
        caseId: number;
        fromColumnId: string;
        toColumnId: string;
    } | null>(null);
    
    const [changeMotive, setChangeMotive] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);

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
        setIsDragging(false);
    
        if (!over || active.id === over.id) return;
    
        const sourceColumnId = active.data.current?.columnId;
        const targetColumnId = over.data.current?.columnId || over.id;
    
        if (!sourceColumnId || !targetColumnId || sourceColumnId === targetColumnId) return;
    
        const task = columns
            .flatMap(col => col.cases)
            .find(c => c.id_caso === active.id);
    
        if (!task) return;
    
        setPendingMove({
            caseId: task.id_caso,
            fromColumnId: sourceColumnId,
            toColumnId: targetColumnId,
        });
        setIsModalOpen(true);
    };

    const confirmStageChange = async () => {
        if (!pendingMove) return;
    
        try {
            await updateCaseStage(pendingMove.caseId, parseInt(pendingMove.toColumnId), changeMotive);
    
            setColumns(prevColumns => {
                const source = prevColumns.find(c => c.id === pendingMove.fromColumnId);
                const target = prevColumns.find(c => c.id === pendingMove.toColumnId);
    
                if (!source || !target) return prevColumns;
    
                const caseIndex = source.cases.findIndex(c => c.id_caso === pendingMove.caseId);
                if (caseIndex === -1) return prevColumns;
    
                const moved = source.cases[caseIndex];
                source.cases.splice(caseIndex, 1);
                target.cases.push(moved);
    
                return [...prevColumns];
            });
    
            setIsModalOpen(false);
            setChangeMotive("");
            setPendingMove(null);
            toast.success("Caso movido de etapa exitosamente.");
        } catch {
            toast.warning("No se pudo actualizar el caso. Intente de nuevo.");
        }
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
            <PopupModal show={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <div>
                    <h5>Motivo del cambio de etapa</h5>
                    <textarea
                        className="form-control"
                        placeholder="Escriba el motivo del cambio"
                        value={changeMotive}
                        onChange={(e) => setChangeMotive(e.target.value)}
                    />
                    <div className="d-flex justify-content-end mt-3">
                        <button className="btn btn-secondary me-2" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                        <button
                            className="btn btn-primary"
                            disabled={!changeMotive.trim()}
                            onClick={confirmStageChange}
                        >
                            Confirmar
                        </button>
                    </div>
                </div>
            </PopupModal>
        </>
    );
}
