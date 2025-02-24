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