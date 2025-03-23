import Select from "react-select";
import { toast } from "react-toastify";
import '../../styles/tableStyling.css';
import { Link } from "react-router-dom";
import { fetchRoles } from '../../utils/authUtils';
import { useAuthStore } from "../../stores/authStore";
import { Spinner } from "../../components/ui/Spinner";
import { useSidebarStore } from "../../stores/sidebarStore";
import { useEffect, useState, useRef, useCallback } from "react";
import { User, UserListResponse, Role } from "../../types/authTypes";
import { SidebarLayout } from "../../components/layouts/SidebarLayout";
import { FilterSidebar } from "../../components/ui/forms/FilterSidebar";
import { AnimatedNumberCounter } from "../../components/ui/AnimatedNumberCounter";

export function UserList() {
    // Global States
    const sidebarWidthPx = useSidebarStore((state) => state.sidebarWidthPx);
    const accessToken = useAuthStore((state) => state.accessToken);

    // Data States
    const [loading, setLoading] = useState<boolean>(false);
    const [loadingMore, setLoadingMore] = useState<boolean>(false);
    const [totalUsers, setTotalUsers] = useState<number>(0);
    const [users, setUsers] = useState<User[]>([]);
    const [nextPage, setNextPage] = useState<string | null>(null);

    // Filter States
    const [showFilters, setShowFilters] = useState<boolean>(false);
    const [roles, setRoles] = useState<Role[]>([]);
    const [selectedRoles, setSelectedRoles] = useState<Role[]>([]);
    const [searchName, setSearchName] = useState<string>("");
    const [searchEmail, setSearchEmail] = useState<string>("");
    const [activeStatus, setActiveStatus] = useState<string>("");
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);
    const tableRef = useRef<HTMLDivElement | null>(null); // Reference to the table container

    const buildQueryUrl = useCallback(() => {
        let url = `${import.meta.env.VITE_REACT_APP_DJANGO_API_URL}/auth/users/list/?`;

        if (searchName) url += `name=${searchName}&`;
        if (searchEmail) url += `email=${searchEmail}&`;
        if (selectedRoles.length > 0) {
            const roleIds = selectedRoles.map((role) => role.id_rol).join(",");
            url += `rol_ids=${roleIds}&`;
        }
        if (activeStatus !== "") url += `is_active=${activeStatus}&`;

        return url;
    }, [searchName, searchEmail, selectedRoles, activeStatus]);

    // Fetch User Data
    const fetchAccounts = useCallback(async (url: string, isLoadMore: boolean = false) => {
        if (!accessToken || !url) return;
        if (isLoadMore) setLoadingMore(true);
        else {
            setLoading(true);
            setUsers([]); // Clear list when filters change
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

            const data: UserListResponse = await response.json();
            setTotalUsers(data.count);
            setUsers(prevUsers => isLoadMore ? [...prevUsers, ...data.results] : data.results);
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
            fetchAccounts(url);
        }, 500);
        
        return () => {
            if (debounceTimer.current) clearTimeout(debounceTimer.current);
        };
    }, [searchName, searchEmail, selectedRoles, activeStatus, buildQueryUrl, fetchAccounts]);

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
                fetchAccounts(nextPage, true);
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
    }, [fetchAccounts, nextPage, loadingMore]);

    return (
        <SidebarLayout sidebarWidthPx={sidebarWidthPx}>
            <h1 className="page-title">
                Usuarios Inscritos en el Sistema
                <span className="badge bg-promipyme ms-2">
                    <AnimatedNumberCounter value={totalUsers} />
                </span>
            </h1>

            {/* Filter Controls */}
            <div className="filter-controllers">
                <button className="filter-btn btn btn-outline-primary" onClick={() => setShowFilters(true)}>
                    <i className="bi bi-funnel"></i> Más Filtros
                </button>
                {/* Reset filters btn */}
                <button className="filter-btn btn btn-outline-danger" onClick={() => {
                    setSearchName("");
                    setSearchEmail("");
                    setSelectedRoles([]);
                    setActiveStatus("");
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
                    <Select
                        isMulti
                        options={roles}
                        value={selectedRoles}
                        onChange={(selected) => setSelectedRoles(selected as Role[])}
                        getOptionLabel={(option: Role) => option.nombre_rol}
                        getOptionValue={(option: Role) => String(option.id_rol)}
                        placeholder="Selecciona los roles"
                        className="react-select-container"
                        classNamePrefix="react-select"
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
                <div className="table-responsive" ref={tableRef}>
                    <table className="table table-bordered rounded-borders">
                        <thead>
                            <tr>
                                <th></th>
                                <th><i className="bi bi-type"></i> Nombre</th>
                                <th>Usuario</th>
                                <th><i className="bi bi-envelope"></i> Email</th>
                                <th>Estado</th>
                                <th>Roles</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.length > 0 ? (
                                users.map((user) => (
                                    <tr key={user.id}>
                                        <td>
                                            {user.profile_data?.foto_perfil ? (
                                                <img src={typeof user.profile_data?.foto_perfil === 'string' ? user.profile_data.foto_perfil : ''} alt="Avatar" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                                            ) : <i className="bi bi-person-circle" style={{ fontSize: '35px', color: 'gray' }}></i>}
                                        </td>
                                        <td>{user.first_name} {user.last_name}</td>
                                        <td>{user.username}</td>
                                        <td>{user.email || "—"}</td>
                                        <td><span className={`badge ${user.is_active ? "bg-success" : "bg-warning"}`}>{user.is_active ? "Activo" : "Inactivo"}</span></td>
                                        <td style={{ display: "flex", flexWrap: "wrap", gap: "10px", height: '70px', alignItems: 'center' }}>
                                            {
                                                user.roles.length > 0 
                                                ? user.roles.map((role) => <span style={{ height: '42%' }} key={role.id_rol} className="badge bg-primary">{role.nombre_rol}</span>) 
                                                : <span className="badge bg-secondary">Sin rol</span>
                                            }
                                        </td>
                                        <td><Link to={`/auth/user/profile/${user.id}`} className="btn btn-primary"><i className="bi bi-eye"></i></Link></td>
                                        {/* TODO: Delete user btn */}
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan={7} className="text-center">No hay cuentas actualmente.</td></tr>
                            )}
                        </tbody>
                    </table>
                    {loadingMore && <Spinner />}
                </div>
            )}
            <h3 style={{ marginLeft: '30px', marginTop: '40px', marginBottom: '10px' }}>¿No encuentras a quien buscas?</h3>
            <Link to="/auth/invite-user" className="btn btn-primary" style={{ textDecoration: "none", marginLeft: '30px', marginTop: '8px', marginBottom: '25px' }}>Invitar a un nuevo usuario</Link>
        </SidebarLayout>
    );
}
