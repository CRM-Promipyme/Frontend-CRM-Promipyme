import api from "../../controllers/api";
import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import '../../styles/components/activityLog.css';
import { Activity } from "../../types/activityTypes";
import { Spinner } from "./Spinner";
import {
    fetchEntityActivities,
    fetchAllEntityActivties,
    ActivityResponse
} from "../../controllers/activityControllers";

interface ActivityLogProps {
    activities?: Activity[];
    setActivities?: React.Dispatch<React.SetStateAction<Activity[]>>;
    entity_type: string;
    entity_id?: number | string;
}

export function ActivityLog({ activities, setActivities, entity_type, entity_id }: ActivityLogProps) {
    const [localActivities, setLocalActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(false);

    const nextUrlRef = useRef<string | null>(null); // <- to avoid stale state
    const containerRef = useRef<HTMLDivElement | null>(null);
    const effectiveActivities = activities ?? localActivities;

    // Initial fetch
    useEffect(() => {
        const fetchInitialActivities = async () => {
            setLoading(true);
            try {
                const response: ActivityResponse = entity_id
                    ? await fetchEntityActivities(entity_type, entity_id.toString())
                    : await fetchAllEntityActivties(entity_type);

                if (setActivities) {
                    setActivities(response.results);
                } else {
                    setLocalActivities(response.results);
                }

                nextUrlRef.current = response.next;
            } catch {
                toast.error("Ha ocurrido un error al cargar el historial de actividades.");
            } finally {
                setLoading(false);
            }
        };

        fetchInitialActivities();
    }, [entity_type, entity_id, setActivities]);

    // Load more
    const fetchMoreActivities = async () => {
        const url = nextUrlRef.current;
        if (!url || loading) return;
    
        setLoading(true);
        try {
            const response = await api.get<ActivityResponse>(url); // ✅ authenticated
            const data = response.data;
    
            if (!data || !Array.isArray(data.results)) {
                toast.error("Respuesta inesperada del servidor.");
                return;
            }
    
            if (setActivities) {
                setActivities((prev: Activity[]) => [...(prev || []), ...data.results]);
            } else {
                setLocalActivities((prev) => [...prev, ...data.results]);
            }
    
            nextUrlRef.current = data.next;
        } catch (error) {
            toast.error("No se pudo cargar más actividades.");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Scroll Listener
    useEffect(() => {
        const handleScroll = () => {
            const el = containerRef.current;
            if (!el || loading || !nextUrlRef.current) return;

            const threshold = 100;
            if (el.scrollHeight - el.scrollTop - el.clientHeight < threshold) {
                fetchMoreActivities();
            }
        };

        const el = containerRef.current;
        if (el) {
            el.addEventListener("scroll", handleScroll);
        }

        return () => {
            el?.removeEventListener("scroll", handleScroll);
        };
    }, [loading]);

    return (
        <>
            <h4 className="h4-header">
                <i className="bi bi-clock-history" style={{ marginRight: '10px', fontSize: '1.5rem', filter: 'drop-shadow(0 0 0.5px black)' }}></i>
                Actividad Reciente
            </h4>

            <div className="activity-log" ref={containerRef} style={{ maxHeight: "400px", overflowY: "auto" }}>
                {effectiveActivities.length > 0 ? (
                    <>
                        {effectiveActivities.map((activity) => (
                            <div key={`${activity.id_actividad}-${entity_type}`} className="activity-log-item d-flex align-items-start gap-3 p-3 border-bottom">
                                <i className="bi bi-person-check text-primary fs-4"></i>
                                <div className="flex-grow-1">
                                    <p className="mb-1">{activity.descripcion_actividad}</p>
                                    <p className="text-muted d-flex align-items-center gap-2">
                                        <i className="bi bi-clock-history"></i>
                                        {format(new Date(activity.fecha_actividad), "PPP - p", { locale: es })}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {loading && <Spinner />}
                    </>
                ) : loading ? (
                    <Spinner />
                ) : (
                    <p className="text-muted text-center" style={{ marginTop: '10px' }}>No hay actividad reciente</p>
                )}
            </div>
        </>
    );
}
