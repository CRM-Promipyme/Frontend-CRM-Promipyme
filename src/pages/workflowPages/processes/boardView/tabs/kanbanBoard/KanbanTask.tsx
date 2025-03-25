import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { KanbanTaskProps } from "../../../../../../types/kanbanBoardTypes";
import { daysLeft, formatNumber } from "../../../../../../utils/formatUtils";


export function KanbanTask({ case: kanbanCase, columnId, isOverlay = false }: KanbanTaskProps) {
    const { attributes, listeners, setNodeRef, transform } = useSortable({
        id: kanbanCase.id_caso,
        data: { columnId },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition: isOverlay ? "none" : "transform 0.2s ease-out",
        opacity: isOverlay ? 0.8 : 1,
        boxShadow: isOverlay ? "0px 4px 10px rgba(0,0,0,0.15)" : "none",
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="kanban-task">
            <h4 className="case-title">{kanbanCase.nombre_caso}</h4>
            
            <div className="case-contact-information">
                <i className="bi bi-person"></i>
                <p>{kanbanCase.contact_first_name}</p>
                <p>{kanbanCase.contact_last_name}</p>
            </div>

            <div className="case-dates">
                <div className="case-date">
                    <div className="date-item">
                        <i className="bi bi-calendar"></i>
                        <p className="date-label">Creado:</p>
                    </div>
                    <p className="item-value">{format(new Date(kanbanCase.fecha_creacion), "PPP", { locale: es })}</p>
                </div>
                <div className="case-date">
                    <div className="date-item">
                        <i className="bi bi-clock"></i>
                        <p className="date-label">Fecha de cierre:</p>
                    </div>
                    <p className="item-value">{format(new Date(kanbanCase.fecha_cierre), "PPP", { locale: es })}</p>
                </div>
            </div>

            <div className="case-dates" style={{ justifyContent: "space-between", gap: "unset", textAlign: "right" }}>
                <div className="case-date">
                    <div className="date-item">
                        <i className="bi bi-currency-dollar"></i>
                        <p>Valor:</p>
                    </div>
                    <p className="item-value">RD$ {formatNumber(parseFloat(kanbanCase.valor_caso))}</p>
                </div>
                <div className="case-date">
                    <div className="date-item">
                        <i className="bi bi-clock"></i>
                        <p>Tiempo Restante:</p>
                    </div>
                    <p 
                        className="item-value" 
                        style={{ 
                        color: daysLeft(new Date(kanbanCase.fecha_cierre_estimada)) >= 0 
                            ? "#0F7E5E"  // Green for positive (or zero) days
                            : "#FF8A05"  // Orange for negative days
                        }}
                    >
                        {daysLeft(new Date(kanbanCase.fecha_cierre_estimada))} días
                    </p>
                </div>
            </div>

            {kanbanCase.abierto ? (
                <span className="case-status-badge case-open">Abierto</span>
            ) : (
                <span className="case-status-badge case-closed">Cerrado</span>
            )}
        </div>
    );
}
