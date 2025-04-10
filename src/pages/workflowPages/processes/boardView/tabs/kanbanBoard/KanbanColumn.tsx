import { useEffect, useRef } from "react";
import { KanbanTask } from "./KanbanTask";
import { useDroppable } from "@dnd-kit/core";
import { KanbanColumnProps } from "../../../../../../types/kanbanBoardTypes";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";


export function KanbanColumn({ column, isDragging, color, onLoadMore }: KanbanColumnProps) {
    const { setNodeRef, isOver } = useDroppable({ id: column.id });
    const loaderRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!onLoadMore || !column.nextPageUrl) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    onLoadMore(column.id);
                }
            },
            {
                rootMargin: "100px",
            }
        );

        if (loaderRef.current) observer.observe(loaderRef.current);

        return () => {
            if (loaderRef.current) observer.unobserve(loaderRef.current);
        };
    }, [column.id, column.nextPageUrl, onLoadMore]);

    return (
        <div className={`kanban-column ${isOver || isDragging ? "highlight-drop" : ""}`}>
            <h3 className="column-title" style={{ backgroundColor: color }}>{column.title}</h3>
            <SortableContext items={column.cases.map(task => task.id_caso)} strategy={verticalListSortingStrategy}>
                <div ref={setNodeRef} className="kanban-tasks">
                    {column.cases.length > 0 ? (
                        column.cases.map((task) => (
                            <KanbanTask key={task.id_caso} case={task} columnId={column.id} />
                        ))
                    ) : (
                        <div className="empty-column">Drop tasks here</div>
                    )}
                    {column.nextPageUrl && (
                        <div ref={loaderRef} style={{ height: "1px", marginTop: "10px" }} />
                    )}
                </div>
            </SortableContext>
        </div>
    );
}
