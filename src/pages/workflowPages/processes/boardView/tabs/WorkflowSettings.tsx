import { useState } from "react";
import { WorkflowSettingsProps } from "../../../../../types/kanbanBoardTypes";
import { EditWorkflow } from "./EditWorkflow";
import { WorkflowForms } from "./WorkflowForms";

export function WorkflowSettings({ process, setProcess }: WorkflowSettingsProps) {
    const [activeTab, setActiveTab] = useState<"workflow" | "forms">("workflow");

    return (
        <div className="workflow-settings-tab">
            {/* Tab Navigation */}
            <ul className="nav nav-tabs mb-4">
                <li className="nav-item">
                    <button
                        className={`nav-link ${activeTab === "workflow" ? "active" : ""}`}
                        onClick={() => setActiveTab("workflow")}
                    >
                        <i className="bi bi-diagram-3 me-2"></i>
                        Configuración del Proceso
                    </button>
                </li>
                <li className="nav-item">
                    <button
                        className={`nav-link ${activeTab === "forms" ? "active" : ""}`}
                        onClick={() => setActiveTab("forms")}
                    >
                        <i className="bi bi-file-earmark-text me-2"></i>
                        Formularios
                    </button>
                </li>
            </ul>

            {/* Tab Content */}
            <div className="workflow-settings-container">
                {activeTab === "workflow" && (
                    <EditWorkflow process={process} setProcess={setProcess} />
                )}
                {activeTab === "forms" && (
                    <WorkflowForms process={process} setProcess={setProcess} />
                )}
            </div>
        </div>
    );
}