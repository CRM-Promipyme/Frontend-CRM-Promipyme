import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { KanbanTaskProps } from "../../../../../../types/kanbanBoardTypes";


export function KanbanTask({ task, columnId, isOverlay = false }: KanbanTaskProps) {
    const { attributes, listeners, setNodeRef, transform } = useSortable({
        id: task.id,
        data: { columnId },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition: isOverlay ? "none" : "transform 0.2s ease-out",
        opacity: isOverlay ? 0.8 : 1,
        boxShadow: isOverlay ? "0px 4px 10px rgba(0,0,0,0.15)" : "none",
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="kanban-task">
            {task.title}
        </div>
    );
}
