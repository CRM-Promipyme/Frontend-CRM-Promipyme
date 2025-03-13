import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";


interface SortableItemProps {
    etapa: { id: string; nombre_etapa: string; orden_etapa: number };
    updateEtapaName: (id: string, name: string) => void;
    removeEtapa: (id: string) => void;
}


export function SortableItem({ etapa, updateEtapaName, removeEtapa }: SortableItemProps) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: etapa.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} className="d-flex align-items-center gap-2 p-2 border mb-2 rounded bg-light">
            {/* Drag Handle */}
            <span {...listeners} {...attributes} className="drag-handle">
                <i className="bi bi-grip-vertical"></i>
            </span>

            {/* Stage Name Input */}
            <input
                type="text"
                value={etapa.nombre_etapa}
                onChange={(e) => updateEtapaName(etapa.id, e.target.value)}
                placeholder="Nombre de la etapa"
                required
                className="form-control"
            />

            {/* Order Number */}
            <span className="badge bg-primary">{etapa.orden_etapa}</span>

            {/* Delete Button */}
            <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={() => removeEtapa(etapa.id)}
            >
                <i className="bi bi-trash"></i>
            </button>
        </div>
    );
}
