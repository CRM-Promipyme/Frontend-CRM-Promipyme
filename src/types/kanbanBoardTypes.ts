import { Proceso, Caso } from "./workflowTypes";

export interface Column {
    id: string;
    title: string;
    cases: Caso[];
    nextPageUrl?: string | null;
}

export interface WorkflowKanbanProps {
    process: Proceso;
}

export interface KanbanColumnProps {
    column: {
        id: string;
        title: string;
        cases: Caso[];
        nextPageUrl?: string | null;
    };
    isDragging: boolean;
    color: string;
    onLoadMore?: (columnId: string) => void;
}

export interface KanbanTaskProps {
    case: Caso;
    columnId: string;
    isOverlay?: boolean; // This is to detect if the task is being dragged
}
