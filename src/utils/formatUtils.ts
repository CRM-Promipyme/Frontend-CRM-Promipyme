export const formatKey = (key: string) => {
    // Format a string into a human-readable format

    return key
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
};
