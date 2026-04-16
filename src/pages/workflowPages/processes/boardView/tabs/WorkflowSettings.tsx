import { useState } from "react";
import { WorkflowSettingsProps } from "../../../../../types/kanbanBoardTypes";
import { EditWorkflow } from "./EditWorkflow";
import { WorkflowForms } from "./WorkflowForms";
import { DenialReasons } from "./DenialReasons";
import { StageFormConstraints } from "./StageFormConstraints";

export function WorkflowSettings({ process, setProcess }: WorkflowSettingsProps) {
    const [activeTab, setActiveTab] = useState<"workflow" | "forms" | "constraints">("workflow");

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
                <li className="nav-item">
                    <button
                        className={`nav-link ${activeTab === "constraints" ? "active" : ""}`}
                        onClick={() => setActiveTab("constraints")}
                    >
                        <i className="bi bi-lock me-2"></i>
                        Restricciones
                    </button>
                </li>
            </ul>

            {/* Tab Content */}
            <div className="workflow-settings-container">
                {activeTab === "workflow" && (
                    <div className="row g-2">
                        <div className="col-lg-6">
                            <EditWorkflow process={process} setProcess={setProcess} />
                        </div>
                        <div className="col-lg-6">
                            <DenialReasons processId={process.id_proceso} />
                        </div>
                    </div>
                )}
                {activeTab === "forms" && (
                    <WorkflowForms process={process} setProcess={setProcess} />
                )}
                {activeTab === "constraints" && (
                    <StageFormConstraints process={process} />
                )}
            </div>
        </div>
    );
}