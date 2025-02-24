import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
import { useState, useEffect, useCallback, useRef } from "react";
import { Spinner } from "../../components/ui/Spinner";
import { formatCedula } from "../../utils/formatUtils";
import { useSidebarStore } from "../../stores/sidebarStore";
import { SidebarLayout } from "../../components/layouts/SidebarLayout";
import { FilterSidebar } from "../../components/ui/forms/FilterSidebar";
import { Contact, ContactListResponse } from "../../types/contactTypes";
import { AnimatedNumberCounter } from "../../components/ui/AnimatedNumberCounter";

export function ContactList() {
    // Global States
    const sidebarWidthPx = useSidebarStore((state) => state.sidebarWidthPx);
    const accessToken = useAuthStore((state) => state.accessToken);
    const navigate = useNavigate();

    // Local States
    const [loading, setLoading] = useState<boolean>(true);
    const [showFilters, setShowFilters] = useState(false);
    const [totalContacts, setTotalContacts] = useState<number>(0);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [nextPage, setNextPage] = useState<string | null>(null);
    const [prevPage, setPrevPage] = useState<string | null>(null);

    // Filter States
    const [searchName, setSearchName] = useState("");
    const [searchEmail, setSearchEmail] = useState("");
    const [searchPhone, setSearchPhone] = useState("");
    const [searchAddress, setSearchAddress] = useState("");
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);

    // Construct API URL with filters
    const buildQueryUrl = useCallback(() => {
        let url = `${import.meta.env.VITE_REACT_APP_DJANGO_API_URL}/contacts/list/?`;

        if (searchName) url += `nombre=${searchName}&`;
        if (searchEmail) url += `email=${searchEmail}&`;
        if (searchPhone) url += `numero_telefonico=${searchPhone}&`;
        if (searchAddress) url += `direccion=${searchAddress}&`;

        return url;
    }, [searchName, searchEmail, searchPhone, searchAddress]);

    // Fetch Contacts
    const fetchContacts = useCallback(async (url: string) => {
        if (!accessToken) {
            toast.error("No se ha iniciado sesión.");
            navigate("/auth/login");
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

            const data: ContactListResponse = await response.json();
            setTotalContacts(data.count);
            setContacts(data.results);
            setNextPage(data.next);
            setPrevPage(data.previous);
        } catch (err) {
            console.error(err);
            toast.error("Error al cargar los contactos");
        } finally {
            setLoading(false);
        }
    }, [accessToken, navigate]);

    // Fetch contacts on mount and when filters change (debounced)
    useEffect(() => {
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
            fetchContacts(buildQueryUrl());
        }, 500);  // Debounce to avoid excessive API calls

        return () => {
            if (debounceTimer.current) clearTimeout(debounceTimer.current);
        };
    }, [buildQueryUrl, fetchContacts]);

    return (
        <SidebarLayout sidebarWidthPx={sidebarWidthPx}>
            <h1 className="page-title">
                Contactos Inscritos en el Sistema
                <span className="badge bg-promipyme ms-2">
                    <AnimatedNumberCounter value={totalContacts} />
                </span>
            </h1>

            {/* Filter Controls */}
            <div className="filter-controllers" style={{ justifyContent: "space-between" }}>
                <div className="d-flex align-items-center" style={{ gap: "20px" }}>
                    <button className="filter-btn btn btn-outline-primary" onClick={() => setShowFilters(true)}>
                        <i className="bi bi-funnel"></i> Más Filtros
                    </button>
                    <button className="filter-btn btn btn-outline-danger" onClick={() => {
                        setSearchName("");
                        setSearchEmail("");
                        setSearchPhone("");
                        setSearchAddress("");
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
                <div>
                    <button className="btn btn-primary" 
                        onClick={() => navigate("/contacts/create")}
                        style={{ marginRight: "30px"}}
                    >
                        {/* TODO: Create contact */}
                        <i className="bi bi-person-plus"></i> Nuevo Contacto
                    </button>
                </div>
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
                    <input
                        type="text"
                        className="form-control text-search"
                        placeholder="Filtrar por teléfono..."
                        value={searchPhone}
                        onChange={(e) => setSearchPhone(e.target.value)}
                    />
                </div>
                <div className="mb-3">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Filtrar por dirección..."
                        value={searchAddress}
                        onChange={(e) => setSearchAddress(e.target.value)}
                    />
                </div>
            </FilterSidebar>

            {loading ? (
                <Spinner />
            ) : (
                <>
                    <div className="table-responsive">
                        <table className="table table-bordered rounded-borders">
                            <thead>
                                <tr>
                                    <th>Cédula</th>
                                    <th>Nombre</th>
                                    <th>Email</th>
                                    <th>Teléfonos de Contacto</th>
                                    <th>Fecha de Nacimiento</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {contacts.length > 0 ? (
                                    contacts.map((contact) => (
                                        <tr key={contact.contact_id}>
                                            <td>
                                                <span className="badge bg-primary me-1">
                                                    {formatCedula(contact.cedula)}
                                                </span>
                                            </td>
                                            <td>{contact.nombres} {contact.apellidos}</td>
                                            <td>{contact.email}</td>
                                            <td>{contact.telefonos.map((tel) => (
                                                <span key={tel.numero_telefonico} className="badge bg-secondary me-1">
                                                    {tel.numero_telefonico}
                                                </span>
                                            ))}</td>
                                            <td>{contact.fecha_nacimiento}</td>
                                            <td>
                                                <button
                                                    className="btn btn-outline-primary"
                                                    onClick={() => navigate(`/contacts/details/${contact.contact_id}`)}
                                                >
                                                    <i className="bi bi-eye"></i> Ver
                                                </button>
                                                {/* TODO: Delete user functionality */}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan={4} className="text-center">No hay contactos actualmente.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    <div className="pagination-controls">
                        <button
                            className="btn btn-outline-secondary"
                            disabled={!prevPage}
                            onClick={() => fetchContacts(prevPage!)}
                        >
                            ← Anterior
                        </button>
                        <button
                            className="btn btn-outline-secondary ms-2"
                            disabled={!nextPage}
                            onClick={() => fetchContacts(nextPage!)}
                        >
                            Siguiente →
                        </button>
                    </div>
                </>
            )}
        </SidebarLayout>
    );
}
