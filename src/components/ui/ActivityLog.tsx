import { format } from "date-fns";
import { es } from "date-fns/locale";
import '../../styles/components/activityLog.css';
import { Activity } from "../../types/activityTypes";

export function ActivityLog({ activities }: { activities: Activity[] }) {
    return (
        <>
            <h4 className="h4-header">
                <i className="bi bi-clock-history"   style={{ marginRight: '10px', fontSize: '1.5rem', filter: 'drop-shadow(0 0 0.5px black)' }}></i>
                Actividad Reciente
            </h4>
            <div className="activity-log">
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
        </>
    );
}
