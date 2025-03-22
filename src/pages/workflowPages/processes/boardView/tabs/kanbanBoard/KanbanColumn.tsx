import { KanbanTask } from "./KanbanTask";
import { useDroppable } from "@dnd-kit/core";
import { KanbanColumnProps } from "../../../../../../types/kanbanBoardTypes";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";


export function KanbanColumn({ column, isDragging, color }: KanbanColumnProps) {
    const { setNodeRef, isOver } = useDroppable({ id: column.id });

    return (
        <div className={`kanban-column ${isOver || isDragging ? "highlight-drop" : ""}`}>
            <h3 className="column-title" style={{ backgroundColor: color }}>{column.title}</h3>
            <SortableContext items={column.tasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
                <div ref={setNodeRef} className="kanban-tasks">
                    {column.tasks.length > 0 ? (
                        column.tasks.map((task) => (
                            <KanbanTask key={task.id} task={task} columnId={column.id} />
                        ))
                    ) : (
                        <div className="empty-column">Drop tasks here</div>
                    )}
                </div>
            </SortableContext>
        </div>
    );
}
