import api from "./api";
import { Contact } from "../types/contactTypes";
import { showResponseErrors } from "../utils/formatUtils";

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
        console.error("Error creating contact:", error);
        
        showResponseErrors(error.response?.data);
        throw error;
    }
}
