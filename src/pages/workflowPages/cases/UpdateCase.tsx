import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Select from "react-select";
import debounce from "lodash.debounce";
import AsyncSelect from "react-select/async";
import { toast } from "react-toastify";
import { Spinner } from "../../../components/ui/Spinner";
import { SidebarLayout } from "../../../components/layouts/SidebarLayout";
import { useSidebarStore } from "../../../stores/sidebarStore";
import { useAuthStore } from "../../../stores/authStore";
import { Contact } from "../../../types/contactTypes";
import { Proceso } from "../../../types/workflowTypes";
import { fetchCase } from "../../../controllers/caseControllers";
import { fetchContacts } from "../../../controllers/contactControllers";
import { fetchProcesses } from "../../../controllers/workflowControllers";
import { updateCase } from "../../../controllers/caseControllers";
import { formatDatetimeForInput } from "../../../utils/formatUtils";
import { AnimatedSelectMenu } from "../../../components/ui/forms/AnimatedSelectMenu";

const formatNumber = (num: string) => {
    // Remove any existing commas first
    const value = num.replace(/,/g, '');
    // Format with commas
    return value.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

type ContactOption = { label: string; value: number };

export function UpdateCase() {
    const { caseId } = useParams<{ caseId: string }>();
    const sidebarWidthPx = useSidebarStore((s) => s.sidebarWidthPx);
    const navigate = useNavigate();
    const userId = useAuthStore((s) => s.userId);
    const [loading, setLoading] = useState(false);

    // Form State
    const [processes, setProcesses] = useState<Proceso[]>([]);
    const [selectedProcessId, setSelectedProcessId] = useState<number | null>(null);
    const [selectedStageId, setSelectedStageId] = useState<number | null>(null);
    const [selectedContact, setSelectedContact] = useState<ContactOption | null>(null);
    const [caseName, setCaseName] = useState("");
    const [caseDescription, setCaseDescription] = useState("");
    const [caseValue, setCaseValue] = useState("");
    const [estimatedCloseDate, setEstimatedCloseDate] = useState("");
    const [closingDate, setClosingDate] = useState("");
    const [open, setOpen] = useState(true);
    const [successful, setSuccessful] = useState(false);

    const selectedProcess = processes.find(p => p.id_proceso === selectedProcessId);

    useEffect(() => {
        const loadInitialData = async () => {
            if (!caseId) return;

            try {
                const processesRes = await fetchProcesses();
                setProcesses(processesRes);

                const caseRes = await fetchCase(Number(caseId));
                if (!caseRes?.case) {
                    toast.error("No se encontró el caso.");
                    return;
                }

                const c = caseRes.case;
                setCaseName(c.nombre_caso);
                setCaseDescription(c.descripcion_caso);
                setCaseValue(c.valor_caso);
                setEstimatedCloseDate(formatDatetimeForInput(c.fecha_cierre_estimada) || "");
                setClosingDate(formatDatetimeForInput(c.fecha_cierre) || "");
                setOpen(c.abierto);
                setSuccessful(c.exitoso);
                setSelectedProcessId(c.proceso);
                setSelectedStageId(c.etapa_actual);
                setSelectedContact({
                    label: `${c.contact_first_name} ${c.contact_last_name}`,
                    value: c.contact,
                });
            } catch (err) {
                console.error(err);
                toast.error("Error al cargar los datos del caso.");
            }
        };

        loadInitialData();
    }, [caseId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!caseId || !caseName || !selectedProcessId || !selectedStageId || !selectedContact) {
            toast.error("Completa todos los campos obligatorios.");
            return;
        }

        const payload = {
            case_name: caseName,
            case_description: caseDescription,
            case_value: caseValue.replace(/,/g, ''), // Remove commas before sending
            case_estimated_close_date: estimatedCloseDate,
            closing_date: closingDate,
            open,
            successful,
            process_id: selectedProcessId,
            stage_id: selectedStageId,
            contact_id: selectedContact.value,
            creator_id: userId,
        };

        setLoading(true);
        try {
            await updateCase(Number(caseId), payload);
            toast.success("Caso actualizado correctamente.");
            navigate(`/workflows/board-view/${selectedProcessId}?active_tab=case-list-tab&selected_case=${caseId}`);
        } catch {
            toast.error("Error al actualizar el caso.");
        } finally {
            setLoading(false);
        }
    };

    const debouncedFetchContacts = debounce(
        async (inputValue: string, callback: (options: ContactOption[]) => void) => {
            if (!inputValue.trim()) return callback([]);
            try {
                const contacts = await fetchContacts(inputValue);
                callback(
                    contacts.slice(0, 10).map((c: Contact) => ({
                        label: `${c.nombres} ${c.apellidos}`,
                        value: c.contact_id,
                    }))
                );
            } catch {
                callback([]);
            }
        },
        500
    );

    const loadContactOptions = (inputValue: string): Promise<ContactOption[]> => {
        return new Promise((resolve) => debouncedFetchContacts(inputValue, resolve));
    };

    return (
        <SidebarLayout sidebarWidthPx={sidebarWidthPx}>
            <h1 className="page-title">Actualizar Caso</h1>
            <div className="case-creation-content">
                <div className="workflow-form-card card-body">
                    <form onSubmit={handleSubmit} className="p-3" style={{ width: "100%" }}>
                        <div className="mb-3">
                            <label>Nombre del Caso</label>
                            <input
                                type="text"
                                className="form-control"
                                value={caseName}
                                onChange={(e) => setCaseName(e.target.value)}
                                required
                            />
                        </div>

                        <div className="mb-3">
                            <label>Descripción del Caso</label>
                            <textarea
                                className="form-control"
                                value={caseDescription}
                                onChange={(e) => setCaseDescription(e.target.value)}
                                rows={3}
                            />
                        </div>

                        <div className="mb-3">
                            <label>Valor del Caso (RD$)</label>
                            <input
                                type="text"
                                className={`form-control ${parseFloat(caseValue.replace(/,/g, '')) < 0 ? 'is-invalid' : ''}`}
                                value={caseValue ? formatNumber(caseValue) : ''}
                                onChange={(e) => {
                                    // Solo permitir números y punto decimal
                                    const value = e.target.value.replace(/[^\d.]/g, '');
                                    setCaseValue(value);
                                }}
                            />
                            {parseFloat(caseValue.replace(/,/g, '')) < 0 && (
                                <div className="text-danger mt-1" style={{ fontSize: "0.9rem" }}>
                                    El valor no puede ser negativo.
                                </div>
                            )}
                        </div>

                        <div className="mb-3">
                            <label>Proceso</label>
                            <Select
                                options={processes.map(p => ({
                                    value: p.id_proceso,
                                    label: p.nombre_proceso
                                }))}
                                value={selectedProcessId ? {
                                    value: selectedProcessId,
                                    label: selectedProcess?.nombre_proceso || ""
                                } : null}
                                onChange={(opt) => {
                                    setSelectedProcessId((opt as ContactOption)?.value ?? null);
                                    setSelectedStageId(null);
                                }}
                                isClearable
                                components={{ Menu: AnimatedSelectMenu }}
                                menuPortalTarget={document.body}
                                styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                            />
                        </div>

                        {selectedProcess && (
                            <div className="mb-3">
                                <label>Etapa</label>
                                <Select
                                    options={selectedProcess.etapas.map(e => ({
                                        value: e.id_etapa,
                                        label: e.nombre_etapa
                                    }))}
                                    value={selectedStageId ? {
                                        value: selectedStageId,
                                        label: selectedProcess.etapas.find(e => e.id_etapa === selectedStageId)?.nombre_etapa || ""
                                    } : null}
                                    onChange={(opt) => setSelectedStageId((opt as ContactOption)?.value ?? null)}
                                    isClearable
                                    components={{ Menu: AnimatedSelectMenu }}
                                    menuPortalTarget={document.body}
                                    styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                />
                            </div>
                        )}

                        <div className="mb-3">
                            <label>Contacto</label>
                            <AsyncSelect
                                cacheOptions
                                defaultOptions
                                loadOptions={loadContactOptions}
                                value={selectedContact}
                                onChange={(opt) => setSelectedContact((opt as ContactOption) ?? null)}
                                placeholder="Buscar contacto..."
                                isClearable
                                components={{ Menu: AnimatedSelectMenu }}
                                menuPortalTarget={document.body}
                                styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                            />
                        </div>

                        <div className="mb-3">
                            <label>Fecha Estimada de Cierre</label>
                            <input
                                type="datetime-local"
                                className="form-control"
                                value={estimatedCloseDate}
                                onChange={(e) => setEstimatedCloseDate(formatDatetimeForInput(e.target.value))}
                            />
                        </div>

                        <div className="mb-3">
                            <label>Fecha Real de Cierre</label>
                            <input
                                type="datetime-local"
                                className="form-control"
                                value={closingDate}
                                onChange={(e) => setClosingDate(formatDatetimeForInput(e.target.value))}
                            />
                        </div>

                        <div className="form-check form-switch mb-3">
                            <input className="form-check-input" type="checkbox" id="openSwitch" checked={open} onChange={() => setOpen(prev => !prev)} />
                            <label className="form-check-label" htmlFor="openSwitch">Caso Abierto</label>
                        </div>

                        <div className="form-check form-switch mb-3">
                            <input className="form-check-input" type="checkbox" id="successSwitch" checked={successful} onChange={() => setSuccessful(prev => !prev)} />
                            <label className="form-check-label" htmlFor="successSwitch">Caso Exitoso</label>
                        </div>

                        <button type="submit" className="btn btn-primary w-100">
                            {loading ? <Spinner /> : "Actualizar Caso"}
                        </button>
                    </form>
                </div>
            </div>
        </SidebarLayout>
    );
}
