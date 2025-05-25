import api from "./api";
import { Contact } from "../types/contactTypes";
import { showResponseErrors } from "../utils/formatUtils";
import { AxiosError } from "axios";

/**
 * Creates a new contact in the backend.
 * @param newContact The data for the new contact.
 * @returns The created contact data.
 */
export const createContact = async (newContact: Contact): Promise<Contact> => {
    try {
        const response = await api.post("/contacts/manage/create/", newContact);
        console.log("Contact created:", response.data);
        const createdContact = response.data.contact;
        
        return createdContact;
    } catch (error) {
        const axiosError = error as AxiosError;
        console.error("Error creating contact:", axiosError);
        showResponseErrors(axiosError.response?.data);
        throw error;
    }
}

/**
 * Fetches contacts from the backend.
 * @param queryString Optional query filter for contact name, cédula, or email.
 * @returns An array of Contacts.
 */
export const fetchContacts = async (queryString?: string): Promise<Contact[]> => {
    try {
        let params = {};

        // if the query string has numbers, it's a cédula
        if (queryString && /\d/.test(queryString)) {
            // it's a cédula
            params = { cedula: queryString };
        }
        else if (queryString && queryString.includes("@")) {
            // if it has an @, it's an email
            params = { email: queryString };
        }
        else {
            // if it only has letters, it's a name
            params = { nombre: queryString };
        }

        // Build query parameters if a filter is provided
        const response = await api.get("/contacts/list/", { params });

        return response.data.results;
    } catch (error) {
        console.error("Error fetching contacts:", error);
        throw error; // Re-throw the error after logging it
    }
};