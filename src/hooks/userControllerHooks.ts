import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
    Provincia,
    TipoTelefono,
    UpdateContact
} from "../types/contactTypes";

// Hook to fetch dropdown options (provincias with cities and tipos_telefono)
export function useDropdownOptions(accessToken: string | null) {
    const [dropdownOptions, setDropdownOptions] = useState<{
        provincias: Provincia[];
        tipos_telefono: TipoTelefono[];
    }>({
        provincias: [],
        tipos_telefono: [],
    });

    useEffect(() => {
        const fetchDropdownOptions = async () => {
            try {
                const response = await fetch(
                    `${import.meta.env.VITE_VERCEL_REACT_APP_DJANGO_API_URL}/contacts/dropdown-opts/?provincias=true&tipos_telefono=true`,
                    {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                        },
                    }
                );
                if (!response.ok) throw new Error("Failed to fetch dropdown options");
                const data = await response.json();
                setDropdownOptions(data);
            } catch (error) {
                console.error("Error fetching dropdown options:", error);
                toast.error("Error fetching dropdown options");
            }
        };

        if (accessToken) {
            fetchDropdownOptions();
        }
    }, [accessToken]);

    return dropdownOptions;
}

// Hook to fetch contact details and manage form state
export function useContactData(
    contact_id: string | undefined,
    accessToken: string | null
) {
    const [contactData, setContactData] = useState<UpdateContact | null>(null);
    const [formData, setFormData] = useState<UpdateContact | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        if (!contact_id || !accessToken) return;

        const fetchContactData = async () => {
            try {
                const response = await fetch(
                    `${import.meta.env.VITE_VERCEL_REACT_APP_DJANGO_API_URL}/contacts/list/?contact_id=${contact_id}`,
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                            "Content-Type": "application/json",
                        },
                    }
                );

                if (!response.ok) throw new Error("Failed to fetch contact data");

                const data: UpdateContact = await response.json();
                setContactData(data);
                setFormData(data); // Initialize form state with fetched data

                console.log("Fetched contact data:", data);
            } catch (error) {
                console.error("Error fetching contact data:", error);
                toast.error("Hubo un error al cargar los datos del contacto.");
            } finally {
                setLoading(false);
            }
        };

        fetchContactData();
    }, [contact_id, accessToken]);

    return { contactData, formData, setFormData, loading };
}
