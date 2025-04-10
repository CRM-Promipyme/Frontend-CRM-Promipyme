import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useEffect, useState } from "react"
import { Activity } from "../../../../../types/activityTypes";
import { WorkflowKanbanProps } from "../../../../../types/kanbanBoardTypes"
import { fetchEntityActivities } from "../../../../../controllers/activityControllers"

export function RecentWorkflowActivity({ process }: WorkflowKanbanProps) {
    const [activities, setActivities] = useState<Activity[]>([]);

    useEffect(() => {
        const loadActivities = async () => {
            try {
                if (process.id_proceso) {
                    const activities = await fetchEntityActivities('process', process.id_proceso.toString());
                    setActivities(activities);
                }
            } catch {
                console.log("Error loading activities");
            }
        }

        loadActivities();
    }, [process]);

    return (
        <div className="activity-log" style={{ maxHeight: 'calc(100vh - 200px)' }}>
            {activities.length > 0 ? (
                activities.map((activity) => (
                    <div key={activity.id_actividad} className="activity-log-item d-flex align-items-start gap-3 p-3 border-bottom">
                        {/* Icon */}
                        <i className="bi bi-person-check text-primary fs-4"></i>

                        {/* Activity Content */}
                        <div className="flex-grow-1">
                            <p className="mb-1">{activity.descripcion_actividad}</p>
                            <p className="text-muted d-flex align-items-center gap-2">
                                <i className="bi bi-clock-history"></i> {format(new Date(activity.fecha_actividad), "PPP - p", { locale: es })}
                            </p>
                        </div>
                    </div>
                ))
            ) : (
                <p className="text-muted text-center">No hay actividad reciente</p>
            )}
        </div>
    )
}