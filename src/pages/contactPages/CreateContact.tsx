import { useState } from "react";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import "../../styles/auth/contactDetailStyles.css";
import { Contact } from "../../types/contactTypes";
import Multiselect from "multiselect-react-dropdown";
import { Spinner } from "../../components/ui/Spinner";
import { useAuthStore } from "../../stores/authStore";
import { useSidebarStore } from "../../stores/sidebarStore";
import { createContact } from "../../controllers/contactControllers";
import { useDropdownOptions } from "../../hooks/userControllerHooks";
import { SidebarLayout } from "../../components/layouts/SidebarLayout";
import { Ciudad, Provincia, TipoTelefono } from "../../types/contactTypes";

// Initial state for the contact form
const initialFormData = {
    cedula: "",
    nombres: "",
    apellidos: "",
    email: "",
    fecha_nacimiento: "",
    telefonos: [
        { numero_telefonico: "", tipo_telefono: "", id_tipo_telefono: 0 },
    ],
    direcciones: [
        {
            calle_direccion: "",
            descripcion_vivienda: "",
            ciudad: "",
            id_ciudad: 0,
            provincia: "",
            id_provincia: 0,
        },
    ],
};

export function CreateContact() {
    // Global States
    const sidebarWidthPx = useSidebarStore((state) => state.sidebarWidthPx);
    const accessToken = useAuthStore((state) => state.accessToken);
    const dropdownOptions = useDropdownOptions(accessToken);

    // Local States
    const [formData, setFormData] = useState(initialFormData);
    const [loading, setLoading] = useState<boolean>(false);
    const navigate = useNavigate();

    // Basic input change handler
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData((prev) => ({ ...prev, [id]: value }));
    };

    // Handle phone number changes
    const handlePhoneChange = (
        index: number,
        field: keyof typeof formData.telefonos[number],
        value: string
    ) => {
        setFormData((prev) => ({
            ...prev,
            telefonos: prev.telefonos.map((phone, i) =>
                i === index ? { ...phone, [field]: value } : phone
            ),
        }));
    };

    // Handle address changes
    const handleAddressChange = (
        index: number,
        field: keyof typeof formData.direcciones[number],
        value: string
    ) => {
        setFormData((prev) => ({
            ...prev,
            direcciones: prev.direcciones.map((addr, i) =>
                i === index ? { ...addr, [field]: value } : addr
            ),
        }));
    };

    // Handle province selection change for addresses
    const handleProvinceSelect = (index: number, selectedItem: Provincia) => {
        const updatedAddresses = [...formData.direcciones];
        updatedAddresses[index] = {
            ...updatedAddresses[index],
            provincia: selectedItem.descripcion,
            id_provincia: selectedItem.id,
            ciudad: "",
            id_ciudad: 0,
        };
        setFormData((prev) => ({ ...prev, direcciones: updatedAddresses }));
    };

    // Handle city selection change for addresses
    const handleCitySelect = (index: number, selectedItem: Ciudad) => {
        const updatedAddresses = [...formData.direcciones];
        updatedAddresses[index] = {
            ...updatedAddresses[index],
            ciudad: selectedItem.descripcion,
            id_ciudad: selectedItem.id,
        };
        setFormData((prev) => ({ ...prev, direcciones: updatedAddresses }));
    };

    // Handle phone type selection change
    const handlePhoneTypeSelect = (index: number, selectedItem: TipoTelefono) => {
        const updatedPhones = [...formData.telefonos];
        updatedPhones[index] = {
            ...updatedPhones[index],
            tipo_telefono: selectedItem.tipo_telefono,
            id_tipo_telefono: selectedItem.id_tipo_telefono,
        };
        setFormData((prev) => ({ ...prev, telefonos: updatedPhones }));
    };

    // Functions to add or remove phone numbers
    const addPhone = () => {
        setFormData((prev) => ({
            ...prev,
            telefonos: [
                ...prev.telefonos,
                { numero_telefonico: "", tipo_telefono: "", id_tipo_telefono: 0 },
            ],
        }));
    };

    const removePhone = (index: number) => {
        setFormData((prev) => ({
            ...prev,
            telefonos: prev.telefonos.filter((_, i) => i !== index),
        }));
    };

    // Functions to add or remove addresses
    const addAddress = () => {
        setFormData((prev) => ({
            ...prev,
            direcciones: [
                ...prev.direcciones,
                {
                    calle_direccion: "",
                    descripcion_vivienda: "",
                    ciudad: "",
                    id_ciudad: 0,
                    provincia: "",
                    id_provincia: 0,
                },
            ],
        }));
    };

    const removeAddress = (index: number) => {
        setFormData((prev) => ({
            ...prev,
            direcciones: prev.direcciones.filter((_, i) => i !== index),
        }));
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const createdContact = await createContact(formData as Contact);
            toast.success("Contacto creado correctamente.");
            // Optionally, reset the form after successful creation:
            setFormData(initialFormData);
            navigate(`/contacts/details/${createdContact.contact_id}`);
        } catch (error) {
            console.error("Error creating contact:", error);
            // The createContact controller already calls showResponseErrors.
        } finally {
            setLoading(false);
        }
    };

    return (
        <SidebarLayout sidebarWidthPx={sidebarWidthPx}>
            <h1 className="page-title">Crear Contacto</h1>
            <div className="create-contact-form-card card-body" style={{ padding: "50px" }}>
                {loading ? (
                    <Spinner />
                ) : (
                    <motion.form
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        onSubmit={handleSubmit}
                        style={{ textAlign: "left", lineHeight: "2" }}
                    >
                        {/* Información Básica */}
                        <h4 style={{ marginBottom: "25px" }}>Información Básica</h4>
                        <div className="user-profile-info-item mb-3">
                            <label>Cédula</label>
                            <input
                                type="text"
                                className="form-control"
                                id="cedula"
                                value={formData.cedula}
                                onChange={handleChange}
                                placeholder="Ingresa la cédula"
                            />
                        </div>
                        <div className="user-profile-info-item mb-3">
                            <label>Nombres</label>
                            <input
                                type="text"
                                className="form-control"
                                id="nombres"
                                value={formData.nombres}
                                onChange={handleChange}
                                placeholder="Ingresa los nombres"
                            />
                        </div>
                        <div className="user-profile-info-item mb-3">
                            <label>Apellidos</label>
                            <input
                                type="text"
                                className="form-control"
                                id="apellidos"
                                value={formData.apellidos}
                                onChange={handleChange}
                                placeholder="Ingresa los apellidos"
                            />
                        </div>
                        <div className="user-profile-info-item mb-3">
                            <label>Email</label>
                            <input
                                type="email"
                                className="form-control"
                                id="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="Ingresa el email"
                            />
                        </div>
                        <div className="user-profile-info-item mb-3">
                            <label>Fecha de Nacimiento</label>
                            <input
                                type="date"
                                className="form-control"
                                id="fecha_nacimiento"
                                value={formData.fecha_nacimiento}
                                onChange={handleChange}
                            />
                        </div>

                        {/* Información de Contacto */}
                        <h4 style={{ marginBottom: "25px", marginTop: '25px' }}>Información de Contacto</h4>
                        {/* Teléfonos */}
                        <div className="user-profile-info d-flex flex-column">
                            {formData.telefonos.map((telefono, index) => (
                                <div key={index} className="mb-3">
                                    <h5>Teléfono {index + 1}</h5>
                                    <hr />
                                    <div className="d-flex flex-column">
                                        <div className="user-profile-info-item mb-2">
                                            <label>Número Teléfonico</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={telefono.numero_telefonico}
                                                onChange={(e) =>
                                                    handlePhoneChange(index, "numero_telefonico", e.target.value)
                                                }
                                                placeholder="Ingresa el número"
                                            />
                                        </div>
                                        <div className="user-profile-info-item mb-2">
                                            <label>Tipo de Teléfono</label>
                                            <Multiselect
                                                options={dropdownOptions.tipos_telefono}
                                                selectedValues={dropdownOptions.tipos_telefono.filter(
                                                    (t) => t.id_tipo_telefono === telefono.id_tipo_telefono
                                                )}
                                                onSelect={(_selectedList, selectedItem: TipoTelefono) =>
                                                    handlePhoneTypeSelect(index, selectedItem)
                                                }
                                                onRemove={() => { }}
                                                displayValue="tipo_telefono"
                                                placeholder="Selecciona tipo"
                                                showArrow
                                                singleSelect
                                                className="multi-select-dropdown"
                                            />
                                        </div>
                                    </div>
                                    {formData.telefonos.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removePhone(index)}
                                            className="btn btn-outline-danger btn-sm"
                                            style={{ marginBottom: "10px" }}
                                        >
                                            Eliminar Teléfono
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={addPhone}
                                className="btn btn-outline-primary btn-sm"
                                style={{ marginTop: "10px" }}
                            >
                                Agregar Teléfono
                            </button>
                        </div>

                        {/* Direcciones */}
                        <div className="user-profile-info d-flex flex-column mt-4">
                            {formData.direcciones.map((direccion, index) => (
                                <div key={index} className="mb-3">
                                    <h5>Dirección {index + 1}</h5>
                                    <hr />
                                    <div className="d-flex flex-column">
                                        <div className="user-profile-info-item mb-2">
                                            <label>Calle</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={direccion.calle_direccion}
                                                onChange={(e) =>
                                                    handleAddressChange(index, "calle_direccion", e.target.value)
                                                }
                                                placeholder="Ingresa la calle"
                                            />
                                        </div>
                                        <div className="user-profile-info-item mb-2">
                                            <label>Descripción de la vivienda</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={direccion.descripcion_vivienda}
                                                onChange={(e) =>
                                                    handleAddressChange(index, "descripcion_vivienda", e.target.value)
                                                }
                                                placeholder="Ingresa la descripción"
                                            />
                                        </div>
                                        <div className="user-profile-info-item mb-2">
                                            <label>Provincia</label>
                                            <Multiselect
                                                options={dropdownOptions.provincias}
                                                selectedValues={dropdownOptions.provincias.filter(
                                                    (p) => p.id === direccion.id_provincia
                                                )}
                                                onSelect={(_selectedList, selectedItem: Provincia) =>
                                                    handleProvinceSelect(index, selectedItem)
                                                }
                                                onRemove={() => { }}
                                                displayValue="descripcion"
                                                placeholder="Selecciona provincia"
                                                showArrow
                                                singleSelect
                                                className="multi-select-dropdown"
                                            />
                                        </div>
                                        <div className="user-profile-info-item mb-2">
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
                                                onSelect={(_selectedList, selectedItem: Ciudad) =>
                                                    handleCitySelect(index, selectedItem)
                                                }
                                                onRemove={() => { }}
                                                displayValue="descripcion"
                                                placeholder="Selecciona ciudad"
                                                showArrow
                                                singleSelect
                                                className="multi-select-dropdown"
                                            />
                                        </div>
                                    </div>
                                    {formData.direcciones.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeAddress(index)}
                                            className="btn btn-outline-danger btn-sm"
                                            style={{ marginBottom: "10px" }}
                                        >
                                            Eliminar Dirección
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={addAddress}
                                className="btn btn-outline-primary btn-sm"
                                style={{ marginTop: "10px" }}
                            >
                                Agregar Dirección
                            </button>
                        </div>

                        {/* Submit Button */}
                        <div className="user-profile-action-btns" style={{ width: "100%" }}>
                            <button type="submit" className="btn btn-primary mt-3" style={{ width: "100%" }}>
                                Crear Contacto
                            </button>
                        </div>
                    </motion.form>
                )}
            </div>
        </SidebarLayout>
    );
}
