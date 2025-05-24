import React, { useState } from "react";
import { toast } from "react-toastify";
import AsyncSelect from "react-select/async";
import api from "../../../../../controllers/api";
import { PopupModal } from "../../../../../components/ui/PopupModal";

export function CreateTaskModal({ show, onClose, caseId, onTaskCreated }: { show: boolean, onClose: () => void, caseId: number, onTaskCreated: () => void }) {
    const [assignee, setAssignee] = useState<any>(null);
    const [nombre, setNombre] = useState("");
    const [descripcion, setDescripcion] = useState("");
    const [fecha, setFecha] = useState("");
    const [loading, setLoading] = useState(false);

    const loadUsers = async (inputValue: string) => {
        if (!inputValue) return [];
        try {
            const res = await api.get("/auth/users/list", {
                params: { name: inputValue }
            });
            return res.data.results.map((u: any) => ({
                value: u.id,
                label: `${u.first_name} ${u.last_name} (${u.email})`
            }));
        } catch {
            return [];
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!assignee || !nombre || !fecha) {
            toast.error("Completa todos los campos obligatorios.");
            return;
        }
        setLoading(true);
        try {
            await api.post(`/workflows/casos/manage/tasks/${caseId}/${assignee.value}/`, {
                nombre_tarea: nombre,
                descripcion_tarea: descripcion,
                fecha_completado_estimada: fecha
            });
            toast.success("Tarea creada.");
            onTaskCreated();
            onClose();
        } catch {
            toast.error("No se pudo crear la tarea.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <PopupModal show={show} onClose={onClose}>
            <form onSubmit={handleSubmit}>
                <h5>Crear Nueva Tarea</h5>
                <div className="mb-3">
                    <label>Asignar a</label>
                    <AsyncSelect
                        cacheOptions
                        loadOptions={loadUsers}
                        defaultOptions={false}
                        value={assignee}
                        onChange={setAssignee}
                        placeholder="Buscar usuario por nombre o email"
                        classNamePrefix="react-select"
                    />
                </div>
                <div className="mb-3">
                    <label>Nombre de la tarea</label>
                    <input className="form-control" value={nombre} onChange={e => setNombre(e.target.value)} required />
                </div>
                <div className="mb-3">
                    <label>Descripción</label>
                    <textarea className="form-control" value={descripcion} onChange={e => setDescripcion(e.target.value)} />
                </div>
                <div className="mb-3">
                    <label>Fecha estimada de finalización</label>
                    <input type="date" className="form-control" value={fecha} onChange={e => setFecha(e.target.value)} required />
                </div>
                <div className="d-flex justify-content-end gap-2">
                    <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? "Creando..." : "Crear"}
                    </button>
                </div>
            </form>
        </PopupModal>
    );
}
