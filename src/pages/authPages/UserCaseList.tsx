import { format } from "date-fns";
import { es } from "date-fns/locale";
import api from "../../controllers/api";
import { Link } from "react-router-dom";
import { useState, useEffect, useRef, useCallback } from "react";
import { Caso } from "../../types/workflowTypes";
import { daysLeft } from "../../utils/formatUtils";
import { formatNumber } from "../../utils/formatUtils";

interface UserCaseListProps {
    userId: string | number;
}

export function UserCaseList({ userId }: UserCaseListProps) {
    const [relatedCases, setRelatedCases] = useState<Caso[]>([]);
    const [nextUrl, setNextUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Fetch initial cases
    useEffect(() => {
        setRelatedCases([]);
        setNextUrl(null);
        setLoading(true);
        const fetchCases = async () => {
            try {
                const response = await api.get(`/workflows/casos/list/?user_id=${userId}`);
                setRelatedCases(response.data.results);
                setNextUrl(response.data.next);
            } catch (error) {
                console.error("Error fetching contact cases:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCases();
    }, [userId]);

    // Fetch more cases (pagination)
    const fetchMoreCases = useCallback(async () => {
        if (!nextUrl || loading) return;
        setLoading(true);
        try {
            let url = nextUrl;
            // Patch: force https if frontend is https and url is http
            if (window.location.protocol === "https:" && url.startsWith("http://")) {
                url = url.replace("http://", "https://");
            }
            const response = await api.get(url);
            setRelatedCases(prev => [...prev, ...response.data.results]);
            setNextUrl(response.data.next);
        } catch (error) {
            console.error("Error fetching more cases:", error);
        } finally {
            setLoading(false);
        }
    }, [nextUrl, loading]);

    // Infinite scroll handler
    useEffect(() => {
        const handleScroll = () => {
            const el = containerRef.current;
            if (!el || loading || !nextUrl) return;
            const threshold = 100;
            if (el.scrollHeight - el.scrollTop - el.clientHeight < threshold) {
                fetchMoreCases();
            }
        };
        const el = containerRef.current;
        if (el) {
            el.addEventListener("scroll", handleScroll);
        }
        return () => {
            if (el) {
                el.removeEventListener("scroll", handleScroll);
            }
        };
    }, [fetchMoreCases, loading, nextUrl]);

    return (
        <div
            className="user-profile-cases"
            style={{ width: '100%', marginTop: '0px', maxHeight: 500, overflowY: 'auto' }}
            ref={containerRef}
        >
            {relatedCases.length > 0 ? (
                relatedCases.map((caseObj) => (
                    <Link key={caseObj.id_caso} to={`/workflows/board-view/${caseObj.proceso}?active_tab=case-list-tab&selected_case=${caseObj.id_caso}`} style={{ textDecoration: 'none' }}>
                        <div className="kanban-task">
                            <h4 className="case-title">{caseObj.nombre_caso}</h4>
                            <div className="case-contact-information">
                                <i className="bi bi-person"></i>
                                <p>{caseObj.contact_first_name}</p>
                                <p>{caseObj.contact_last_name}</p>
                            </div>
                            <div className="case-dates">
                                <div className="case-date">
                                    <div className="date-item">
                                        <i className="bi bi-calendar"></i>
                                        <p className="date-label">Creado:</p>
                                    </div>
                                    <p className="item-value">{format(new Date(caseObj.fecha_creacion), "PPP", { locale: es })}</p>
                                </div>
                                <div className="case-date">
                                    <div className="date-item">
                                        <i className="bi bi-clock"></i>
                                        <p className="date-label">Fecha de cierre:</p>
                                    </div>
                                    <p className="item-value">{format(new Date(caseObj.fecha_cierre), "PPP", { locale: es })}</p>
                                </div>
                            </div>
                            <div className="case-dates" style={{ justifyContent: "space-between", gap: "unset", textAlign: "right" }}>
                                <div className="case-date">
                                    <div className="date-item">
                                        <i className="bi bi-currency-dollar"></i>
                                        <p>Valor:</p>
                                    </div>
                                    <p className="item-value">RD$ {formatNumber(parseFloat(caseObj.valor_caso))}</p>
                                </div>
                                <div className="case-date">
                                    <div className="date-item">
                                        <i className="bi bi-clock"></i>
                                        <p>Tiempo Restante:</p>
                                    </div>
                                    <p
                                        className="item-value"
                                        style={{
                                            color: daysLeft(new Date(caseObj.fecha_cierre_estimada)) >= 0
                                                ? "#0F7E5E"
                                                : "#FF8A05"
                                        }}
                                    >
                                        {daysLeft(new Date(caseObj.fecha_cierre_estimada))} días
                                    </p>
                                </div>
                            </div>
                            {caseObj.abierto ? (
                                <span className="case-status-badge case-open">Abierto</span>
                            ) : (
                                <span className="case-status-badge case-closed">Cerrado</span>
                            )}
                        </div>
                    </Link>
                ))
            ) : (
                <p style={{ marginTop: '15px', marginBottom: '0px' }}>No hay casos relacionados actualmente...</p>
            )}
            {loading && <div style={{ textAlign: "center", padding: 16 }}>Cargando...</div>}
        </div>
    );
}