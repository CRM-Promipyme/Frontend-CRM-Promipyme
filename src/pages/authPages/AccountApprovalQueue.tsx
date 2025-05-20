import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "react-toastify";
import '../../styles/tableStyling.css';
import '../../styles/auth/authStyles.css';
import { Link } from "react-router-dom";
import { fetchRoles } from '../../utils/authUtils';
import { useAuthStore } from "../../stores/authStore";
import { Spinner } from "../../components/ui/Spinner";
import { Multiselect } from "multiselect-react-dropdown"; 
import { useSidebarStore } from "../../stores/sidebarStore";
import { PopupModal } from "../../components/ui/PopupModal";
import { useEffect, useState, useRef, useCallback } from "react";
import { SidebarLayout } from "../../components/layouts/SidebarLayout";
import { FilterSidebar } from "../../components/ui/forms/FilterSidebar";
import { AnimatedNumberCounter } from "../../components/ui/AnimatedNumberCounter";
import { PendingAccount, PendingAccountResponse, Role } from "../../types/authTypes";

export function AccountApprovalQueue() {
    // Estados globales
    const authStore = useAuthStore();
    const sidebarWidthPx = useSidebarStore((state) => state.sidebarWidthPx);
    const accessToken = useAuthStore((state) => state.accessToken);

    // Estados locales
    const [loading, setLoading] = useState<boolean>(false);
    const [loadingMore, setLoadingMore] = useState<boolean>(false);
    const [pendingAccounts, setPendingAccounts] = useState<PendingAccount[]>([]);
    const [totalAccs, setTotalAccs] = useState<number>(0);
    const [nextPage, setNextPage] = useState<string | null>(
        `${import.meta.env.VITE_REACT_APP_DJANGO_API_URL}/auth/accounts/approval-queue/`
    );
    const [selectedAccount, setSelectedAccount] = useState<PendingAccount | null>(null);

    // Filter States
    const [showFilters, setShowFilters] = useState<boolean>(false);
    const [showModal, setShowModal] = useState<boolean>(false);
    const [modalType, setModalType] = useState<"approve" | "reject">("approve");
    const [roles, setRoles] = useState<Role[]>([]);
    const [selectedRoles, setSelectedRoles] = useState<number[]>([]);
    const [searchName, setSearchName] = useState<string>("");
    const [searchEmail, setSearchEmail] = useState<string>("");
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);
    const tableRef = useRef<HTMLDivElement | null>(null);

    const buildQueryUrl = useCallback(() => {
        let url = `${import.meta.env.VITE_REACT_APP_DJANGO_API_URL}/auth/accounts/approval-queue/?`;

        if (searchName) url += `name=${searchName}&`;
        if (searchEmail) url += `email=${searchEmail}&`;

        return url;
    }, [searchName, searchEmail]);

    // Fetch Pending Accounts
    const fetchPendingAccounts = useCallback(async (url: string, isLoadMore: boolean = false) => {
        if (!accessToken || !url) return;
        if (isLoadMore) setLoadingMore(true);
        else {
            setLoading(true);
            setPendingAccounts([]); // Clear list when filters change
        }

        try {
            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);

            const data: PendingAccountResponse = await response.json();
            setTotalAccs(data.count);
            setPendingAccounts(prevAccs => isLoadMore ? [...prevAccs, ...data.results] : data.results);
            setNextPage(data.next);
        } catch {
            toast.error("Hubo un problema al obtener los datos.");
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [accessToken]);

    // Fetch Users when filters change
    useEffect(() => {
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }
        debounceTimer.current = setTimeout(() => {
            const url = buildQueryUrl();
            setNextPage(url);
            fetchPendingAccounts(url);
        }, 500);
        
        return () => {
            if (debounceTimer.current) clearTimeout(debounceTimer.current);
        };
    }, [searchName, searchEmail, buildQueryUrl, fetchPendingAccounts]);

    // Fetch Roles only once
    useEffect(() => {
        if (!accessToken || roles.length > 0) return;

        const loadRoles = async () => {
            try {
                const rolesData = await fetchRoles(accessToken);
                setRoles(rolesData);
                setSelectedRoles([]);
            } catch {
                toast.error("No se pudieron obtener los roles.");
            }
        };
        loadRoles();
    }, [accessToken, roles]);

    // Infinite Scroll Effect
    useEffect(() => {
        const handleScroll = () => {
            if (loadingMore || !nextPage || !tableRef.current) return;

            const { scrollTop, scrollHeight, clientHeight } = tableRef.current;
            if (scrollHeight - scrollTop <= clientHeight + 50) {
                fetchPendingAccounts(nextPage, true);
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
    }, [fetchPendingAccounts, nextPage, loadingMore]);

    // Obtener roles y mostrar modal de aprobación
    const handleOpenApproveModal = async (account: PendingAccount) => {
        // Allow admins to always proceed
        if (authStore.isAdmin && authStore.isAdmin()) {
            setModalType("approve");
            setSelectedAccount(account);
            
            if (!accessToken) {
                toast.error("Tu sesión ha caducado. Por favor, inicia sesión nuevamente para continuar.");
                return;
            };

            try {
                const roles = await fetchRoles(accessToken);
                setRoles(roles);
                setSelectedRoles([]);
                setShowModal(true);
            } catch {
                toast.error("No se pudieron obtener los roles.");
            }

            return;
        }
        
        const permissions = await authStore.retrievePermissions();
        const hasPermission = permissions.some((perm: any) =>
            perm.base_permissions &&
            perm.base_permissions['approve_accounts'] === true
        );
        if (!hasPermission) {
            toast.warning("No tienes permisos para realizar esta acción.");
            return false;
        } else {
            setModalType("approve");
            setSelectedAccount(account);
            
            if (!accessToken) {
                toast.error("Tu sesión ha caducado. Por favor, inicia sesión nuevamente para continuar.");
                return;
            };
            
            try {
                const roles = await fetchRoles(accessToken);
                setRoles(roles);
                setSelectedRoles([]);
                setShowModal(true);
            } catch {
                toast.error("No se pudieron obtener los roles.");
            }
        }
    };

    // Approve API call
    const handleApprove = async () => {
        if (!selectedAccount) return;
        if (selectedRoles.length === 0) {
            toast.error("Selecciona al menos un rol.");
            return;
        }

        try {
            const response = await fetch(`${import.meta.env.VITE_REACT_APP_DJANGO_API_URL}/auth/accounts/requests/approve/${selectedAccount.id}/`, {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ approved: true, role_ids: selectedRoles }),
            });

            if (!response.ok) throw new Error();

            toast.success("Cuenta aprobada exitosamente.");
            fetchPendingAccounts(buildQueryUrl());
            setShowModal(false);
        } catch {
            toast.error("Error al aprobar la cuenta.");
        }
    };

    const handleOpenRejectModal = async (account: PendingAccount) => {
        // Allow admins to always proceed
        if (authStore.isAdmin && authStore.isAdmin()) {
            setModalType("reject");
            setSelectedAccount(account);
            setShowModal(true);

            return;
        }
        
        const permissions = await authStore.retrievePermissions();
        const hasPermission = permissions.some((perm: any) =>
            perm.base_permissions &&
            perm.base_permissions['deny_accounts'] === true
        );
        if (!hasPermission) {
            toast.warning("No tienes permisos para realizar esta acción.");
            return false;
        } else {
            setModalType("reject");
            setSelectedAccount(account);
            setShowModal(true);
        }
    }

    // Reject API call
    const handleReject = async () => {
        if (!selectedAccount) return;

        try {
            const response = await fetch(`${import.meta.env.VITE_REACT_APP_DJANGO_API_URL}/auth/accounts/requests/approve/${selectedAccount.id}/`, {
                method: "PUT",
                headers: { "Authorization": `Bearer ${accessToken}` },
            });

            if (!response.ok) throw new Error();

            toast.success("Cuenta rechazada exitosamente.");
            fetchPendingAccounts(buildQueryUrl());
            setShowModal(false);
        } catch {
            toast.error("Error al rechazar la cuenta.");
        }
    };

    return (
        <SidebarLayout sidebarWidthPx={sidebarWidthPx}>
            <h1 className="page-title">
                Cuentas Pendientes por Aprobar
                <span className="badge bg-promipyme ms-2">
                    <AnimatedNumberCounter value={totalAccs} />
                </span>
            </h1>

            {/* Filter Controls */}
            <div className="filter-controllers">
                <button className="filter-btn btn btn-outline-primary" onClick={() => setShowFilters(true)}>
                    <i className="bi bi-funnel"></i> Más Filtros
                </button>
                <button className="filter-btn btn btn-outline-danger" onClick={() => {
                    setSearchName("");
                    setSearchEmail("");
                }}>
                    <i className="bi bi-x-circle"></i> Limpiar Filtros
                </button>
                <input
                    type="text"
                    className="form-control text-search"
                    placeholder="Filtrar por nombre..."
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                />
            </div>
            <FilterSidebar show={showFilters} onClose={() => setShowFilters(false)}>
                <input
                    type="text"
                    className="form-control"
                    placeholder="Filtrar por email..."
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                />
            </FilterSidebar>

            {loading ? (
                <Spinner className='spinner-border-lg' />
            ) : (
                <div className="table-responsive" ref={tableRef}>
                    <table className="table table-bordered rounded-borders">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Nombre</th>
                                <th>Usuario</th>
                                <th>Email</th>
                                <th>Fecha de Solicitud</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pendingAccounts.length > 0 ? (
                                pendingAccounts.map((account) => (
                                    <tr key={account.id}>
                                        <td>{account.id}</td>
                                        <td>{account.first_name} {account.last_name}</td>
                                        <td>{account.username}</td>
                                        <td>{account.email}</td>
                                        <td>{format(new Date(account.requested_date), "dd/MM/yyyy 'a las' HH:mm", { locale: es })}</td>
                                        <td className="row-action-container">
                                            <button className="btn btn-outline-primary btn-sm me-2" onClick={() => handleOpenApproveModal(account)}>
                                                Aprobar
                                            </button>
                                            <button className="btn btn-outline-danger btn-sm" onClick={() => handleOpenRejectModal(account)}>
                                                Rechazar
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan={6} className="text-center">No hay solicitudes pendientes</td></tr>
                            )}
                        </tbody>
                    </table>
                    {loadingMore && <Spinner />}
                </div>
            )}

            <h3 style={{ marginLeft: '30px', marginTop: '20px', marginBottom: '10px' }}>¿No encuentras a quien buscas?</h3>
            <Link to="/auth/invite-user" className="btn btn-primary" style={{ textDecoration: "none", marginLeft: '30px', marginTop: '8px', marginBottom: '25px' }}>Invitar a un nuevo usuario</Link>

            {showModal && (
                <PopupModal show={showModal} onClose={() => setShowModal(false)}>
                    <div className="modal-header" style={{ marginBottom: '15px'}}>
                        <h3>{modalType === "approve" ? "Aprobar Cuenta" : "Rechazar Cuenta"}</h3>
                        <span className="scale" onClick={() => setShowModal(false)}>
                            <i className="bi bi-x-circle"></i>
                        </span>
                    </div>

                    {/* Mostrar información del usuario a aprobar */}
                    <div>
                        <h5>Información del Usuario</h5>
                        <p><strong>Nombre:</strong> {selectedAccount?.first_name} {selectedAccount?.last_name}</p>
                        <p><strong>Usuario:</strong> {selectedAccount?.username}</p>
                        <p><strong>Email:</strong> {selectedAccount?.email}</p>
                        <p><strong>Fecha de Solicitud:</strong> {selectedAccount && format(new Date(selectedAccount.requested_date), "dd/MM/yyyy 'a las' HH:mm", { locale: es })}</p>
                    </div>

                    {modalType === "approve" ? (
                        <>
                            <p>Selecciona los roles para el usuario:</p>
                            <Multiselect
                                options={roles}
                                selectedValues={selectedRoles}
                                onSelect={setSelectedRoles}
                                onRemove={setSelectedRoles}
                                displayValue="nombre_rol"
                                placeholder="Selecciona los roles"
                                showArrow
                                closeOnSelect={false}
                                className="multi-select-dropdown"
                            />
                            <div className="modal-actions" style={{ marginTop: "20px", display: 'flex', justifyContent: 'space-around' }}>
                                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                                <button className="btn btn-primary" onClick={handleApprove}>Aprobar</button>
                            </div>
                        </>
                    ) : (
                        <>
                            <p>¿Estás seguro de que deseas rechazar esta solicitud?</p>
                            <div className="modal-actions" style={{ marginTop: "20px", display: 'flex', justifyContent: 'space-around' }}>
                                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                                <button className="btn btn-danger" onClick={handleReject}>Rechazar</button>
                            </div>
                        </>
                    )}
                </PopupModal>
            )}
        </SidebarLayout>
    );
}
