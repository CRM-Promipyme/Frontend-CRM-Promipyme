import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Caso } from "../../types/workflowTypes";
import { daysLeft } from "../../utils/formatUtils";
import { formatNumber } from "../../utils/formatUtils";
import { fetchUserCases } from "../../controllers/caseControllers";


interface UserCaseListProps {
    userId: string | number;
}

export function UserCaseList({ userId }: UserCaseListProps) {
    const [relatedCases, setRelatedCases] = useState<Caso[]>([]);

    // Fetch contact activities and cases on component mount
    useEffect(() => {
        const fetchCases = async () => {
            try {
                const fetchedCases = await fetchUserCases(parseInt(userId as string));
                const cases = fetchedCases.results as Caso[];
                setRelatedCases(cases);
            } catch (error) {
                console.error("Error fetching contact cases:", error);
            }
        }

        fetchCases();
    }, [userId]);

    return (
        <div className="user-profile-cases" style={{ width: '100%', marginTop: '0px' }}>
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
                                                ? "#0F7E5E"  // Green for positive (or zero) days
                                                : "#FF8A05"  // Orange for negative days
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
        </div>
    )
}