import { useEffect, useState, useRef, useCallback } from "react";
import { toast } from "react-toastify";
import { Branch, BranchListResponse } from "../../types/branchTypes";
import { fetchBranches, createBranch, updateBranch, deleteBranch } from "../../controllers/branchControllers";
import { useSidebarStore } from "../../stores/sidebarStore";
import { useAuthStore } from "../../stores/authStore";
import { SidebarLayout } from "../../components/layouts/SidebarLayout";
import { PopupModal } from "../../components/ui/PopupModal";
import { Spinner } from "../../components/ui/Spinner";
import { AnimatedNumberCounter } from "../../components/ui/AnimatedNumberCounter";
import "../../styles/tableStyling.css";
import "../../styles/components/branch.css";

export function ManageBranches() {
    // Global States
    const sidebarWidthPx = useSidebarStore((state) => state.sidebarWidthPx);
    const accessToken = useAuthStore((state) => state.accessToken);

    // Data States
    const [loading, setLoading] = useState<boolean>(false);
    const [loadingMore, setLoadingMore] = useState<boolean>(false);
    const [totalBranches, setTotalBranches] = useState<number>(0);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [nextPage, setNextPage] = useState<string | null>(null);

    // Filter States
    const [searchTerm, setSearchTerm] = useState<string>("");
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);
    const tableRef = useRef<HTMLDivElement | null>(null);

    // Modal States
    const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
    const [showEditModal, setShowEditModal] = useState<boolean>(false);
    const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
    const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);

    // Form States
    const [formData, setFormData] = useState({
        codigo_sucursal: "",
        nombre_sucursal: "",
    });
    const [formSubmitting, setFormSubmitting] = useState<boolean>(false);

    // Fetch Branches
    const fetchBranchesData = useCallback(
        async (search: string = "", offset: number = 0, isLoadMore: boolean = false) => {
            if (!accessToken) {
                toast.error("Tu sesión ha caducado. Por favor, inicia sesión nuevamente.");
                return;
            }

            if (isLoadMore) setLoadingMore(true);
            else {
                setLoading(true);
                setBranches([]);
            }

            try {
                const response: BranchListResponse = await fetchBranches(10, offset, search || undefined);
                setTotalBranches(response.count);
                setBranches((prevBranches) =>
                    isLoadMore ? [...prevBranches, ...response.results] : response.results
                );
                setNextPage(response.next);
            } catch (error) {
                console.error("Error fetching branches:", error);
                if (!isLoadMore) {
                    toast.error("Error al cargar las sucursales. Por favor, intenta nuevamente.");
                }
            } finally {
                setLoading(false);
                setLoadingMore(false);
            }
        },
        [accessToken]
    );

    // Fetch branches when search term changes
    useEffect(() => {
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }

        debounceTimer.current = setTimeout(() => {
            fetchBranchesData(searchTerm, 0, false);
        }, 500);

        return () => {
            if (debounceTimer.current) clearTimeout(debounceTimer.current);
        };
    }, [searchTerm, fetchBranchesData]);

    // Infinite Scroll Effect
    useEffect(() => {
        const handleScroll = () => {
            if (loadingMore || !nextPage || !tableRef.current) return;

            const { scrollTop, scrollHeight, clientHeight } = tableRef.current;
            if (scrollHeight - scrollTop <= clientHeight + 50) {
                const offset = branches.length;
                fetchBranchesData(searchTerm, offset, true);
            }
        };

        const tableElement = tableRef.current;
        if (tableElement) {
            tableElement.addEventListener("scroll", handleScroll);
        }

        return () => {
            if (tableElement) {
                tableElement.removeEventListener("scroll", handleScroll);
            }
        };
    }, [fetchBranchesData, nextPage, loadingMore, branches.length, searchTerm]);

    // Handle Form Input Changes
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // Handle Create Branch
    const handleCreateBranch = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.codigo_sucursal.trim() || !formData.nombre_sucursal.trim()) {
            toast.error("Por favor, completa todos los campos.");
            return;
        }

        setFormSubmitting(true);

        try {
            const newBranch = await createBranch({
                codigo_sucursal: formData.codigo_sucursal.trim(),
                nombre_sucursal: formData.nombre_sucursal.trim(),
            });

            setBranches((prev) => [newBranch, ...prev]);
            setTotalBranches((prev) => prev + 1);
            toast.success("Sucursal creada exitosamente.");
            setShowCreateModal(false);
            setFormData({ codigo_sucursal: "", nombre_sucursal: "" });
        } catch (error) {
            const response = (error as any).response?.data;
            if (response?.errors) {
                Object.values(response.errors).forEach((errorArray: any) => {
                    errorArray.forEach((errMsg: string) => toast.error(errMsg));
                });
            } else {
                toast.error("Error al crear la sucursal. Por favor, intenta nuevamente.");
            }
        } finally {
            setFormSubmitting(false);
        }
    };

    // Handle Edit Branch
    const handleEditBranch = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedBranch) return;

        if (!formData.codigo_sucursal.trim() || !formData.nombre_sucursal.trim()) {
            toast.error("Por favor, completa todos los campos.");
            return;
        }

        setFormSubmitting(true);

        try {
            const updatedBranch = await updateBranch(selectedBranch.id, {
                codigo_sucursal: formData.codigo_sucursal.trim(),
                nombre_sucursal: formData.nombre_sucursal.trim(),
            });

            setBranches((prev) =>
                prev.map((branch) =>
                    branch.id === selectedBranch.id ? updatedBranch : branch
                )
            );

            toast.success("Sucursal actualizada exitosamente.");
            setShowEditModal(false);
            setSelectedBranch(null);
            setFormData({ codigo_sucursal: "", nombre_sucursal: "" });
        } catch (error) {
            const response = (error as any).response?.data;
            if (response?.errors) {
                Object.values(response.errors).forEach((errorArray: any) => {
                    errorArray.forEach((errMsg: string) => toast.error(errMsg));
                });
            } else {
                toast.error("Error al actualizar la sucursal. Por favor, intenta nuevamente.");
            }
        } finally {
            setFormSubmitting(false);
        }
    };

    // Handle Delete Branch
    const handleDeleteBranch = async () => {
        if (!selectedBranch) return;

        setFormSubmitting(true);

        try {
            await deleteBranch(selectedBranch.id);
            setBranches((prev) => prev.filter((branch) => branch.id !== selectedBranch.id));
            setTotalBranches((prev) => prev - 1);
            toast.success("Sucursal eliminada exitosamente.");
            setShowDeleteModal(false);
            setSelectedBranch(null);
        } catch (error) {
            const response = (error as any).response?.data;
            toast.error(response?.message || "Error al eliminar la sucursal. Por favor, intenta nuevamente.");
        } finally {
            setFormSubmitting(false);
        }
    };

    // Open Create Modal
    const openCreateModal = () => {
        setFormData({ codigo_sucursal: "", nombre_sucursal: "" });
        setShowCreateModal(true);
    };

    // Open Edit Modal
    const openEditModal = (branch: Branch) => {
        setSelectedBranch(branch);
        setFormData({
            codigo_sucursal: branch.codigo_sucursal,
            nombre_sucursal: branch.nombre_sucursal,
        });
        setShowEditModal(true);
    };

    // Open Delete Modal
    const openDeleteModal = (branch: Branch) => {
        setSelectedBranch(branch);
        setShowDeleteModal(true);
    };

    return (
        <SidebarLayout sidebarWidthPx={sidebarWidthPx}>
            <div className="branch-management-container">
                <h1 className="page-title">
                    Administrar Sucursales
                    <span className="badge bg-promipyme ms-2">
                        <AnimatedNumberCounter value={totalBranches} />
                    </span>
                </h1>

                {/* Filter Controls */}
                <div className="filter-controllers">
                    <button
                        className="filter-btn btn btn-success"
                        onClick={openCreateModal}
                    >
                        <i className="bi bi-plus-circle"></i> Crear Sucursal
                    </button>
                    <button
                        className="filter-btn btn btn-outline-danger"
                        onClick={() => {
                            setSearchTerm("");
                            setBranches([]);
                            fetchBranchesData("", 0, false);
                        }}
                    >
                        <i className="bi bi-x-circle"></i> Limpiar Filtros
                    </button>
                    <input
                        type="text"
                        className="form-control text-search"
                        placeholder="Buscar por nombre o código..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Table Section */}
                {loading ? (
                    <Spinner />
                ) : (
                    <div className="table-responsive" ref={tableRef}>
                        <table className="table table-bordered rounded-borders">
                            <thead>
                                <tr>
                                    <th>
                                        <i className="bi bi-building"></i> Código
                                    </th>
                                    <th>
                                        <i className="bi bi-signpost-2"></i> Nombre
                                    </th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {branches.length > 0 ? (
                                    branches.map((branch) => (
                                        <tr key={branch.id}>
                                            <td className="branch-code">{branch.codigo_sucursal}</td>
                                            <td className="branch-name">{branch.nombre_sucursal}</td>
                                            <td className="branch-actions">
                                                <button
                                                    className="btn btn-sm btn-primary me-2"
                                                    onClick={() => openEditModal(branch)}
                                                    title="Editar sucursal"
                                                >
                                                    <i className="bi bi-pencil"></i>
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-danger"
                                                    onClick={() => openDeleteModal(branch)}
                                                    title="Eliminar sucursal"
                                                >
                                                    <i className="bi bi-trash"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={3} className="text-center">
                                            No hay sucursales disponibles.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        {loadingMore && <Spinner />}
                    </div>
                )}
            </div>

            {/* Create Branch Modal */}
            <PopupModal show={showCreateModal} onClose={() => !formSubmitting && setShowCreateModal(false)}>
                <div className="modal-header">
                    <h3>Crear Nueva Sucursal</h3>
                    <span
                        className="scale"
                        onClick={() => !formSubmitting && setShowCreateModal(false)}
                        style={{ cursor: formSubmitting ? "not-allowed" : "pointer" }}
                    >
                        ✕
                    </span>
                </div>
                <form onSubmit={handleCreateBranch} className="branch-form">
                    <div className="mb-3">
                        <label htmlFor="codigo_sucursal" className="form-label">
                            Código de Sucursal <span className="text-danger">*</span>
                        </label>
                        <input
                            type="text"
                            className="form-control"
                            id="codigo_sucursal"
                            name="codigo_sucursal"
                            value={formData.codigo_sucursal}
                            onChange={handleInputChange}
                            placeholder="Ej: 12345"
                            disabled={formSubmitting}
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="nombre_sucursal" className="form-label">
                            Nombre de Sucursal <span className="text-danger">*</span>
                        </label>
                        <input
                            type="text"
                            className="form-control"
                            id="nombre_sucursal"
                            name="nombre_sucursal"
                            value={formData.nombre_sucursal}
                            onChange={handleInputChange}
                            placeholder="Ej: Sucursal Centro"
                            disabled={formSubmitting}
                            required
                        />
                    </div>
                    <div className="modal-footer">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => setShowCreateModal(false)}
                            disabled={formSubmitting}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="btn btn-success"
                            disabled={formSubmitting}
                        >
                            {formSubmitting ? (
                                <>
                                    <span
                                        className="spinner-border spinner-border-sm me-2"
                                        role="status"
                                        aria-hidden="true"
                                    ></span>
                                    Creando...
                                </>
                            ) : (
                                "Crear Sucursal"
                            )}
                        </button>
                    </div>
                </form>
            </PopupModal>

            {/* Edit Branch Modal */}
            <PopupModal show={showEditModal} onClose={() => !formSubmitting && setShowEditModal(false)}>
                <div className="modal-header">
                    <h3>Editar Sucursal</h3>
                    <span
                        className="scale"
                        onClick={() => !formSubmitting && setShowEditModal(false)}
                        style={{ cursor: formSubmitting ? "not-allowed" : "pointer" }}
                    >
                        ✕
                    </span>
                </div>
                <form onSubmit={handleEditBranch} className="branch-form">
                    <div className="mb-3">
                        <label htmlFor="edit_codigo_sucursal" className="form-label">
                            Código de Sucursal <span className="text-danger">*</span>
                        </label>
                        <input
                            type="text"
                            className="form-control"
                            id="edit_codigo_sucursal"
                            name="codigo_sucursal"
                            value={formData.codigo_sucursal}
                            onChange={handleInputChange}
                            disabled={formSubmitting}
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="edit_nombre_sucursal" className="form-label">
                            Nombre de Sucursal <span className="text-danger">*</span>
                        </label>
                        <input
                            type="text"
                            className="form-control"
                            id="edit_nombre_sucursal"
                            name="nombre_sucursal"
                            value={formData.nombre_sucursal}
                            onChange={handleInputChange}
                            disabled={formSubmitting}
                            required
                        />
                    </div>
                    <div className="modal-footer">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => setShowEditModal(false)}
                            disabled={formSubmitting}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={formSubmitting}
                        >
                            {formSubmitting ? (
                                <>
                                    <span
                                        className="spinner-border spinner-border-sm me-2"
                                        role="status"
                                        aria-hidden="true"
                                    ></span>
                                    Guardando...
                                </>
                            ) : (
                                "Guardar Cambios"
                            )}
                        </button>
                    </div>
                </form>
            </PopupModal>

            {/* Delete Confirmation Modal */}
            <PopupModal show={showDeleteModal} onClose={() => !formSubmitting && setShowDeleteModal(false)}>
                <div className="modal-header">
                    <h3>Confirmar Eliminación</h3>
                    <span
                        className="scale"
                        onClick={() => !formSubmitting && setShowDeleteModal(false)}
                        style={{ cursor: formSubmitting ? "not-allowed" : "pointer" }}
                    >
                        ✕
                    </span>
                </div>
                <div className="modal-body">
                    <p className="mb-3">
                        ¿Estás seguro de que deseas eliminar la sucursal <strong>{selectedBranch?.nombre_sucursal}</strong>?
                    </p>
                    <p className="text-muted small">
                        Esta acción no se puede deshacer. La sucursal será eliminada permanentemente del sistema.
                    </p>
                </div>
                <div className="modal-footer">
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setShowDeleteModal(false)}
                        disabled={formSubmitting}
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        className="btn btn-danger"
                        onClick={handleDeleteBranch}
                        disabled={formSubmitting}
                    >
                        {formSubmitting ? (
                            <>
                                <span
                                    className="spinner-border spinner-border-sm me-2"
                                    role="status"
                                    aria-hidden="true"
                                ></span>
                                Eliminando...
                            </>
                        ) : (
                            "Eliminar Sucursal"
                        )}
                    </button>
                </div>
            </PopupModal>
        </SidebarLayout>
    );
}