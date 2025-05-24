import { useEffect, useState } from "react"
import { Activity } from "../../../../../types/activityTypes";
import { ActivityLog } from "../../../../../components/ui/ActivityLog";
import { WorkflowKanbanProps } from "../../../../../types/kanbanBoardTypes"
import { fetchEntityActivities } from "../../../../../controllers/activityControllers"

export function RecentWorkflowActivity({ process }: WorkflowKanbanProps) {
    const [activities, setActivities] = useState<Activity[]>([]);

    useEffect(() => {
        const loadActivities = async () => {
            try {
                if (process.id_proceso) {
                    const activities = await fetchEntityActivities('process', process.id_proceso.toString());
                    setActivities(activities.results);
                }
            } catch {
                console.log("Error loading activities");
            }
        }

        loadActivities();
    }, [process]);

    return (
        <div style={{ padding: '15px'}}>
            <ActivityLog activities={activities} setActivities={setActivities} entity_type="process" entity_id={process?.id_proceso.toString()}/>
        </div>
    )
}