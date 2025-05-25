import Select from "react-select";
import { toast } from "react-toastify";
import debounce from "lodash.debounce";
import { useState, useEffect } from "react";
import AsyncSelect from "react-select/async";
import { useNavigate, useParams } from "react-router-dom";
import { Contact } from "../../../types/contactTypes";
import { AnimatePresence, motion } from "framer-motion";
import { Spinner } from "../../../components/ui/Spinner";
import { useAuthStore } from "../../../stores/authStore";
import "../../../styles/workflows/workflowFormStyles.css";
import { useSidebarStore } from "../../../stores/sidebarStore";
import { createCase } from "../../../controllers/caseControllers";
import { Proceso, EtapaProceso } from "../../../types/workflowTypes";
import { fetchContacts } from "../../../controllers/contactControllers";
import { SidebarLayout } from "../../../components/layouts/SidebarLayout";
import { fetchProcesses } from "../../../controllers/workflowControllers";
import { AnimatedSelectMenu } from "../../../components/ui/forms/AnimatedSelectMenu";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

type ContactOption = { label: string; value: number };

export function CreateCase() {
    const sidebarWidthPx = useSidebarStore((state) => state.sidebarWidthPx);
    const navigate = useNavigate();
    const authStore = useAuthStore();
    const [loading, setLoading] = useState(false);
    const userId = authStore.userId;

    // Get the workflow id from the route params
    const { workflowId } = useParams<{ workflowId: string }>();

    // Form state
    const [caseName, setCaseName] = useState("");
    const [caseDescription, setCaseDescription] = useState("");
    const [caseValue, setCaseValue] = useState("");
    const [estimatedCloseDate, setEstimatedCloseDate] = useState<Date | null>(null);
    const [closingDate, setClosingDate] = useState<Date | null>(null);
    const [open, setOpen] = useState(true);
    const [successful, setSuccessful] = useState(false);

    // Dropdowns
    const [processes, setProcesses] = useState<Proceso[]>([]);
    const [selectedProcessId, setSelectedProcessId] = useState<number | null>(null);
    const [selectedStageId, setSelectedStageId] = useState<number | null>(null);
    const [selectedContactId, setSelectedContactId] = useState<number | null>(null);

    // Load processes and contacts on mount
    useEffect(() => {
        fetchProcesses().then(setProcesses).catch(() => toast.error("Error al cargar los procesos."));

        // If we have a workflow ID, set it as the selected process initially
        if (workflowId) {
            setSelectedProcessId(parseInt(workflowId));
        }
    }, [workflowId]);

    const selectedProcess = processes.find(p => p.id_proceso === selectedProcessId);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!caseName || !selectedProcessId || !selectedStageId || !selectedContactId) {
            toast.error("Por favor completa todos los campos obligatorios.");
            return;
        }

        if (parseFloat(caseValue) < 0) {
            toast.error("El valor del caso no puede ser negativo.");
            return;
        }

        const caseData = {
            case_name: caseName,
            case_description: caseDescription,
            case_value: caseValue,
            case_estimated_close_date: estimatedCloseDate?.toISOString(),
            closing_date: closingDate?.toISOString(),
            open,
            successful,
            process_id: selectedProcessId,
            stage_id: selectedStageId,
            contact_id: selectedContactId,
            creator_id: userId,
        };

        setLoading(true);
        try {
            await createCase(caseData);
            toast.success("Caso creado exitosamente.");
            
            // Redirect to the process board
            navigate(`/workflows/board-view/${selectedProcessId}`);
        } catch {
            toast.error("Error al crear el caso.");
        } finally {
            setLoading(false);
        }
    };

    const debouncedFetchContacts = debounce(
        async (
            inputValue: string,
            callback: (options: ContactOption[]) => void
        ) => {
            if (!inputValue.trim()) {
                callback([]);
                return;
            }

            try {
                const contacts = await fetchContacts(inputValue);
                const options = contacts.slice(0, 10).map((contact: Contact) => ({
                    label: `${contact.nombres} ${contact.apellidos}`,
                    value: contact.contact_id,
                }));
                callback(options);
            } catch (err) {
                console.error("Error loading contacts", err);
                callback([]);
            }
        },
        500
    );

    const loadContactOptions = (inputValue: string): Promise<ContactOption[]> => {
        return new Promise((resolve) => {
            debouncedFetchContacts(inputValue, resolve);
        });
    };

    return (
        <SidebarLayout sidebarWidthPx={sidebarWidthPx}>
            <h1 className="page-title">Crear Nuevo Caso</h1>
            <div className="case-creation-content">
                <div className="workflow-form-card card-body">
                    <form onSubmit={handleSubmit} className="p-3" style={{ width: '100%' }}>
                        {/* Case Name */}
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

                        {/* Description */}
                        <div className="mb-3">
                            <label>Descripción del Caso</label>
                            <textarea
                                className="form-control"
                                value={caseDescription}
                                onChange={(e) => setCaseDescription(e.target.value)}
                                rows={3}
                            />
                        </div>

                        {/* Case Value */}
                        <div className="mb-3">
                            <label>Valor del Caso (RD$) </label>
                            <input
                                type="number"
                                className={`form-control ${parseFloat(caseValue) < 0 ? 'is-invalid' : ''}`}
                                value={caseValue}
                                onChange={(e) => setCaseValue(e.target.value)}
                            />
                            {parseFloat(caseValue) < 0 && (
                                <div className="text-danger mt-1" style={{ fontSize: "0.9rem" }}>
                                    El valor no puede ser negativo.
                                </div>
                            )}
                        </div>

                        {/* Process Dropdown */}
                        <div className="mb-3">
                            <label>Proceso</label>
                            <Select<{ value: number; label: string }, false>
                                className="mb-3"
                                options={processes.map((proc) => ({
                                    value: proc.id_proceso,
                                    label: proc.nombre_proceso,
                                }))}
                                value={
                                    selectedProcessId !== null
                                        ? {
                                            value: selectedProcessId,
                                            label: processes.find(p => p.id_proceso === selectedProcessId)?.nombre_proceso || "",
                                        }
                                        : null
                                }
                                onChange={(option) => {
                                    setSelectedProcessId(option?.value ?? null);
                                    setSelectedStageId(null);
                                }}
                                placeholder="Selecciona un proceso"
                                isClearable
                                components={{
                                    Menu: AnimatedSelectMenu,
                                }}
                                menuPortalTarget={document.body}
                                styles={{
                                    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                }}
                            />
                        </div>

                        {/* Stage Dropdown */}
                        <AnimatePresence>
                            {selectedProcess && (
                                <motion.div
                                    className="mb-3"
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <label>Etapa Inicial</label>
                                    <Select<{ value: number; label: string }, false>
                                        className="mb-3"
                                        options={selectedProcess.etapas.map((etapa: EtapaProceso) => ({
                                            value: etapa.id_etapa,
                                            label: etapa.nombre_etapa,
                                        }))}
                                        value={
                                            selectedStageId !== null
                                                ? {
                                                    value: selectedStageId,
                                                    label:
                                                        selectedProcess.etapas.find(e => e.id_etapa === selectedStageId)?.nombre_etapa || "",
                                                }
                                                : null
                                        }
                                        onChange={(option) => setSelectedStageId(option?.value ?? null)}
                                        placeholder="Selecciona una etapa"
                                        isClearable
                                        components={{
                                            Menu: AnimatedSelectMenu,
                                        }}
                                        menuPortalTarget={document.body}
                                        styles={{
                                            menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                        }}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Contact Dropdown */}
                        <div className="mb-3">
                            <label>Contacto</label>
                            <AsyncSelect<ContactOption, false>
                                cacheOptions
                                loadOptions={loadContactOptions}
                                defaultOptions={false}
                                onChange={(option) => setSelectedContactId(option?.value ?? null)}
                                placeholder="Busca un contacto (por cédula, nombre o email)"
                                isClearable
                                components={{
                                    Menu: AnimatedSelectMenu,
                                }}
                                menuPortalTarget={document.body}
                                styles={{
                                    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                }}
                            />
                        </div>

                        {/* Estimated Closing Date */}
                        <div className="mb-3">
                            <label>Fecha Estimada de Cierre </label>
                            <DatePicker
                                selected={estimatedCloseDate}
                                onChange={(date: Date | null) => setEstimatedCloseDate(date)}
                                showTimeSelect
                                timeFormat="HH:mm"
                                timeIntervals={15}
                                dateFormat="MMMM d, yyyy h:mm aa"
                                className="form-control"
                                placeholderText="Selecciona fecha y hora"
                                timeCaption="Hora"
                            />
                        </div>

                        {/* Actual Closing Date */}
                        <div className="mb-3">
                            <label>Fecha Real de Cierre</label>
                            <DatePicker
                                selected={closingDate}
                                onChange={(date: Date | null) => setClosingDate(date)}
                                showTimeSelect
                                timeFormat="HH:mm"
                                timeIntervals={15}
                                dateFormat="MMMM d, yyyy h:mm aa"
                                className="form-control"
                                placeholderText="Selecciona fecha y hora"
                                timeCaption="Hora"
                            />
                        </div>

                        {/* Boolean Toggles */}
                        <div className="mb-3 form-check form-switch">
                            <input
                                type="checkbox"
                                className="form-check-input"
                                id="openSwitch"
                                checked={open}
                                onChange={(e) => setOpen(e.target.checked)}
                            />
                            <label className="form-check-label" htmlFor="openSwitch">Caso Abierto</label>
                        </div>

                        <div className="mb-3 form-check form-switch">
                            <input
                                type="checkbox"
                                className="form-check-input"
                                id="successSwitch"
                                checked={successful}
                                onChange={(e) => setSuccessful(e.target.checked)}
                            />
                            <label className="form-check-label" htmlFor="successSwitch">Caso Exitoso</label>
                        </div>

                        <button type="submit" className="btn btn-primary w-100">
                            {loading ? <Spinner /> : "Crear Caso"}
                        </button>
                    </form>
                </div>
            </div>
        </SidebarLayout>
    );
}
