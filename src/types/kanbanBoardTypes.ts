import { Proceso } from "./workflowTypes";

export interface Task {
    id: string;
    title: string;
}

export interface Column {
    id: string;
    title: string;
    tasks: Task[];
}

export interface WorkflowKanbanProps {
    process: Proceso;
}

export interface KanbanColumnProps {
    column: {
        id: string;
        title: string;
        tasks: { id: string; title: string }[];
    };
    isDragging: boolean;
    color: string;
}

export interface KanbanTaskProps {
    task: { id: string; title: string };
    columnId: string;
    isOverlay?: boolean; // This is to detect if the task is being dragged
}
