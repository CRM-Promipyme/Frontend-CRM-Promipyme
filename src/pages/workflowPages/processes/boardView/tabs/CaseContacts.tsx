import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import debounce from "lodash.debounce";
import AsyncSelect from "react-select/async";
import { fetchCaseContacts, addContactToCase, removeContactFromCase } from "../../../../../controllers/caseControllers";
import { fetchContacts } from "../../../../../controllers/contactControllers";
import { CaseContact } from "../../../../../types/workflowTypes";
import { Contact } from "../../../../../types/contactTypes";
import { AnimatedSelectMenu } from "../../../../../components/ui/forms/AnimatedSelectMenu";
import "./caseContacts.css";

type ContactOption = { label: string; value: number };

interface CaseContactsProps {
    caseId: number;
    mainContactId: number;
}

export function CaseContacts({ caseId, mainContactId }: CaseContactsProps) {
    const [caseContacts, setCaseContacts] = useState<CaseContact[]>([]);
    const [loading, setLoading] = useState(false);
    const [showAddContactModal, setShowAddContactModal] = useState(false);
    const [selectedContact, setSelectedContact] = useState<ContactOption | null>(null);
    const [selectedRole, setSelectedRole] = useState<string>("");
    const [removing, setRemoving] = useState<number | null>(null);
    const [isAddingContact, setIsAddingContact] = useState(false);
    const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
    const [contactToDelete, setContactToDelete] = useState<CaseContact | null>(null);

    const roleOptions = [
        "Garante",
        "Avalista",
        "Co-deudor",
        "Referencia",
        "Testigo",
        "Beneficiario",
        "Otro"
    ];

    // Fetch case contacts on component mount
    useEffect(() => {
        fetchContactsData();
    }, [caseId]);



    const fetchContactsData = async () => {
        setLoading(true);
        try {
            const data = await fetchCaseContacts(caseId);
            if (data && data.contacts) {
                setCaseContacts(data.contacts);
            }
        } catch (error) {
            console.error("Error fetching case contacts:", error);
            toast.error("Error al cargar los contactos del caso");
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
                // Filter out:
                // 1. Contacts already added to this case
                // 2. The main contact of the case
                const existingContactIds = caseContacts.map(cc => cc.contacto);
                const filtered = contacts
                    .filter((contact: Contact) => {
                        const isAlreadyAdded = existingContactIds.includes(contact.contact_id);
                        const isMainContact = contact.contact_id === mainContactId;
                        return !isAlreadyAdded && !isMainContact;
                    })
                    .slice(0, 10)
                    .map((contact: Contact) => ({
                        label: `${contact.nombres} ${contact.apellidos}`,
                        value: contact.contact_id,
                    }));
                callback(filtered);
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

    const handleAddContact = async () => {
        if (!selectedContact || !selectedRole.trim()) {
            toast.warning("Por favor selecciona un contacto y un rol");
            return;
        }

        setIsAddingContact(true);
        try {
            await addContactToCase(caseId, {
                contacto: selectedContact.value,
                rol_contacto: selectedRole
            });

            toast.success("Contacto agregado al caso correctamente");
            setSelectedContact(null);
            setSelectedRole("");
            setShowAddContactModal(false);
            
            // Refresh the contacts list
            await fetchContactsData();
        } catch (error) {
            console.error("Error adding contact to case:", error);
            toast.error("Error al agregar el contacto al caso");
        } finally {
            setIsAddingContact(false);
        }
    };

    const handleRemoveContact = async (caseContact: CaseContact) => {
        setContactToDelete(caseContact);
        setShowDeleteConfirmModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!contactToDelete) return;

        setRemoving(contactToDelete.id_contacto_caso);
        try {
            await removeContactFromCase(caseId, contactToDelete.id_contacto_caso);
            toast.success("Contacto eliminado del caso correctamente");
            
            // Refresh the contacts list
            await fetchContactsData();
            setShowDeleteConfirmModal(false);
            setContactToDelete(null);
        } catch (error) {
            console.error("Error removing contact from case:", error);
            toast.error("Error al eliminar el contacto del caso");
        } finally {
            setRemoving(null);
        }
    };



    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="case-contacts-section"
        >
            <div className="case-contacts-header">
                <h4 className="h4-header">
                    <i className="bi bi-people me-2"></i>Contactos Adicionales
                </h4>
                <button
                    className="btn btn-sm btn-primary"
                    onClick={() => setShowAddContactModal(true)}
                >
                    <i className="bi bi-plus-circle me-1"></i>Agregar Contacto
                </button>
            </div>

            {loading ? (
                <div className="text-center py-3">
                    <div className="spinner-border spinner-border-sm" role="status">
                        <span className="visually-hidden">Cargando...</span>
                    </div>
                </div>
            ) : caseContacts.length === 0 ? (
                <div className="case-contacts-empty">
                    <p className="text-muted mb-0">No hay contactos adicionales agregados a este caso</p>
                </div>
            ) : (
                <div className="case-contacts-list">
                    <AnimatePresence>
                        {caseContacts.map((caseContact) => (
                            <motion.div
                                key={caseContact.id_contacto_caso}
                                className="case-contact-item"
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                            >
                                <div className="case-contact-info">
                                    <div className="case-contact-name">
                                        <h5>{caseContact.contacto_detail.nombres} {caseContact.contacto_detail.apellidos}</h5>
                                        <span className="case-contact-role badge bg-info">
                                            {caseContact.rol_contacto}
                                        </span>
                                    </div>
                                    <div className="case-contact-details">
                                        <p className="mb-1">
                                            <i className="bi bi-envelope me-2"></i>
                                            {caseContact.contacto_detail.email}
                                        </p>
                                        <p className="mb-0">
                                            <i className="bi bi-person-badge me-2"></i>
                                            {caseContact.contacto_detail.cedula}
                                        </p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <Link to={`/contacts/details/${caseContact.contacto}`} style={{ textDecoration: 'none' }}>
                                        <button
                                            className="btn btn-sm btn-info"
                                            title="Ver detalles del contacto"
                                        >
                                            <i className="bi bi-eye"></i>
                                        </button>
                                    </Link>
                                    <button
                                        className="btn btn-sm btn-danger btn-remove-contact"
                                        onClick={() => handleRemoveContact(caseContact)}
                                        disabled={removing === caseContact.id_contacto_caso}
                                        title="Eliminar contacto del caso"
                                    >
                                        {removing === caseContact.id_contacto_caso ? (
                                            <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                        ) : (
                                            <i className="bi bi-trash"></i>
                                        )}
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Add Contact Modal */}
            <AnimatePresence>
                {showAddContactModal && (
                    <motion.div
                        className="case-contacts-modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowAddContactModal(false)}
                    >
                        <motion.div
                            className="case-contacts-modal"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="case-contacts-modal-header">
                                <h5>Agregar Contacto al Caso</h5>
                                <button
                                    className="btn-close"
                                    onClick={() => setShowAddContactModal(false)}
                                    aria-label="Close"
                                ></button>
                            </div>

                            <div className="case-contacts-modal-body">
                                <div className="form-group mb-3">
                                    <label className="form-label">Selecciona un Contacto <span style={{ color: '#dc3545' }}>*</span></label>
                                    <AsyncSelect<ContactOption, false>
                                        cacheOptions
                                        loadOptions={loadContactOptions}
                                        defaultOptions={false}
                                        onChange={(option) => setSelectedContact(option)}
                                        placeholder="Busca por cédula, nombre o email"
                                        isClearable
                                        components={{
                                            Menu: AnimatedSelectMenu,
                                        }}
                                        menuPortalTarget={document.body}
                                        styles={{
                                            menuPortal: (base) => ({ ...base, zIndex: 10000 }),
                                            control: (base) => ({ ...base, borderRadius: '8px', border: '1px solid #dee2e6' }),
                                        }}
                                    />
                                </div>

                                <div className="form-group mb-3">
                                    <label className="form-label">Rol del Contacto <span style={{ color: '#dc3545' }}>*</span></label>
                                    <select
                                        className="form-select"
                                        value={selectedRole}
                                        onChange={(e) => setSelectedRole(e.target.value)}
                                        disabled={!selectedContact}
                                        style={{ borderRadius: '8px', border: '1px solid #dee2e6' }}
                                    >
                                        <option value="">Selecciona un rol...</option>
                                        {roleOptions.map((role) => (
                                            <option key={role} value={role}>
                                                {role}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="case-contacts-modal-footer">
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => setShowAddContactModal(false)}
                                    disabled={isAddingContact}
                                >
                                    Cancelar
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleAddContact}
                                    disabled={!selectedContact || !selectedRole || isAddingContact}
                                >
                                    {isAddingContact ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                            Agregando...
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-plus-circle me-1"></i>Agregar
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {showDeleteConfirmModal && contactToDelete && (
                    <motion.div
                        className="case-contacts-modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => {
                            setShowDeleteConfirmModal(false);
                            setContactToDelete(null);
                        }}
                    >
                        <motion.div
                            className="case-contacts-modal"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            style={{ maxWidth: '450px' }}
                        >
                            <div className="case-contacts-modal-header">
                                <h5>Eliminar Contacto</h5>
                                <button
                                    className="btn-close"
                                    onClick={() => {
                                        setShowDeleteConfirmModal(false);
                                        setContactToDelete(null);
                                    }}
                                    aria-label="Close"
                                ></button>
                            </div>

                            <div className="case-contacts-modal-body" style={{ textAlign: 'center' }}>
                                <div style={{ marginBottom: '20px' }}>
                                    <i className="bi bi-exclamation-triangle" style={{ fontSize: '48px', color: '#dc3545', marginBottom: '15px', display: 'block' }}></i>
                                    <p style={{ marginBottom: '10px', fontWeight: 600, color: '#333' }}>
                                        ¿Está seguro de eliminar este contacto?
                                    </p>
                                    <p style={{ marginBottom: '15px', color: '#666', fontSize: '0.95rem' }}>
                                        Se eliminará <strong>{contactToDelete.contacto_detail.nombres} {contactToDelete.contacto_detail.apellidos}</strong> de los contactos adicionales del caso.
                                    </p>
                                    <p style={{ marginBottom: 0, color: '#999', fontSize: '0.85rem' }}>
                                        Esta acción no se puede deshacer.
                                    </p>
                                </div>
                            </div>

                            <div className="case-contacts-modal-footer">
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        setShowDeleteConfirmModal(false);
                                        setContactToDelete(null);
                                    }}
                                    disabled={removing !== null}
                                >
                                    Cancelar
                                </button>
                                <button
                                    className="btn btn-danger"
                                    onClick={handleConfirmDelete}
                                    disabled={removing !== null}
                                >
                                    {removing !== null ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                            Eliminando...
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-trash me-1"></i>Eliminar
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
