import Select from "react-select";
import { toast } from "react-toastify";
import debounce from "lodash.debounce";
import { useState, useEffect } from "react";
import AsyncSelect from "react-select/async";
import { useNavigate, useParams } from "react-router-dom";
import { Contact } from "../../../types/contactTypes";
import { Branch } from "../../../types/branchTypes";
import { AnimatePresence, motion } from "framer-motion";
import { Spinner } from "../../../components/ui/Spinner";
import { useAuthStore } from "../../../stores/authStore";
import "../../../styles/workflows/workflowFormStyles.css";
import { useSidebarStore } from "../../../stores/sidebarStore";
import { createCase } from "../../../controllers/caseControllers";
import { Proceso, EtapaProceso } from "../../../types/workflowTypes";
import { fetchContacts } from "../../../controllers/contactControllers";
import { fetchBranches } from "../../../controllers/branchControllers";
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
    const [branches, setBranches] = useState<Branch[]>([]);
    const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);

    // Load processes and contacts on mount
    useEffect(() => {
        fetchProcesses().then(setProcesses).catch(() => toast.error("Error al cargar los procesos."));

        // If we have a workflow ID, set it as the selected process initially
        if (workflowId) {
            setSelectedProcessId(parseInt(workflowId));
        }
    }, [workflowId]);

    // Load branches on mount
    useEffect(() => {
        const accessToken = authStore.accessToken;
        if (!accessToken || branches.length > 0) return;

        const loadBranches = async () => {
            try {
                const branchesData = await fetchBranches(100, 0); // Fetch up to 100 branches
                setBranches(branchesData.results);
            } catch {
                toast.error("No se pudieron obtener las sucursales.");
            }
        };
        loadBranches();
    }, [authStore.accessToken, branches]);

    const selectedProcess = processes.find(p => p.id_proceso === selectedProcessId);
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!caseName || !selectedProcessId || !selectedStageId || !selectedContactId) {
            toast.error("Por favor completa todos los campos obligatorios.");
            return;
        }

        if (parseFloat(caseValue.replace(/,/g, '')) < 0) {
            toast.error("El valor del caso no puede ser negativo.");
            return;
        }

        const caseData: Record<string, unknown> = {
            case_name: caseName,
            case_description: caseDescription,
            case_value: caseValue.replace(/,/g, ''),
            case_estimated_close_date: estimatedCloseDate?.toISOString(),
            closing_date: closingDate?.toISOString(),
            open,
            successful,
            process_id: selectedProcessId,
            stage_id: selectedStageId,
            contact_id: selectedContactId,
            creator_id: userId,
        };
        
        // Add sucursal_id if a branch is selected
        if (selectedBranch) {
            caseData.sucursal_id = selectedBranch.id;
        }

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

    const formatNumber = (num: string) => {
        // Remove any existing commas first
        const value = num.replace(/,/g, '');
        // Format with commas
        return value.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    };

    return (
        <SidebarLayout sidebarWidthPx={sidebarWidthPx}>
            <h1 className="page-title">Crear Nuevo Caso</h1>
            <div className="case-creation-content">
                <div className="workflow-form-card card-body" style={{ maxWidth: '900px', margin: '0 auto' }}>
                    <form onSubmit={handleSubmit} className="p-4" style={{ width: '100%' }}>
                        {/* BASIC INFORMATION SECTION */}
                        <div style={{ marginBottom: '40px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', paddingBottom: '15px', borderBottom: '2px solid #f0f0f0' }}>
                                <i className="bi bi-file-text" style={{ fontSize: '24px', color: '#0d6efd', marginRight: '10px' }}></i>
                                <h5 style={{ margin: 0, fontWeight: 600, color: '#212529' }}>Información Básica</h5>
                            </div>

                            <div className="mb-3">
                                <label style={{ fontWeight: 600, marginBottom: '8px', display: 'block' }}>Nombre del Caso <span style={{ color: '#dc3545' }}>*</span></label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={caseName}
                                    onChange={(e) => setCaseName(e.target.value)}
                                    required
                                    style={{ borderRadius: '8px', border: '1px solid #dee2e6', padding: '10px 12px' }}
                                    placeholder="Ingresa el nombre del caso"
                                />
                            </div>

                            <div className="mb-3">
                                <label style={{ fontWeight: 600, marginBottom: '8px', display: 'block' }}>Descripción del Caso</label>
                                <textarea
                                    className="form-control"
                                    value={caseDescription}
                                    onChange={(e) => setCaseDescription(e.target.value)}
                                    rows={3}
                                    style={{ borderRadius: '8px', border: '1px solid #dee2e6', padding: '10px 12px' }}
                                    placeholder="Describe el caso en detalle"
                                />
                            </div>

                            <div className="mb-3">
                                <label style={{ fontWeight: 600, marginBottom: '8px', display: 'block' }}>Valor inicial del Caso (RD$)</label>
                                <input
                                    type="text"
                                    className={`form-control ${parseFloat(caseValue.replace(/,/g, '')) < 0 ? 'is-invalid' : ''}`}
                                    value={caseValue ? formatNumber(caseValue) : ''}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/[^\d.]/g, '');
                                        setCaseValue(value);
                                    }}
                                    style={{ borderRadius: '8px', border: '1px solid #dee2e6', padding: '10px 12px' }}
                                    placeholder="0.00"
                                />
                                {parseFloat(caseValue.replace(/,/g, '')) < 0 && (
                                    <div className="text-danger mt-1" style={{ fontSize: "0.9rem" }}>
                                        El valor no puede ser negativo.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* WORKFLOW SECTION */}
                        <div style={{ marginBottom: '40px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', paddingBottom: '15px', borderBottom: '2px solid #f0f0f0' }}>
                                <i className="bi bi-kanban" style={{ fontSize: '24px', color: '#0d6efd', marginRight: '10px' }}></i>
                                <h5 style={{ margin: 0, fontWeight: 600, color: '#212529' }}>Flujo de Trabajo</h5>
                            </div>

                            <div className="mb-3">
                                <label style={{ fontWeight: 600, marginBottom: '8px', display: 'block' }}>Proceso <span style={{ color: '#dc3545' }}>*</span></label>
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
                                        control: (base) => ({ ...base, borderRadius: '8px', border: '1px solid #dee2e6' }),
                                    }}
                                />
                            </div>

                            <AnimatePresence>
                                {selectedProcess && (
                                    <motion.div
                                        className="mb-3"
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <label style={{ fontWeight: 600, marginBottom: '8px', display: 'block' }}>Etapa Inicial <span style={{ color: '#dc3545' }}>*</span></label>
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
                                                control: (base) => ({ ...base, borderRadius: '8px', border: '1px solid #dee2e6' }),
                                            }}
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* CONTACT & BRANCH SECTION */}
                        <div style={{ marginBottom: '40px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', paddingBottom: '15px', borderBottom: '2px solid #f0f0f0' }}>
                                <i className="bi bi-person-lines-fill" style={{ fontSize: '24px', color: '#0d6efd', marginRight: '10px' }}></i>
                                <h5 style={{ margin: 0, fontWeight: 600, color: '#212529' }}>Contacto y Sucursal</h5>
                            </div>

                            <div className="mb-3">
                                <label style={{ fontWeight: 600, marginBottom: '8px', display: 'block' }}>Contacto (Principal Solicitante) <span style={{ color: '#dc3545' }}>*</span></label>
                                <AsyncSelect<ContactOption, false>
                                    cacheOptions
                                    loadOptions={loadContactOptions}
                                    defaultOptions={false}
                                    onChange={(option) => setSelectedContactId(option?.value ?? null)}
                                    placeholder="Busca por cédula, nombre o email"
                                    isClearable
                                    components={{
                                        Menu: AnimatedSelectMenu,
                                    }}
                                    menuPortalTarget={document.body}
                                    styles={{
                                        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                        control: (base) => ({ ...base, borderRadius: '8px', border: '1px solid #dee2e6' }),
                                    }}
                                />
                            </div>

                            <div className="mb-3">
                                <label style={{ fontWeight: 600, marginBottom: '8px', display: 'block' }}>Sucursal <span style={{ color: '#6c757d', fontSize: '0.85rem' }}>(Opcional)</span></label>
                                <Select<Branch, false>
                                    isClearable
                                    options={branches}
                                    value={selectedBranch}
                                    onChange={(option) => setSelectedBranch(option as Branch | null)}
                                    getOptionLabel={(option: Branch) => option.nombre_sucursal}
                                    getOptionValue={(option: Branch) => String(option.id)}
                                    placeholder="Selecciona una sucursal"
                                    components={{
                                        Menu: AnimatedSelectMenu,
                                    }}
                                    menuPortalTarget={document.body}
                                    styles={{
                                        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                        control: (base) => ({ ...base, borderRadius: '8px', border: '1px solid #dee2e6' }),
                                    }}
                                />
                            </div>
                        </div>

                        {/* DATES SECTION */}
                        <div style={{ marginBottom: '40px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', paddingBottom: '15px', borderBottom: '2px solid #f0f0f0' }}>
                                <i className="bi bi-calendar-event" style={{ fontSize: '24px', color: '#0d6efd', marginRight: '10px' }}></i>
                                <h5 style={{ margin: 0, fontWeight: 600, color: '#212529' }}>Fechas</h5>
                            </div>

                            <div className="mb-3">
                                <label style={{ fontWeight: 600, marginBottom: '8px', display: 'block' }}>Fecha Estimada de Cierre</label>
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

                            <div className="mb-3">
                                <label style={{ fontWeight: 600, marginBottom: '8px', display: 'block' }}>Fecha Real de Cierre</label>
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
                        </div>

                        {/* STATUS SECTION */}
                        <div style={{ marginBottom: '30px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', paddingBottom: '15px', borderBottom: '2px solid #f0f0f0' }}>
                                <i className="bi bi-toggle-on" style={{ fontSize: '24px', color: '#0d6efd', marginRight: '10px' }}></i>
                                <h5 style={{ margin: 0, fontWeight: 600, color: '#212529' }}>Estado</h5>
                            </div>

                            <div style={{ display: 'flex', gap: '30px' }}>
                                <div className="form-check form-switch">
                                    <input
                                        type="checkbox"
                                        className="form-check-input"
                                        id="openSwitch"
                                        checked={open}
                                        onChange={(e) => setOpen(e.target.checked)}
                                        style={{ width: '3em', height: '1.5em', cursor: 'pointer' }}
                                    />
                                    <label className="form-check-label" htmlFor="openSwitch" style={{ cursor: 'pointer', fontWeight: 500, marginLeft: '5px' }}>
                                        Caso Abierto
                                    </label>
                                </div>

                                <div className="form-check form-switch">
                                    <input
                                        type="checkbox"
                                        className="form-check-input"
                                        id="successSwitch"
                                        checked={successful}
                                        onChange={(e) => setSuccessful(e.target.checked)}
                                        style={{ width: '3em', height: '1.5em', cursor: 'pointer' }}
                                    />
                                    <label className="form-check-label" htmlFor="successSwitch" style={{ cursor: 'pointer', fontWeight: 500, marginLeft: '5px' }}>
                                        Caso Exitoso
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* SUBMIT BUTTON */}
                        <button 
                            type="submit" 
                            className="btn btn-primary w-100"
                            style={{
                                borderRadius: '8px',
                                padding: '12px 24px',
                                fontWeight: 600,
                                fontSize: '1rem',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 2px 8px rgba(13, 110, 253, 0.15)'
                            }}
                            onMouseEnter={(e) => {
                                (e.target as HTMLElement).style.boxShadow = '0 4px 16px rgba(13, 110, 253, 0.3)';
                                (e.target as HTMLElement).style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={(e) => {
                                (e.target as HTMLElement).style.boxShadow = '0 2px 8px rgba(13, 110, 253, 0.15)';
                                (e.target as HTMLElement).style.transform = 'translateY(0)';
                            }}
                        >
                            {loading ? <Spinner /> : "Crear Caso"}
                        </button>
                    </form>
                </div>
            </div>
        </SidebarLayout>
    );
}
