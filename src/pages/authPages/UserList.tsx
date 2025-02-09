import { toast } from "react-toastify";
import '../../styles/tableStyling.css';
import { Link } from "react-router-dom";
import { fetchRoles } from '../../utils/authUtils';
import { useAuthStore } from "../../stores/authStore";
import { Spinner } from "../../components/ui/Spinner";
import { Multiselect } from "multiselect-react-dropdown"; // Import the multiselect
import { useSidebarStore } from "../../stores/sidebarStore";
import { useEffect, useState, useRef, useCallback } from "react";
import { User, UserListResponse, Role } from "../../types/authTypes";
import { SidebarLayout } from "../../components/layouts/SidebarLayout";
import { FilterSidebar } from "../../components/ui/forms/FilterSidebar";

export function UserList() {
    // Estados globales
    const sidebarWidthPx = useSidebarStore((state) => state.sidebarWidthPx);
    const accessToken = useAuthStore((state) => state.accessToken);
    
    // Estados para manejar la data de las solicitudes
    const [loading, setLoading] = useState<boolean>(true);
    const [users, setUsers] = useState<User[]>([]);
    const [currUrl, setCurrUrl] = useState<string>(`${import.meta.env.VITE_REACT_APP_DJANGO_API_URL}/auth/accounts/approval-queue/`);
    const [nextPage, setNextPage] = useState<string | null>(null);
    const [previousPage, setPreviousPage] = useState<string | null>(null);

    // Estados para filtrado de data
    const [showFilters, setShowFilters] = useState<boolean>(false);
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);
    const [roles, setRoles] = useState<Role[]>([]);
    const [selectedRoles, setSelectedRoles] = useState<Role[]>([]);
    const [searchName, setSearchName] = useState<string>("");
    const [searchEmail, setSearchEmail] = useState<string>("");
    const [activeStatus, setActiveStatus] = useState<string>("");
    const errorToastShown = useRef(false);

    const fetchAccounts = useCallback(async (url: string) => {
        if (!accessToken) {
            if (!errorToastShown.current) {
                toast.error("Tu sesión ha caducado. Por favor, inicia sesión nuevamente para continuar.");
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
    
            const data: UserListResponse = await response.json();
            setUsers(data.results || []);
            setNextPage(data.next);
            setPreviousPage(data.previous);
        } catch {
            if (!errorToastShown.current) {
                toast.error("Hubo un problema al obtener los datos. Inténtalo de nuevo más tarde.");
                errorToastShown.current = true;
            }
            setUsers([]);
        } finally {
            setLoading(false);
        }
    }, [accessToken]);

    // Fetch solicitudes al renderizar el componente o cuando cambia la URL
    useEffect(() => {
        if (!accessToken) {
            toast.error("Tu sesión ha caducado. Por favor, inicia sesión nuevamente para continuar.");
            return;
        };

        const loadRoles = async () => {
            try {
                const rolesData = await fetchRoles(accessToken);
                setRoles(rolesData);
                setSelectedRoles([]);
            } catch {
                toast.error("No se pudieron obtener los roles.");
            }
        }

        // Cargar los roles si no se han cargado
        if (roles.length === 0) {
            loadRoles();
        }

        fetchAccounts(currUrl);
    }, [currUrl, fetchAccounts, accessToken, roles]);

    // Construir URL con los filtros de búsqueda
    const buildQueryUrl = useCallback(() => {
        let url = `${import.meta.env.VITE_REACT_APP_DJANGO_API_URL}/auth/users/list/?`;

        // Analizar los filtros de búsqueda
        if (searchName) url += `name=${searchName}&`;
        if (searchEmail) url += `email=${searchEmail}&`;
        if (selectedRoles.length > 0) {
            const roleIds = selectedRoles.map((role) => role.id).join(",");
            url += `rol_ids=${roleIds}&`;
        }
        if (activeStatus !== "") url += `is_active=${activeStatus}&`;

        return url;
    }, [searchName, searchEmail, selectedRoles, activeStatus]);

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
    }, [searchName, searchEmail, selectedRoles, activeStatus, buildQueryUrl]);

    return (
        <SidebarLayout sidebarWidthPx={sidebarWidthPx}>
            <h1 style={{ marginBottom: '25px' }}>Usuarios Inscritos en el Sistema</h1>

            {/* Controles de filtrado */}
            <button className="btn btn-outline-primary" style={{ marginBottom: '25px' }} onClick={() => setShowFilters(true)}>
                <i className="bi bi-funnel"></i> Filtros
            </button>
            <FilterSidebar show={showFilters} onClose={() => setShowFilters(false)}>
                <div className="mb-3">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Filtrar por nombre..."
                        value={searchName}
                        onChange={(e) => setSearchName(e.target.value)}
                    />
                </div>
                <div className="mb-3">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Filtrar por email..."
                        value={searchEmail}
                        onChange={(e) => setSearchEmail(e.target.value)}
                    />
                </div>
                <div className="mb-3">
                    <Multiselect
                        options={roles}
                        selectedValues={selectedRoles}
                        onSelect={(selectedList) => setSelectedRoles(selectedList)}
                        onRemove={(selectedList) => setSelectedRoles(selectedList)}
                        displayValue="nombre_rol"
                        placeholder="Filtrar por rol..."
                    />
                </div>
                <div className="mb-3">
                    <select
                        className="form-select"
                        value={activeStatus}
                        onChange={(e) => setActiveStatus(e.target.value)}
                    >
                        <option value="">Filtrar por estado...</option>
                        <option value="all">Todos</option>
                        <option value="active">Activo</option>
                        <option value="inactive">Inactivo</option>
                    </select>
                </div>
            </FilterSidebar>

            {loading ? (
                <Spinner />
            ) : (
                <div className="table-responsive">
                    <table className="table table-bordered rounded-borders">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Usuario</th>
                                <th>Email</th>
                                <th>Estado</th>
                                <th>Roles</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users && users.length > 0 ? (
                                users.map((user) => (
                                    <tr key={user.id}>
                                        <td className={`${user.first_name && user.last_name ? "" : "text-muted text-center"}`}>
                                            {user.first_name && user.last_name ? (
                                                `${user.first_name} ${user.last_name}`
                                            ) : (
                                                "—"
                                            )}
                                        </td>
                                        <td>{user.username}</td>
                                        <td className={`${user.email ? "" : "text-muted text-center"}`}>
                                            {user.email ? user.email : "—"}
                                        </td>
                                        <td>
                                            {user.is_active ? (
                                                <span className="badge bg-success">Activo</span>
                                            ) : (
                                                <span className="badge bg-warning">Inactivo</span>
                                            )}
                                        </td>
                                        <td>
                                            {user.roles && user.roles.length > 0 ? (
                                                user.roles.map((role) => (
                                                    <span key={role.id} className="badge bg-primary">{role.nombre_rol}</span>
                                                ))
                                            ) : (
                                                <span className="badge bg-secondary">Sin rol</span>
                                            )}
                                        </td>
                                        <td className="text-center">
                                            {/* TODO: View user details functionality */}
                                            <Link to={`/auth/user/profile/${user.id}`} className="btn btn-primary">
                                                <i className="bi bi-eye"></i>
                                            </Link>

                                            {/* TODO: Delete user integration */}
                                            <button className="btn btn-danger ms-2">
                                                <i className="bi bi-x-square"></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="text-center">No hay cuentas actualmente.</td>
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
        </SidebarLayout>
    );
}
