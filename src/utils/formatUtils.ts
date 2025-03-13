import { toast } from 'react-toastify';

export const formatKey = (key: string) => {
    // Format a string into a human-readable format

    return key
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
};

export const formatCedula = (cedula: string) => {
    // Formatear la cedula en el formato 000-0000000-0

    return cedula.replace(/(\d{3})(\d{7})(\d)/, "$1-$2-$3");
}

/**
 * Lowers the opacity of a given color
 * @param color The color (hex code) to lower the opacity of
 * @param opacity The opacity level between 0 and 1
 * @returns The color with the specified opacity (rgba format)
 */
export const lowerColorOpacity = (color: string, opacity: number): string => {
    // Handle invalid opacity values
    if (opacity < 0 || opacity > 1) {
        opacity = Math.max(0, Math.min(1, opacity));
    }

    // Default to black if color is invalid
    let r = 0, g = 0, b = 0;

    // Handle hex format
    if (color.startsWith('#')) {
        // Remove # if present
        color = color.substring(1);

        // Convert 3-digit hex to 6-digit
        if (color.length === 3) {
            color = color[0] + color[0] + color[1] + color[1] + color[2] + color[2];
        }

        // Parse the hex values
        if (color.length === 6) {
            r = parseInt(color.substring(0, 2), 16);
            g = parseInt(color.substring(2, 4), 16);
            b = parseInt(color.substring(4, 6), 16);
        }
    }

    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

export const showResponseErrors = (data: unknown, defaultMessage: string = "Ha ocurrido un error. Por favor, intenta más tarde.") => {
    if (!data || typeof data !== 'object') {
        toast.error(defaultMessage);
        return;
    }
    
    const typedData = data as Record<string, unknown>;
    
    // Check for specific errors array
    if (typedData.errors && typeof typedData.errors === 'object') {
        const errorMap = typedData.errors as Record<string, string[]>;
        Object.values(errorMap).forEach((errorArray) => {
            errorArray.forEach((errMsg) => toast.error(errMsg));
        });
    } 
    // Check for message string
    else if (typedData.message && typeof typedData.message === 'string') {
        toast.error(typedData.message);
    } 
    // Fallback error
    else {
        toast.error(defaultMessage);
    }
}