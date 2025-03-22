import { toast } from "react-toastify";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import "../../styles/auth/profileViewStyles.css";
import "../../styles/auth/contactDetailStyles.css";
import { useAuthStore } from "../../stores/authStore";
import { Spinner } from "../../components/ui/Spinner";
import { motion, AnimatePresence } from "framer-motion";
import { useSidebarStore } from "../../stores/sidebarStore";
import { SidebarLayout } from "../../components/layouts/SidebarLayout";
import {
    Ciudad,
    Provincia,
    TipoTelefono,
    TelefonosContacto,
    DireccionesContacto,
} from "../../types/contactTypes";
import Multiselect from "multiselect-react-dropdown";
import { Activity } from "../../types/activityTypes";
import { formatCedula } from "../../utils/formatUtils";
import { ActivityLog } from "../../components/ui/ActivityLog";
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

    // Fetch contact activities on component mount
    useEffect(() => {
        const fetchActivities = async () => {
            try {
                const fetchedActivities = await fetchEntityActivities('contact', contact_id as string);
                setActivities(fetchedActivities);
            } catch (error) {
                console.error("Error fetching contact activities:", error);
            }
        };
        fetchActivities();
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
            const updatedActivities = await fetchEntityActivities('contact', contact_id as string);
            setActivities(updatedActivities);

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
                                                                <Multiselect
                                                                    options={
                                                                        dropdownOptions.provincias.find(
                                                                            (p) => p.id === direccion.id_provincia
                                                                        )?.ciudades || []
                                                                    }
                                                                    selectedValues={(
                                                                        dropdownOptions.provincias.find(
                                                                            (p) => p.id === direccion.id_provincia
                                                                        )?.ciudades || []
                                                                    ).filter((c: Ciudad) => c.id === direccion.id_ciudad)}
                                                                    onSelect={(
                                                                        _selectedList,
                                                                        selectedItem: Ciudad
                                                                    ) => handleCitySelect(index, selectedItem)}
                                                                    onRemove={() => { }}
                                                                    displayValue="descripcion"
                                                                    placeholder="Selecciona ciudad"
                                                                    showArrow
                                                                    singleSelect
                                                                    disable={!editMode || !direccion.id_provincia}
                                                                    className="multi-select-dropdown"
                                                                />
                                                            </div>
                                                            <div className="user-profile-info-item">
                                                                <label>Provincia</label>
                                                                <Multiselect
                                                                    options={dropdownOptions.provincias}
                                                                    selectedValues={dropdownOptions.provincias.filter(
                                                                        (p) => p.id === direccion.id_provincia
                                                                    )}
                                                                    onSelect={(
                                                                        _selectedList,
                                                                        selectedItem: Provincia
                                                                    ) => handleProvinceSelect(index, selectedItem)}
                                                                    onRemove={() => { }}
                                                                    displayValue="descripcion"
                                                                    placeholder="Selecciona provincia"
                                                                    showArrow
                                                                    singleSelect
                                                                    disable={!editMode}
                                                                    className="multi-select-dropdown"
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
                                                                <Multiselect
                                                                    options={dropdownOptions.tipos_telefono}
                                                                    selectedValues={dropdownOptions.tipos_telefono.filter(
                                                                        (t) =>
                                                                            t.id_tipo_telefono === telefono.id_tipo_telefono
                                                                    )}
                                                                    onSelect={(_selectedList, selectedItem: TipoTelefono) =>
                                                                        handlePhoneTypeSelect(index, selectedItem)
                                                                    }
                                                                    onRemove={() => { }}
                                                                    displayValue="tipo_telefono"
                                                                    placeholder="Selecciona tipo"
                                                                    showArrow
                                                                    singleSelect
                                                                    disable={!editMode}
                                                                    className="multi-select-dropdown"
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
                                <div className="card-body shadow">
                                    <ActivityLog activities={activities} />
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