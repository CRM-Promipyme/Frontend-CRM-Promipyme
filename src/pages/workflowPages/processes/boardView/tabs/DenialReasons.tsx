import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { AxiosError } from "axios";
import { DenialReason } from "../../../../../types/workflowTypes";
import { Spinner } from "../../../../../components/ui/Spinner";
import {
    fetchDenialReasons,
    createDenialReason,
    updateDenialReason,
    deleteDenialReason,
} from "../../../../../controllers/workflowControllers";

interface DenialReasonsProps {
    processId: number;
}

type FormMode = "add" | "edit" | null;

export function DenialReasons({ processId }: DenialReasonsProps) {
    const [denialReasons, setDenialReasons] = useState<DenialReason[]>([]);
    const [loading, setLoading] = useState(false);
    const [formMode, setFormMode] = useState<FormMode>(null);
    const [selectedReason, setSelectedReason] = useState<DenialReason | null>(null);
    const [descripcion, setDescripcion] = useState("");
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [reasonToDelete, setReasonToDelete] = useState<DenialReason | null>(null);

    // Fetch denial reasons on mount
    useEffect(() => {
        if (processId) {
            loadDenialReasons();
        }
    }, [processId]);

    const loadDenialReasons = async () => {
        if (!processId) return;
        try {
            setLoading(true);
            const reasons = await fetchDenialReasons(processId);
            setDenialReasons(reasons);
        } catch (error) {
            toast.error("No se pudieron cargar las razones de rechazo.");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddClick = () => {
        setFormMode("add");
        setSelectedReason(null);
        setDescripcion("");
    };

    const handleEditClick = (reason: DenialReason) => {
        setFormMode("edit");
        setSelectedReason(reason);
        setDescripcion(reason.descripcion_razon);
    };

    const handleCloseForm = () => {
        setFormMode(null);
        setSelectedReason(null);
        setDescripcion("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!descripcion.trim()) {
            toast.error("La descripción es obligatoria.");
            return;
        }

        try {
            setLoading(true);

            if (formMode === "add") {
                const newReason = await createDenialReason({
                    proceso_id: processId,
                    descripcion_razon: descripcion,
                });
                setDenialReasons([...denialReasons, newReason]);
                toast.success("Razón de rechazo creada exitosamente.");
            } else if (formMode === "edit" && selectedReason) {
                const updatedReason = await updateDenialReason(selectedReason.id_razon, {
                    proceso_id: processId,
                    descripcion_razon: descripcion,
                });
                setDenialReasons(
                    denialReasons.map((r) => (r.id_razon === selectedReason.id_razon ? updatedReason : r))
                );
                toast.success("Razón de rechazo actualizada exitosamente.");
            }

            handleCloseForm();
        } catch (error) {
            const axiosError = error as AxiosError;
            console.error(error);
            toast.error(
                axiosError.response?.status === 404
                    ? "Razón de rechazo no encontrada."
                    : "Error al guardar la razón de rechazo."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (reason: DenialReason) => {
        setReasonToDelete(reason);
        setDeleteConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!reasonToDelete) return;

        try {
            setLoading(true);
            await deleteDenialReason(reasonToDelete.id_razon);
            setDenialReasons(denialReasons.filter((r) => r.id_razon !== reasonToDelete.id_razon));
            toast.success("Razón de rechazo eliminada exitosamente.");
            setDeleteConfirmOpen(false);
            setReasonToDelete(null);
        } catch (error) {
            const axiosError = error as AxiosError;
            console.error(error);
            toast.error(
                axiosError.response?.status === 404
                    ? "Razón de rechazo no encontrada."
                    : "Error al eliminar la razón de rechazo."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleCancelDelete = () => {
        setDeleteConfirmOpen(false);
        setReasonToDelete(null);
    };

    return (
        <div className="denial-reasons-container" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <div className="workflow-form-card card-body" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <div className="p-3" style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h4 className="h4-header mb-0" style={{ marginRight: "25px" }}>
                            Razones de Rechazo
                        </h4>
                        <motion.button
                            type="button"
                            className="btn btn-sm btn-success"
                            onClick={handleAddClick}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            disabled={loading || formMode !== null}
                        >
                            <i className="bi bi-plus-circle me-1"></i>
                            Agregar
                        </motion.button>
                    </div>

                    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
                        {loading && formMode === null ? (
                            <div className="text-center py-4" style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1 }}>
                                <Spinner />
                            </div>
                        ) : denialReasons.length === 0 ? (
                            <div className="alert alert-info mb-0" style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1 }}>
                                <i className="bi bi-info-circle me-2"></i>
                                <span>Sin razones de rechazo definidas aún.</span>
                            </div>
                        ) : (
                            <div className="table-responsive" style={{ flex: 1, overflow: "auto" }}>
                                <table className="table table-sm table-hover mb-0" style={{ marginBottom: 0 }}>
                                    <thead className="table-light sticky-top">
                                        <tr>
                                            <th style={{ fontWeight: 600, color: "#333" }}>Descripción</th>
                                            <th className="text-center" style={{ width: "120px", fontWeight: 600, color: "#333" }}>
                                                Acciones
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <AnimatePresence>
                                            {denialReasons.map((reason) => (
                                                <motion.tr
                                                    key={reason.id_razon}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    transition={{ duration: 0.2 }}
                                                    style={{ borderBottom: "1px solid #e9ecef" }}
                                                >
                                                    <td className="align-middle" style={{ padding: "12px" }}>
                                                        <span style={{ color: "#495057", fontSize: "0.95rem" }}>
                                                            {reason.descripcion_razon}
                                                        </span>
                                                    </td>
                                                    <td className="text-center align-middle" style={{ padding: "12px" }}>
                                                        <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                                                            <motion.button
                                                                type="button"
                                                                className="btn btn-sm btn-outline-primary"
                                                                onClick={() => handleEditClick(reason)}
                                                                disabled={loading || formMode !== null}
                                                                whileHover={{ scale: 1.1 }}
                                                                whileTap={{ scale: 0.9 }}
                                                                title="Editar razón"
                                                                style={{ padding: "4px 8px" }}
                                                            >
                                                                <i className="bi bi-pencil"></i>
                                                            </motion.button>
                                                            <motion.button
                                                                type="button"
                                                                className="btn btn-sm btn-outline-danger"
                                                                onClick={() => handleDelete(reason)}
                                                                disabled={loading || formMode !== null}
                                                                whileHover={{ scale: 1.1 }}
                                                                whileTap={{ scale: 0.9 }}
                                                                title="Eliminar razón"
                                                                style={{ padding: "4px 8px" }}
                                                            >
                                                                <i className="bi bi-trash"></i>
                                                            </motion.button>
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            ))}
                                        </AnimatePresence>
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Form Modal */}
            <AnimatePresence>
                {formMode !== null && (
                    <motion.div
                        className="modal d-block"
                        style={{ backgroundColor: "rgba(0, 0, 0, 0.5)", zIndex: 1050 }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <motion.div
                            className="modal-dialog modal-dialog-centered"
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="modal-content" style={{ borderRadius: "8px", border: "none", boxShadow: "0 10px 40px rgba(0, 0, 0, 0.2)" }}>
                                <div className="modal-header border-0 pb-2">
                                    <h5 className="modal-title" style={{ fontWeight: 600, fontSize: "1.25rem" }}>
                                        <i className={`bi ${formMode === "add" ? "bi-plus-circle" : "bi-pencil-square"} me-2`} style={{ color: "#0d6efd" }}></i>
                                        {formMode === "add" ? "Agregar Razón de Rechazo" : "Editar Razón de Rechazo"}
                                    </h5>
                                    <button
                                        type="button"
                                        className="btn-close"
                                        onClick={handleCloseForm}
                                        disabled={loading}
                                    ></button>
                                </div>
                                <form onSubmit={handleSubmit}>
                                    <div className="modal-body pt-3 pb-3">
                                        <div className="mb-0">
                                            <label htmlFor="descripcion" className="form-label" style={{ fontWeight: 500, marginBottom: "8px" }}>
                                                Descripción <span className="text-danger">*</span>
                                            </label>
                                            <textarea
                                                id="descripcion"
                                                className="form-control"
                                                value={descripcion}
                                                onChange={(e) => setDescripcion(e.target.value)}
                                                placeholder="Ej: Documentación incompleta"
                                                rows={3}
                                                disabled={loading}
                                                style={{
                                                    borderRadius: "6px",
                                                    borderColor: "#dee2e6",
                                                    fontSize: "0.95rem",
                                                    padding: "10px 12px",
                                                    minHeight: "100px",
                                                }}
                                            />
                                            {descripcion.length > 0 && (
                                                <small style={{ color: "#6c757d", marginTop: "4px", display: "block" }}>
                                                    {descripcion.length} caracteres
                                                </small>
                                            )}
                                        </div>
                                    </div>
                                    <div className="modal-footer border-0 pt-2">
                                        <button
                                            type="button"
                                            className="btn btn-secondary"
                                            onClick={handleCloseForm}
                                            disabled={loading}
                                            style={{ borderRadius: "6px" }}
                                        >
                                            Cancelar
                                        </button>
                                        <motion.button
                                            type="submit"
                                            className="btn btn-primary"
                                            disabled={loading}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            style={{ borderRadius: "6px" }}
                                        >
                                            {loading ? (
                                                <>
                                                    <Spinner /> Guardando...
                                                </>
                                            ) : (
                                                <>
                                                    <i className={`bi ${formMode === "add" ? "bi-plus-circle" : "bi-check-circle"} me-1`}></i>
                                                    {formMode === "add" ? "Crear Razón" : "Actualizar Razón"}
                                                </>
                                            )}
                                        </motion.button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deleteConfirmOpen && reasonToDelete && (
                    <motion.div
                        className="modal d-block"
                        style={{ backgroundColor: "rgba(0, 0, 0, 0.5)", zIndex: 1060 }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <motion.div
                            className="modal-dialog modal-dialog-centered"
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            transition={{ duration: 0.2 }}
                            style={{ maxWidth: "400px" }}
                        >
                            <div className="modal-content" style={{ borderRadius: "8px", border: "none", boxShadow: "0 10px 40px rgba(0, 0, 0, 0.2)" }}>
                                <div className="modal-body pt-4 pb-3 text-center">
                                    <div style={{ marginBottom: "16px" }}>
                                        <i className="bi bi-exclamation-triangle" style={{ fontSize: "3rem", color: "#dc3545" }}></i>
                                    </div>
                                    <h5 style={{ fontWeight: 600, marginBottom: "12px", color: "#333" }}>
                                        Confirmar Eliminación
                                    </h5>
                                    <p style={{ color: "#6c757d", marginBottom: "16px" }}>
                                        ¿Estás seguro de que deseas eliminar la razón?
                                    </p>
                                    <div style={{
                                        backgroundColor: "#f8f9fa",
                                        padding: "12px",
                                        borderRadius: "6px",
                                        marginBottom: "20px",
                                        borderLeft: "3px solid #dc3545"
                                    }}>
                                        <p style={{ margin: 0, color: "#495057", fontSize: "0.95rem", fontWeight: 500 }}>
                                            "{reasonToDelete.descripcion_razon}"
                                        </p>
                                    </div>
                                </div>
                                <div className="modal-footer border-0 justify-content-center" style={{ gap: "8px" }}>
                                    <motion.button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={handleCancelDelete}
                                        disabled={loading}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        style={{ borderRadius: "6px", minWidth: "100px" }}
                                    >
                                        Cancelar
                                    </motion.button>
                                    <motion.button
                                        type="button"
                                        className="btn btn-danger"
                                        onClick={handleConfirmDelete}
                                        disabled={loading}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        style={{ borderRadius: "6px", minWidth: "100px" }}
                                    >
                                        {loading ? (
                                            <>
                                                <Spinner /> Eliminando...
                                            </>
                                        ) : (
                                            <>
                                                <i className="bi bi-trash me-1"></i>
                                                Eliminar
                                            </>
                                        )}
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
