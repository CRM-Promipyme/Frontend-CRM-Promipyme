import { useEffect, useState, useRef, useCallback } from "react";
import { toast } from "react-toastify";
import { Branch, BranchListResponse, Region, RegionListResponse } from "../../types/branchTypes";
import { fetchBranches, fetchRegions, massAssignBranchesToRegion } from "../../controllers/branchControllers";
import { useSidebarStore } from "../../stores/sidebarStore";
import { useAuthStore } from "../../stores/authStore";
import { SidebarLayout } from "../../components/layouts/SidebarLayout";
import { Spinner } from "../../components/ui/Spinner";
import { AnimatedNumberCounter } from "../../components/ui/AnimatedNumberCounter";
import "../../styles/tableStyling.css";
import "../../styles/components/branch.css";

export function MassAssignRegion() {
    // Global States
    const sidebarWidthPx = useSidebarStore((state) => state.sidebarWidthPx);
    const accessToken = useAuthStore((state) => state.accessToken);

    // Data States
    const [loading, setLoading] = useState<boolean>(false);
    const [loadingMore, setLoadingMore] = useState<boolean>(false);
    const [totalBranches, setTotalBranches] = useState<number>(0);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [nextPage, setNextPage] = useState<string | null>(null);
    const [regions, setRegions] = useState<Region[]>([]);
    const [loadingRegions, setLoadingRegions] = useState<boolean>(false);

    // Filter States
    const [searchTerm, setSearchTerm] = useState<string>("");
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);
    const tableRef = useRef<HTMLDivElement | null>(null);

    // Selection States
    const [selectedBranches, setSelectedBranches] = useState<Set<number>>(new Set());
    const [selectedRegionId, setSelectedRegionId] = useState<string>("");

    // Action States
    const [submitting, setSubmitting] = useState<boolean>(false);

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

    // Fetch regions on mount
    useEffect(() => {
        const loadRegions = async () => {
            setLoadingRegions(true);
            try {
                const response: RegionListResponse = await fetchRegions(1000, 0);
                setRegions(response.results);
            } catch (error) {
                console.error("Error fetching regions:", error);
                toast.error("Error al cargar las regiones.");
            } finally {
                setLoadingRegions(false);
            }
        };
        loadRegions();
    }, []);

    // Fetch branches on mount and when search changes
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

    // Handle Branch Selection
    const toggleBranchSelection = (branchId: number) => {
        const newSelection = new Set(selectedBranches);
        if (newSelection.has(branchId)) {
            newSelection.delete(branchId);
        } else {
            newSelection.add(branchId);
        }
        setSelectedBranches(newSelection);
    };

    // Toggle All
    const toggleAllBranches = () => {
        if (selectedBranches.size === branches.length) {
            setSelectedBranches(new Set());
        } else {
            setSelectedBranches(new Set(branches.map((b) => b.id)));
        }
    };

    // Handle Mass Assign
    const handleMassAssign = async () => {
        if (selectedBranches.size === 0) {
            toast.warning("Por favor, selecciona al menos una sucursal.");
            return;
        }

        if (!selectedRegionId) {
            toast.warning("Por favor, selecciona una región.");
            return;
        }

        setSubmitting(true);

        try {
            const branchIds = Array.from(selectedBranches);
            const regionId = parseInt(selectedRegionId);

            await massAssignBranchesToRegion(branchIds, regionId);

            toast.success(`${branchIds.length} sucursal(es) asignada(s) exitosamente.`);
            setSelectedBranches(new Set());
            setSelectedRegionId("");
            fetchBranchesData(searchTerm, 0, false);
        } catch (error) {
            const response = (error as any).response?.data;
            toast.error(response?.message || "Error al asignar las sucursales. Por favor, intenta nuevamente.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <SidebarLayout sidebarWidthPx={sidebarWidthPx}>
            <div className="branch-management-container">
                <h1 className="page-title">
                    Asignar Regiones en Masa
                    <span className="badge bg-promipyme ms-2">
                        <AnimatedNumberCounter value={totalBranches} />
                    </span>
                </h1>

                {/* Filter Controls */}
                <div className="filter-controllers">
                    <button
                        className="filter-btn btn btn-outline-danger"
                        onClick={() => {
                            setSearchTerm("");
                            setBranches([]);
                            setSelectedBranches(new Set());
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

                {/* Assignment Panel */}
                <div style={{ 
                    backgroundColor: "#f8f9fa", 
                    padding: "15px", 
                    borderRadius: "8px", 
                    marginBottom: "20px",
                    border: "1px solid #dee2e6"
                }}>
                    <div style={{ marginBottom: "15px" }}>
                        <h5>Asignación en Masa</h5>
                        <p className="text-muted" style={{ fontSize: "13px", margin: "5px 0 0 0" }}>
                            Selecciona sucursales y asigna una región a todas ellas de una sola vez
                        </p>
                    </div>

                    <div style={{ display: "flex", gap: "15px", alignItems: "flex-end", flexWrap: "wrap" }}>
                        <div style={{ flex: 1, minWidth: "250px" }}>
                            <label className="form-label" style={{ marginBottom: "8px" }}>
                                Región <span className="text-danger">*</span>
                            </label>
                            <select
                                className="form-select"
                                value={selectedRegionId}
                                onChange={(e) => setSelectedRegionId(e.target.value)}
                                disabled={submitting || loadingRegions || selectedBranches.size === 0}
                            >
                                <option value="">Selecciona una región...</option>
                                {regions.map((region) => (
                                    <option key={region.id} value={region.id.toString()}>
                                        {region.nombre_region}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div style={{ display: "flex", gap: "10px" }}>
                            <button
                                className="btn btn-warning"
                                disabled={selectedBranches.size === 0 || submitting}
                                onClick={() => setSelectedBranches(new Set())}
                                title="Deseleccionar todas"
                            >
                                <i className="bi bi-x-circle"></i> Deseleccionar
                            </button>
                            <button
                                className="btn btn-success"
                                disabled={selectedBranches.size === 0 || !selectedRegionId || submitting}
                                onClick={handleMassAssign}
                            >
                                {submitting ? (
                                    <>
                                        <span
                                            className="spinner-border spinner-border-sm me-2"
                                            role="status"
                                            aria-hidden="true"
                                        ></span>
                                        Asignando...
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-check-circle"></i> Asignar ({selectedBranches.size})
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Summary */}
                {selectedBranches.size > 0 && (
                    <div
                        style={{
                            padding: "12px",
                            marginBottom: "15px",
                            backgroundColor: "#d1ecf1",
                            border: "1px solid #bee5eb",
                            borderRadius: "4px",
                            color: "#0c5460",
                            fontSize: "14px",
                        }}
                    >
                        <strong>{selectedBranches.size}</strong> sucursal(es) seleccionada(s)
                        {selectedRegionId && (
                            <>
                                {" "}
                                - Se asignará(n) a <strong>{regions.find(r => r.id.toString() === selectedRegionId)?.nombre_region}</strong>
                            </>
                        )}
                    </div>
                )}

                {/* Table Section */}
                {loading ? (
                    <Spinner />
                ) : (
                    <div className="table-responsive" ref={tableRef}>
                        <table className="table table-bordered rounded-borders">
                            <thead>
                                <tr>
                                    <th style={{ width: "50px", textAlign: "center" }}>
                                        <input
                                            type="checkbox"
                                            checked={selectedBranches.size === branches.length && branches.length > 0}
                                            onChange={toggleAllBranches}
                                            disabled={branches.length === 0}
                                            title="Seleccionar todo"
                                        />
                                    </th>
                                    <th>
                                        <i className="bi bi-building"></i> Código
                                    </th>
                                    <th>
                                        <i className="bi bi-signpost-2"></i> Nombre
                                    </th>
                                    <th>
                                        <i className="bi bi-geo-alt"></i> Región Actual
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {branches.length > 0 ? (
                                    branches.map((branch) => (
                                        <tr 
                                            key={branch.id}
                                            style={{
                                                backgroundColor: selectedBranches.has(branch.id) ? "#fff3cd" : "transparent",
                                            }}
                                        >
                                            <td style={{ textAlign: "center" }}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedBranches.has(branch.id)}
                                                    onChange={() => toggleBranchSelection(branch.id)}
                                                />
                                            </td>
                                            <td className="branch-code">{branch.codigo_sucursal}</td>
                                            <td className="branch-name">{branch.nombre_sucursal}</td>
                                            <td className="branch-region">{branch.region?.nombre_region || "—"}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="text-center">
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
        </SidebarLayout>
    );
}
