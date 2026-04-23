import { useState, useRef, useCallback, useEffect } from 'react';
import { toast } from 'react-toastify';
import { SidebarLayout } from '../../components/layouts/SidebarLayout';
import { useSidebarStore } from '../../stores/sidebarStore';
import { useAuthStore } from '../../stores/authStore';
import { Spinner } from '../../components/ui/Spinner';
import { PopupModal } from '../../components/ui/PopupModal';
import { AnimatedNumberCounter } from '../../components/ui/AnimatedNumberCounter';
import { Region, RegionListResponse } from '../../types/branchTypes';
import { fetchRegions, createRegion, updateRegion, deleteRegion } from '../../controllers/branchControllers';

export function ManageRegions() {
    // Global States
    const sidebarWidthPx = useSidebarStore((state) => state.sidebarWidthPx);
    const accessToken = useAuthStore((state) => state.accessToken);

    // Data States
    const [loading, setLoading] = useState<boolean>(false);
    const [loadingMore, setLoadingMore] = useState<boolean>(false);
    const [totalRegions, setTotalRegions] = useState<number>(0);
    const [regions, setRegions] = useState<Region[]>([]);
    const [nextPage, setNextPage] = useState<string | null>(null);

    // Filter States
    const [searchTerm, setSearchTerm] = useState<string>("");
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);
    const tableRef = useRef<HTMLDivElement | null>(null);

    // Modal States
    const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
    const [showEditModal, setShowEditModal] = useState<boolean>(false);
    const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
    const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);

    // Form States
    const [formData, setFormData] = useState({
        codigo_region: "",
        nombre_region: "",
        descripcion: "",
    });
    const [formSubmitting, setFormSubmitting] = useState<boolean>(false);

    // Fetch Regions
    const fetchRegionsData = useCallback(
        async (search: string = "", offset: number = 0, isLoadMore: boolean = false) => {
            if (!accessToken) {
                toast.error("Tu sesión ha caducado. Por favor, inicia sesión nuevamente.");
                return;
            }

            if (isLoadMore) setLoadingMore(true);
            else {
                setLoading(true);
                setRegions([]);
            }

            try {
                const response: RegionListResponse = await fetchRegions(10, offset, search || undefined);
                setTotalRegions(response.count);
                setRegions((prevRegions) =>
                    isLoadMore ? [...prevRegions, ...response.results] : response.results
                );
                setNextPage(response.next);
            } catch (error) {
                console.error("Error fetching regions:", error);
                if (!isLoadMore) {
                    toast.error("Error al cargar las regiones. Por favor, intenta nuevamente.");
                }
            } finally {
                setLoading(false);
                setLoadingMore(false);
            }
        },
        [accessToken]
    );

    // Fetch regions when search term changes
    useEffect(() => {
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }

        debounceTimer.current = setTimeout(() => {
            fetchRegionsData(searchTerm, 0, false);
        }, 500);

        return () => {
            if (debounceTimer.current) clearTimeout(debounceTimer.current);
        };
    }, [searchTerm, fetchRegionsData]);

    // Infinite Scroll Effect
    useEffect(() => {
        const handleScroll = () => {
            if (loadingMore || !nextPage || !tableRef.current) return;

            const { scrollTop, scrollHeight, clientHeight } = tableRef.current;
            if (scrollHeight - scrollTop <= clientHeight + 50) {
                const offset = regions.length;
                fetchRegionsData(searchTerm, offset, true);
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
    }, [fetchRegionsData, nextPage, loadingMore, regions.length, searchTerm]);

    // Handle Form Input Changes
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // Handle Create Region
    const handleCreateRegion = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.codigo_region.trim() || !formData.nombre_region.trim()) {
            toast.error("Por favor, completa los campos obligatorios.");
            return;
        }

        setFormSubmitting(true);

        try {
            const newRegion = await createRegion({
                codigo_region: formData.codigo_region.trim(),
                nombre_region: formData.nombre_region.trim(),
                descripcion: formData.descripcion.trim() || undefined,
            });

            setRegions((prev) => [newRegion, ...prev]);
            setTotalRegions((prev) => prev + 1);
            toast.success("Región creada exitosamente.");
            setShowCreateModal(false);
            setFormData({ codigo_region: "", nombre_region: "", descripcion: "" });
        } catch (error) {
            const response = (error as any).response?.data;
            if (response?.errors) {
                Object.values(response.errors).forEach((errorArray: any) => {
                    errorArray.forEach((errMsg: string) => toast.error(errMsg));
                });
            } else {
                toast.error("Error al crear la región. Por favor, intenta nuevamente.");
            }
        } finally {
            setFormSubmitting(false);
        }
    };

    // Handle Edit Region
    const handleEditRegion = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedRegion) return;

        if (!formData.codigo_region.trim() || !formData.nombre_region.trim()) {
            toast.error("Por favor, completa los campos obligatorios.");
            return;
        }

        setFormSubmitting(true);

        try {
            const updatedRegion = await updateRegion(selectedRegion.id, {
                codigo_region: formData.codigo_region.trim(),
                nombre_region: formData.nombre_region.trim(),
                descripcion: formData.descripcion.trim() || undefined,
            });

            setRegions((prev) =>
                prev.map((region) =>
                    region.id === selectedRegion.id ? updatedRegion : region
                )
            );

            toast.success("Región actualizada exitosamente.");
            setShowEditModal(false);
            setSelectedRegion(null);
            setFormData({ codigo_region: "", nombre_region: "", descripcion: "" });
        } catch (error) {
            const response = (error as any).response?.data;
            if (response?.errors) {
                Object.values(response.errors).forEach((errorArray: any) => {
                    errorArray.forEach((errMsg: string) => toast.error(errMsg));
                });
            } else {
                toast.error("Error al actualizar la región. Por favor, intenta nuevamente.");
            }
        } finally {
            setFormSubmitting(false);
        }
    };

    // Handle Delete Region
    const handleDeleteRegion = async () => {
        if (!selectedRegion) return;

        setFormSubmitting(true);

        try {
            await deleteRegion(selectedRegion.id);
            setRegions((prev) => prev.filter((region) => region.id !== selectedRegion.id));
            setTotalRegions((prev) => prev - 1);
            toast.success("Región eliminada exitosamente.");
            setShowDeleteModal(false);
            setSelectedRegion(null);
        } catch (error) {
            const response = (error as any).response?.data;
            toast.error(response?.message || "Error al eliminar la región. Por favor, intenta nuevamente.");
        } finally {
            setFormSubmitting(false);
        }
    };

    // Open Create Modal
    const openCreateModal = () => {
        setFormData({ codigo_region: "", nombre_region: "", descripcion: "" });
        setShowCreateModal(true);
    };

    // Open Edit Modal
    const openEditModal = (region: Region) => {
        setSelectedRegion(region);
        setFormData({
            codigo_region: region.codigo_region,
            nombre_region: region.nombre_region,
            descripcion: region.descripcion || "",
        });
        setShowEditModal(true);
    };

    // Open Delete Modal
    const openDeleteModal = (region: Region) => {
        setSelectedRegion(region);
        setShowDeleteModal(true);
    };

    return (
        <SidebarLayout sidebarWidthPx={sidebarWidthPx}>
            <div className="region-management-container">
                <h1 className="page-title">
                    Administrar Regiones
                    <span className="badge bg-promipyme ms-2">
                        <AnimatedNumberCounter value={totalRegions} />
                    </span>
                </h1>

                {/* Filter Controls */}
                <div className="filter-controllers">
                    <button
                        className="filter-btn btn btn-success"
                        onClick={openCreateModal}
                    >
                        <i className="bi bi-plus-circle"></i> Crear Región
                    </button>
                    <button
                        className="filter-btn btn btn-outline-danger"
                        onClick={() => {
                            setSearchTerm("");
                            setRegions([]);
                            fetchRegionsData("", 0, false);
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
                                        <i className="bi bi-geo-alt"></i> Código
                                    </th>
                                    <th>
                                        <i className="bi bi-signpost-2"></i> Nombre
                                    </th>
                                    <th>
                                        <i className="bi bi-file-text"></i> Descripción
                                    </th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {regions.length > 0 ? (
                                    regions.map((region) => (
                                        <tr key={region.id}>
                                            <td className="region-code">{region.codigo_region}</td>
                                            <td className="region-name">{region.nombre_region}</td>
                                            <td className="region-description">{region.descripcion || "—"}</td>
                                            <td className="region-actions">
                                                <button
                                                    className="btn btn-primary btn-sm me-2"
                                                    onClick={() => openEditModal(region)}
                                                    title="Editar región"
                                                >
                                                    <i className="bi bi-pencil"></i> Editar
                                                </button>
                                                <button
                                                    className="btn btn-danger btn-sm"
                                                    onClick={() => openDeleteModal(region)}
                                                    title="Eliminar región"
                                                >
                                                    <i className="bi bi-trash"></i> Eliminar
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="text-center">
                                            No hay regiones disponibles.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        {loadingMore && <Spinner />}
                    </div>
                )}
            </div>

            {/* Create Region Modal */}
            <PopupModal show={showCreateModal} onClose={() => !formSubmitting && setShowCreateModal(false)}>
                <div className="modal-header">
                    <h3>Crear Nueva Región</h3>
                    <span
                        className="scale"
                        onClick={() => !formSubmitting && setShowCreateModal(false)}
                        style={{ cursor: formSubmitting ? "not-allowed" : "pointer" }}
                    >
                        ✕
                    </span>
                </div>
                <form onSubmit={handleCreateRegion} className="region-form">
                    <div className="mb-3">
                        <label htmlFor="codigo_region" className="form-label">
                            Código de Región <span className="text-danger">*</span>
                        </label>
                        <input
                            type="text"
                            className="form-control"
                            id="codigo_region"
                            name="codigo_region"
                            value={formData.codigo_region}
                            onChange={handleInputChange}
                            placeholder="Ej: REG001"
                            disabled={formSubmitting}
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="nombre_region" className="form-label">
                            Nombre de Región <span className="text-danger">*</span>
                        </label>
                        <input
                            type="text"
                            className="form-control"
                            id="nombre_region"
                            name="nombre_region"
                            value={formData.nombre_region}
                            onChange={handleInputChange}
                            placeholder="Ej: Región Este"
                            disabled={formSubmitting}
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="descripcion" className="form-label">
                            Descripción <span className="text-muted">(opcional)</span>
                        </label>
                        <textarea
                            className="form-control"
                            id="descripcion"
                            name="descripcion"
                            value={formData.descripcion}
                            onChange={handleInputChange}
                            placeholder="Descripción de la región..."
                            disabled={formSubmitting}
                            rows={3}
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
                                "Crear Región"
                            )}
                        </button>
                    </div>
                </form>
            </PopupModal>

            {/* Edit Region Modal */}
            <PopupModal show={showEditModal} onClose={() => !formSubmitting && setShowEditModal(false)}>
                <div className="modal-header">
                    <h3>Editar Región</h3>
                    <span
                        className="scale"
                        onClick={() => !formSubmitting && setShowEditModal(false)}
                        style={{ cursor: formSubmitting ? "not-allowed" : "pointer" }}
                    >
                        ✕
                    </span>
                </div>
                <form onSubmit={handleEditRegion} className="region-form">
                    <div className="mb-3">
                        <label htmlFor="edit_codigo_region" className="form-label">
                            Código de Región <span className="text-danger">*</span>
                        </label>
                        <input
                            type="text"
                            className="form-control"
                            id="edit_codigo_region"
                            name="codigo_region"
                            value={formData.codigo_region}
                            onChange={handleInputChange}
                            disabled={formSubmitting}
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="edit_nombre_region" className="form-label">
                            Nombre de Región <span className="text-danger">*</span>
                        </label>
                        <input
                            type="text"
                            className="form-control"
                            id="edit_nombre_region"
                            name="nombre_region"
                            value={formData.nombre_region}
                            onChange={handleInputChange}
                            disabled={formSubmitting}
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="edit_descripcion" className="form-label">
                            Descripción <span className="text-muted">(opcional)</span>
                        </label>
                        <textarea
                            className="form-control"
                            id="edit_descripcion"
                            name="descripcion"
                            value={formData.descripcion}
                            onChange={handleInputChange}
                            disabled={formSubmitting}
                            rows={3}
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
                        ¿Estás seguro de que deseas eliminar la región <strong>{selectedRegion?.nombre_region}</strong>?
                    </p>
                    <p className="text-muted small">
                        Esta acción no se puede deshacer. La región será eliminada permanentemente del sistema.
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
                        onClick={handleDeleteRegion}
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
                            "Eliminar Región"
                        )}
                    </button>
                </div>
            </PopupModal>
        </SidebarLayout>
    );
}
