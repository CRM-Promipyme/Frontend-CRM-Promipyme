import { format } from "date-fns";
import Select from "react-select";
import { es } from "date-fns/locale";
import { toast } from "react-toastify";
import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import "../../styles/auth/profileViewStyles.css";
import "../../styles/auth/contactDetailStyles.css";
import { useAuthStore } from "../../stores/authStore";
import { Spinner } from "../../components/ui/Spinner";
import { motion, AnimatePresence } from "framer-motion";
import { useSidebarStore } from "../../stores/sidebarStore";
import { formatNumber, daysLeft } from "../../utils/formatUtils";
import { SidebarLayout } from "../../components/layouts/SidebarLayout";
import {
    Ciudad,
    Provincia,
    TipoTelefono,
    TelefonosContacto,
    DireccionesContacto,
} from "../../types/contactTypes";
import { Caso } from "../../types/workflowTypes";
import { Activity } from "../../types/activityTypes";
import { formatCedula } from "../../utils/formatUtils";
import { ActivityLog } from "../../components/ui/ActivityLog";
import { fetchContactCases } from "../../controllers/caseControllers";
import { fetchEntityActivities } from "../../controllers/activityControllers";
import { useContactData, useDropdownOptions } from "../../hooks/userControllerHooks";

export function ContactDetail() {
    // Global States
    const sidebarWidthPx = useSidebarStore((state) => state.sidebarWidthPx);
    const authStore = useAuthStore();
    const accessToken = authStore.accessToken;

    // Get the contact ID from the route params
    const { contact_id } = useParams<{ contact_id: string }>();

    // Local states/hooks
    const { contactData, formData, setFormData, loading } = useContactData(
        contact_id,
        accessToken
    );
    const dropdownOptions = useDropdownOptions(accessToken);
    const [editMode, setEditMode] = useState<boolean>(false);
    const canEdit = authStore.isAdmin(); // Only admin users can edit
    const [activities, setActivities] = useState<Activity[]>([]);
    const [activeTab, setActiveTab] = useState<string>("basic-info");
    const [relatedCases, setRelatedCases] = useState<Caso[]>([]);

    // Fetch contact activities and cases on component mount
    useEffect(() => {
        const fetchCases = async () => {
            try {
                const fetchedCases = await fetchContactCases(parseInt(contact_id as string));
                const cases = fetchedCases.results as Caso[];
                setRelatedCases(cases);
            } catch (error) {
                console.error("Error fetching contact cases:", error);
            }
        }

        fetchCases();
    }, [contact_id]);

    // Handle input changes for basic info
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        if (formData) {
            setFormData({
                ...formData,
                [id]: value,
            });
        }
    };

    // Handle phone number changes (for the number itself)
    const handlePhoneChange = (
        index: number,
        field: keyof TelefonosContacto,
        value: string
    ) => {
        if (formData) {
            setFormData({
                ...formData,
                telefonos: formData.telefonos.map((phone, i) =>
                    i === index ? { ...phone, [field]: value } : phone
                ),
            });
        }
    };

    // Handle address changes (for calle and descripción)
    const handleAddressChange = (
        index: number,
        field: keyof DireccionesContacto,
        value: string
    ) => {
        if (formData) {
            setFormData({
                ...formData,
                direcciones: formData.direcciones.map((address, i) =>
                    i === index ? { ...address, [field]: value } : address
                ),
            });
        }
    };

    // Handle province selection change for addresses
    const handleProvinceSelect = (index: number, selectedItem: Provincia) => {
        if (formData) {
            const updatedAddresses = [...formData.direcciones];
            updatedAddresses[index] = {
                ...updatedAddresses[index],
                provincia: selectedItem.descripcion,
                id_provincia: selectedItem.id,
                // reset city when province changes
                ciudad: "",
                id_ciudad: 0,
            };
            setFormData({
                ...formData,
                direcciones: updatedAddresses,
            });
        }
    };

    // Handle city selection change for addresses
    const handleCitySelect = (index: number, selectedItem: Ciudad) => {
        if (formData) {
            const updatedAddresses = [...formData.direcciones];
            updatedAddresses[index] = {
                ...updatedAddresses[index],
                ciudad: selectedItem.descripcion,
                id_ciudad: selectedItem.id,
            };
            setFormData({
                ...formData,
                direcciones: updatedAddresses,
            });
        }
    };

    // Handle phone type selection change
    const handlePhoneTypeSelect = (index: number, selectedItem: TipoTelefono) => {
        if (formData) {
            const updatedPhones = [...formData.telefonos];
            updatedPhones[index] = {
                ...updatedPhones[index],
                tipo_telefono: selectedItem.tipo_telefono,
                id_tipo_telefono: selectedItem.id_tipo_telefono,
            };
            setFormData({
                ...formData,
                telefonos: updatedPhones,
            });
        }
    };

    // Functions to add or remove phone numbers
    const addPhone = () => {
        if (formData) {
            setFormData({
                ...formData,
                telefonos: [
                    ...formData.telefonos,
                    { numero_telefonico: "", tipo_telefono: "", id_tipo_telefono: 0 },
                ],
            });
        }
    };

    const removePhone = (index: number) => {
        if (formData) {
            setFormData({
                ...formData,
                telefonos: formData.telefonos.filter((_, i) => i !== index),
            });
        }
    };

    // Functions to add or remove addresses
    const addAddress = () => {
        if (formData) {
            setFormData({
                ...formData,
                direcciones: [
                    ...formData.direcciones,
                    {
                        calle_direccion: "",
                        descripcion_vivienda: "",
                        ciudad: "",
                        id_ciudad: 0,
                        provincia: "",
                        id_provincia: 0,
                    },
                ],
            });
        }
    };

    const removeAddress = (index: number) => {
        if (formData) {
            setFormData({
                ...formData,
                direcciones: formData.direcciones.filter((_, i) => i !== index),
            });
        }
    };

    const toggleEditMode = () => {
        setEditMode((prev) => !prev);

        // If we're exiting edit mode, reset the form data to the original contact data
        if (editMode && contactData) {
            setFormData(contactData);
        }
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch(
                `${import.meta.env.VITE_REACT_APP_DJANGO_API_URL}/contacts/manage/${contact_id}/`,
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(formData),
                }
            );

            if (!response.ok) {
                const data = await response.json();
                // Check for specific errors in the response data
                if (data?.errors) {
                    const errorMap = data.errors as Record<string, string[]>;
                    Object.values(errorMap).forEach((errorArray) => {
                        errorArray.forEach((errMsg) => toast.error(errMsg));
                    });
                } else if (data?.message) {
                    toast.error(data.message);
                } else {
                    toast.error("Hubo un error al actualizar el contacto.");
                }
                return;
            }

            // Refetch activities to show the updated activity
            const updatedActivitiesResponse = await fetchEntityActivities('contact', contact_id as string);
            setActivities(updatedActivitiesResponse.results);

            toast.success("Contacto actualizado correctamente.");
            setEditMode(false);
        } catch (error) {
            console.error("Error updating contact data:", error);
            toast.error("Hubo un error al actualizar el contacto.");
        }
    };

    return (
        <SidebarLayout sidebarWidthPx={sidebarWidthPx}>
            <div className="user-profile-content" style={{ padding: "50px" }}>
                {loading ? (
                    <Spinner />
                ) : (
                    contactData &&
                    formData && (
                        <motion.form
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className="user-profile-form"
                            onSubmit={handleSubmit}
                            style={{ textAlign: "left", lineHeight: "2" }}
                        >
                            <div
                                className="user-profile-form-col"
                            >
                                {/* Contact Information */}
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.5 }}
                                    className="card-body shadow-sm"
                                >
                                    <div className="user-profile-header">
                                        <h4 className="h4-header">Información de Contacto</h4>
                                        {/* Edit & Save Buttons */}
                                        {canEdit && (
                                            <div className="user-profile-action-btns">
                                                <AnimatePresence>
                                                    {editMode && (
                                                        <motion.button 
                                                            type="submit" 
                                                            className="btn btn-outline-primary"
                                                            initial={{ opacity: 0, x: -20 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            exit={{ opacity: 0, x: -20 }}
                                                            transition={{ duration: 0.2 }}
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                        >
                                                            <i className="bi bi-check2" style={{ marginRight: '4px' }}></i>
                                                            Guardar
                                                        </motion.button>
                                                    )}
                                                </AnimatePresence>
                                                <motion.button 
                                                    type="button" 
                                                    className={editMode ? "btn btn-outline-danger" : "btn btn-outline-primary"} 
                                                    onClick={toggleEditMode}
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                >
                                                    {editMode ? <i className="bi bi-x" style={{ marginRight: '5px'}}></i> : <i className="bi bi-pencil" style={{ marginRight: '5px'}}></i>}
                                                    {editMode ? "Cancelar" : "Editar"}
                                                </motion.button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="user-profile-tabs d-flex bg-light">
                                        <button
                                            className={`flex-grow-1 btn py-2 ${activeTab === "basic-info" ? "bg-white" : "secondary-bg"}`}
                                            onClick={(e) => {
                                                e.preventDefault(); // Prevent form submission
                                                setActiveTab("basic-info");
                                            }}
                                        >
                                            <i className="bi bi-person me-2"></i> Información Básica
                                        </button>
                                        <button
                                            className={`flex-grow-1 btn py-2 ${activeTab === "addresses" ? "bg-white" : "secondary-bg"}`}
                                            onClick={(e) => {
                                                e.preventDefault(); // Prevent form submission
                                                setActiveTab("addresses");
                                            }}
                                        >
                                            <i className="bi bi-geo-alt"></i> Direcciones de Contacto
                                        </button>

                                        <button
                                            className={`flex-grow-1 btn py-2 ${activeTab === "phones" ? "bg-white" : "secondary-bg"}`}
                                            onClick={(e) => {
                                                e.preventDefault(); // Prevent form submission
                                                setActiveTab("phones");
                                            }}
                                        >
                                            <i className="bi bi-telephone"></i> Teléfonos de Contacto
                                        </button>
                                    </div>

                                    {activeTab === "basic-info" && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.3 }}
                                            style={{ width: "100%" }}
                                        >
                                            <div className="user-profile-info" style={{ marginBottom: '25px'}}>
                                                <div className="user-profile-col">
                                                    <label>Cédula</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        id="cedula"
                                                        value={editMode ? formData.cedula : formatCedula(formData.cedula)}
                                                        onChange={handleChange}
                                                        disabled={!editMode}
                                                    />

                                                    <label>Nombres</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        id="nombres"
                                                        value={formData.nombres}
                                                        onChange={handleChange}
                                                        disabled={!editMode}
                                                    />
                                                </div>
                                                <div className="user-profile-col">
                                                    <label>Apellidos</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        id="apellidos"
                                                        value={formData.apellidos}
                                                        onChange={handleChange}
                                                        disabled={!editMode}
                                                    />

                                                    <label>Email</label>
                                                    <input
                                                        type="email"
                                                        className="form-control"
                                                        id="email"
                                                        value={formData.email}
                                                        onChange={handleChange}
                                                        disabled={!editMode}
                                                    />
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {activeTab === "addresses" && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.3 }}
                                            style={{ width: "100%" }}
                                        >
                                            {/* Información del Perfil */}
                                            <div className="user-profile-info" style={{ flexDirection: "column" }}>
                                                {formData.direcciones.map((direccion, index) => (
                                                    <div key={index}>
                                                        <h5>Dirección {index + 1}</h5>
                                                        <span className="separator-line"></span>
                                                        <div className="direccion-container">
                                                            <div className="user-profile-info-item">
                                                                <label>Calle</label>
                                                                <input
                                                                    type="text"
                                                                    className="form-control"
                                                                    value={direccion.calle_direccion}
                                                                    onChange={(e) =>
                                                                        handleAddressChange(
                                                                            index,
                                                                            "calle_direccion",
                                                                            e.target.value
                                                                        )
                                                                    }
                                                                    disabled={!editMode}
                                                                    style={{ marginBottom: "10px" }}
                                                                />
                                                            </div>
                                                            <div className="user-profile-info-item">
                                                                <label>Descripción de la vivienda</label>
                                                                <input
                                                                    type="text"
                                                                    className="form-control"
                                                                    value={direccion.descripcion_vivienda}
                                                                    onChange={(e) =>
                                                                        handleAddressChange(
                                                                            index,
                                                                            "descripcion_vivienda",
                                                                            e.target.value
                                                                        )
                                                                    }
                                                                    disabled={!editMode}
                                                                    style={{ marginBottom: "10px" }}
                                                                />
                                                            </div>
                                                            <div className="user-profile-info-item">
                                                                <label>Ciudad</label>
                                                                <Select
                                                                    options={
                                                                        dropdownOptions.provincias.find(p => p.id === direccion.id_provincia)?.ciudades || []
                                                                    }
                                                                    getOptionLabel={(option: Ciudad) => option.descripcion}
                                                                    getOptionValue={(option: Ciudad) => String(option.id)}
                                                                    value={
                                                                        dropdownOptions.provincias
                                                                            .find(p => p.id === direccion.id_provincia)
                                                                            ?.ciudades.find(c => c.id === direccion.id_ciudad) || null
                                                                    }
                                                                    onChange={(selectedOption) => {
                                                                        if (selectedOption) {
                                                                            handleCitySelect(index, selectedOption as Ciudad);
                                                                        }
                                                                    }}
                                                                    isDisabled={!editMode || !direccion.id_provincia}
                                                                    placeholder="Selecciona ciudad"
                                                                    className="react-select-container"
                                                                    classNamePrefix="react-select"
                                                                />
                                                            </div>
                                                            <div className="user-profile-info-item">
                                                                <label>Provincia</label>
                                                                <Select
                                                                    options={dropdownOptions.provincias}
                                                                    getOptionLabel={(option: Provincia) => option.descripcion}
                                                                    getOptionValue={(option: Provincia) => String(option.id)}
                                                                    value={dropdownOptions.provincias.find(p => p.id === direccion.id_provincia) || null}
                                                                    onChange={(selectedOption) => {
                                                                        if (selectedOption) {
                                                                            handleProvinceSelect(index, selectedOption as Provincia);
                                                                        }
                                                                    }}
                                                                    isDisabled={!editMode}
                                                                    placeholder="Selecciona provincia"
                                                                    className="react-select-container"
                                                                    classNamePrefix="react-select"
                                                                />
                                                            </div>
                                                        </div>
                                                        {formData.direcciones.length > 1 && editMode && (
                                                            <motion.button
                                                                type="button"
                                                                onClick={() => removeAddress(index)}
                                                                className="btn btn-outline-danger btn-sm"
                                                                style={{ marginBottom: "10px", marginTop: "10px" }}
                                                                initial={{ opacity: 0, x: 0, y: -20 }}
                                                                animate={{ opacity: 1, x: 0, y: 0 }}
                                                                exit={{ opacity: 0, x: 0, y: -20 }}
                                                                transition={{ duration: 0.2 }}
                                                            >
                                                                Eliminar Dirección
                                                            </motion.button>
                                                        )}
                                                    </div>
                                                ))}
                                                {editMode && (
                                                    <motion.button
                                                        type="button"
                                                        onClick={addAddress}
                                                        className="btn btn-outline-primary btn-sm"
                                                        style={{ marginTop: "10px" }}
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                    >
                                                        Agregar Dirección
                                                    </motion.button>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}

                                    {activeTab === "phones" && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.3 }}
                                            style={{ width: "100%" }}
                                        >
                                            {/* Phones */}
                                            <div
                                                className="user-profile-info"
                                                style={{ flexDirection: "column" }}
                                            >
                                                {formData.telefonos.map((telefono, index) => (
                                                    <div key={index}>
                                                        <h5>Teléfono {index + 1}</h5>
                                                        <span className="separator-line"></span>
                                                        <div className="direccion-container">
                                                            <div className="user-profile-info-item">
                                                                <label>Número Teléfonico</label>
                                                                <input
                                                                    type="text"
                                                                    className="form-control"
                                                                    value={telefono.numero_telefonico}
                                                                    onChange={(e) =>
                                                                        handlePhoneChange(
                                                                            index,
                                                                            "numero_telefonico",
                                                                            e.target.value
                                                                        )
                                                                    }
                                                                    disabled={!editMode}
                                                                    style={{ marginBottom: "10px" }}
                                                                />
                                                            </div>
                                                            <div className="user-profile-info-item">
                                                                <label>Tipo de Teléfono</label>
                                                                <Select
                                                                    options={dropdownOptions.tipos_telefono}
                                                                    getOptionLabel={(option: TipoTelefono) => option.tipo_telefono}
                                                                    getOptionValue={(option: TipoTelefono) => String(option.id_tipo_telefono)}
                                                                    value={
                                                                        dropdownOptions.tipos_telefono.find(
                                                                            (t) => t.id_tipo_telefono === telefono.id_tipo_telefono
                                                                        ) || null
                                                                    }
                                                                    onChange={(selectedOption) => {
                                                                        if (selectedOption) {
                                                                            handlePhoneTypeSelect(index, selectedOption as TipoTelefono);
                                                                        }
                                                                    }}
                                                                    isDisabled={!editMode}
                                                                    placeholder="Selecciona tipo"
                                                                    className="react-select-container"
                                                                    classNamePrefix="react-select"
                                                                />
                                                            </div>
                                                        </div>
                                                        {formData.telefonos.length > 1 && editMode && (
                                                            <motion.button
                                                                type="button"
                                                                onClick={() => removePhone(index)}
                                                                className="btn btn-outline-danger btn-sm"
                                                                style={{ marginBottom: "10px", marginTop: "10px" }}
                                                                initial={{ opacity: 0, x: 0, y: -20 }}
                                                                animate={{ opacity: 1, x: 0, y: 0 }}
                                                                exit={{ opacity: 0, x: 0, y: -20 }}
                                                                transition={{ duration: 0.2 }}
                                                            >
                                                                Eliminar Teléfono
                                                            </motion.button>
                                                        )}
                                                    </div>
                                                ))}
                                                {editMode && (
                                                    <motion.button
                                                        type="button"
                                                        onClick={addPhone}
                                                        className="btn btn-outline-primary btn-sm"
                                                        style={{ marginTop: "10px" }}
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                    >
                                                        Agregar Teléfono
                                                    </motion.button>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </motion.div>
                            </div>
                            <div className="user-profile-form-col" style={{ height: "fit-content", width: '30%' }}>
                                {/* Historial de actividades */}
                                <div className="card-body shadow-sm">
                                    <ActivityLog activities={activities} setActivities={setActivities} entity_type="contact" entity_id={contact_id}/>
                                </div>

                                <div className="card-body shadow-sm" style={{ marginTop: '-30px' }}>
                                    <h4 className="h4-header">Casos Relacionados</h4>
                                    <div className="user-profile-cases" style={{ width: '100%' }}>
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
                                </div>
                            </div>
                        </motion.form>
                    )
                )}
            </div>
        </SidebarLayout>
    );
}

// TODO: Delete user functionality