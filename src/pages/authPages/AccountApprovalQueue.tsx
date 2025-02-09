import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "react-toastify";
import '../../styles/tableStyling.css';
import { Link } from "react-router-dom";
import { fetchRoles } from '../../utils/authUtils';
import { useAuthStore } from "../../stores/authStore";
import { Spinner } from "../../components/ui/Spinner";
import { Multiselect } from "multiselect-react-dropdown"; // Import the multiselect
import { useSidebarStore } from "../../stores/sidebarStore";
import { PopupModal } from "../../components/ui/PopupModal";
import { useEffect, useState, useRef, useCallback } from "react";
import { SidebarLayout } from "../../components/layouts/SidebarLayout";
import { PendingAccount, PendingAccountResponse, Role } from "../../types/authTypes";

export function AccountApprovalQueue() {
    // Estados globales
    const sidebarWidthPx = useSidebarStore((state) => state.sidebarWidthPx);
    const accessToken = useAuthStore((state) => state.accessToken);
    
    // Estados para manejar la data de las solicitudes
    const [loading, setLoading] = useState<boolean>(true);
    const [pendingAccounts, setPendingAccounts] = useState<PendingAccount[]>([]);
    const [currUrl, setCurrUrl] = useState<string>(`${import.meta.env.VITE_REACT_APP_DJANGO_API_URL}/auth/accounts/approval-queue/`);
    const [nextPage, setNextPage] = useState<string | null>(null);
    const [previousPage, setPreviousPage] = useState<string | null>(null);

    // Estados para la aprobación/rechazo de solicitudes
    const [showModal, setShowModal] = useState<boolean>(false);
    const [modalType, setModalType] = useState<"approve" | "reject">("approve");
    const [selectedAccount, setSelectedAccount] = useState<PendingAccount | null>(null);
    const [roles, setRoles] = useState<Role[]>([]);
    const [selectedRoles, setSelectedRoles] = useState<number[]>([]);

    // Estados para filtrado de data
    const [searchName, setSearchName] = useState<string>("");
    const [searchEmail, setSearchEmail] = useState<string>("");
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);
    const errorToastShown = useRef(false);

    const fetchPendingAccounts = useCallback(async (url: string) => {
        if (!accessToken) {
            if (!errorToastShown.current) {
                toast.error("Error: No se encontró el token de autenticación.");
                errorToastShown.current = true;
            }
            setLoading(false);
            return;
        }

        setLoading(true);
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
            setPendingAccounts(data.results);
            setNextPage(data.next);
            setPreviousPage(data.previous);
        } catch {
            if (!errorToastShown.current) {
                toast.error("Hubo un problema al obtener los datos. Inténtalo de nuevo más tarde.");
                errorToastShown.current = true;
            }
        } finally {
            setLoading(false);
        }
    }, [accessToken]);

    // Fetch solicitudes al renderizar el componente o cuando cambia la URL
    useEffect(() => {
        fetchPendingAccounts(currUrl);
    }, [currUrl, fetchPendingAccounts]);

    // Construir URL con los filtros de búsqueda
    const buildQueryUrl = useCallback(() => {
        let url = `${import.meta.env.VITE_REACT_APP_DJANGO_API_URL}/auth/accounts/approval-queue/?`;
        if (searchName) url += `name=${searchName}&`;
        if (searchEmail) url += `email=${searchEmail}&`;
        return url;
    }, [searchName, searchEmail]);

    // Debounce para evitar múltiples llamadas al API
    useEffect(() => {
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }
        debounceTimer.current = setTimeout(() => {
            setCurrUrl(buildQueryUrl());
        }, 500);
        
        return () => {
            if (debounceTimer.current) clearTimeout(debounceTimer.current);
        };
    }, [searchName, searchEmail, buildQueryUrl]);

    // Obtener roles y mostrar modal de aprobación
    const handleOpenApproveModal = async (account: PendingAccount) => {
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
            fetchPendingAccounts(currUrl);
            setShowModal(false);
        } catch {
            toast.error("Error al aprobar la cuenta.");
        }
    };

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
            fetchPendingAccounts(currUrl);
            setShowModal(false);
        } catch {
            toast.error("Error al rechazar la cuenta.");
        }
    };

    return (
        <SidebarLayout sidebarWidthPx={sidebarWidthPx}>
            <h1 style={{ marginBottom: '25px' }}>Cuentas Pendientes por Aprobar</h1>

            {/* Controles de filtrado */}
            <div className="mb-3 d-flex gap-3">
                <input
                    type="text"
                    className="form-control"
                    placeholder="Filtrar por nombre..."
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                />
                <input
                    type="text"
                    className="form-control"
                    placeholder="Filtrar por email..."
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                />
            </div>

            {loading ? (
                <Spinner />
            ) : (
                <div className="table-responsive">
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
                                        <td>
                                            {format(new Date(account.requested_date), "dd/MM/yyyy 'a las' HH:mm", { locale: es })}
                                        </td>
                                        <td className="row-action-container">
                                            <button className="btn btn-success btn-sm me-2" onClick={() => handleOpenApproveModal(account)}>
                                                Aprobar
                                            </button>
                                            <button className="btn btn-danger btn-sm" onClick={() => { setModalType("reject"); setSelectedAccount(account); setShowModal(true); }}>
                                                Rechazar
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="text-center">No hay solicitudes pendientes</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Controles de paginación */}
            <div className="d-flex justify-content-between mt-3">
                <button
                    className="btn btn-primary"
                    onClick={() => previousPage && setCurrUrl(previousPage)}
                    disabled={!previousPage}
                >
                    ← Anterior
                </button>
                <button
                    className="btn btn-primary"
                    onClick={() => nextPage && setCurrUrl(nextPage)}
                    disabled={!nextPage}
                >
                    Siguiente →
                </button>
            </div>

            <h3 style={{ marginTop: '30px', marginBottom: '10px' }}>¿No encuentras a quien buscas?</h3>
            <Link to="/auth/invite-user" className="btn btn-primary" style={{ textDecoration: "none" }}>Invitar a un nuevo usuario</Link>

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
