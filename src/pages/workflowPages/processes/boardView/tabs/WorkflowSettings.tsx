import { WorkflowSettingsProps } from "../../../../../types/kanbanBoardTypes";
import { EditWorkflow } from "./EditWorkflow";

export function WorkflowSettings({ process, setProcess }: WorkflowSettingsProps) {
    

    return (
        <div className="workflow-settings-tab">
            <div className="workflow-settings-container">
                <EditWorkflow process={process} setProcess={setProcess} />
            </div>
        </div>
    );
}
