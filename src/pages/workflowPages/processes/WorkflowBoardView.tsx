import { useState } from "react";
import { useParams } from "react-router-dom";
import "../../../styles/workflows/workflowStyles.css";
// import { Proceso } from "../../../types/workflowTypes";
import { Spinner } from "../../../components/ui/Spinner";
import { useSidebarStore } from "../../../stores/sidebarStore";
import { SidebarLayout } from "../../../components/layouts/SidebarLayout";

export function WorkflowBoardView() {
    // Global States
    const sidebarWidthPx = useSidebarStore((state) => state.sidebarWidthPx);
    
    // Local States
    const [loading ] = useState<boolean>(true);

    // Get workflow ID from route params
    const { workflowId } = useParams<{ workflowId: string }>();

    // Render different UI states
    if (loading) {
        return (
            <SidebarLayout sidebarWidthPx={sidebarWidthPx}>
                <Spinner />
            </SidebarLayout>
        );
    }

    return (
        // TODO: Finish this view
        <SidebarLayout sidebarWidthPx={sidebarWidthPx}>
            <h1 className="page-title">
                Workflow Board View {workflowId}
            </h1>
        </SidebarLayout>
    );
}
