import axios from "axios";
import * as XLSX from "xlsx";
import { useState } from "react";
import { toast } from "react-toastify";
import { Spinner } from "../../components/ui/Spinner";
import { useSidebarStore } from "../../stores/sidebarStore";
import { SidebarLayout } from "../../components/layouts/SidebarLayout";
import { useAuthStore } from "../../stores/authStore";

export function MassInviteUsers() {
    const sidebarWidthPx = useSidebarStore((state) => state.sidebarWidthPx);
    const accessToken = useAuthStore((state) => state.accessToken);
    const BASE_URL = import.meta.env.VITE_VERCEL_REACT_APP_DJANGO_API_URL;

    const [loading, setLoading] = useState(false);
    const [previewUsers, setPreviewUsers] = useState<any[]>([]);
    const [file, setFile] = useState<File | null>(null);

    // Download template
    const handleDownloadTemplate = async () => {
        setLoading(true);
        try {
            const response = await axios.get(
                `${BASE_URL}/auth/accounts/mass-upload/`,
                {
                    headers: { Authorization: `Bearer ${accessToken}` },
                    responseType: "blob",
                }
            );
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", "plantilla_usuarios.xlsx");
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch {
            toast.error("No se pudo descargar la plantilla.");
        }
        setLoading(false);
    };

    // Upload file
    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            toast.error("Selecciona un archivo para subir.");
            return;
        }
        setLoading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            await axios.post(
                `${BASE_URL}/auth/accounts/mass-upload/`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        "Content-Type": "multipart/form-data",
                    },
                }
            );
            // Expecting backend to return a list of users to be uploaded
            toast.success("Archivo procesado correctamente.");
        } catch {
            toast.error("No se pudo procesar el archivo. Verifica el formato.");
        }
        setLoading(false);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0] || null;
        setFile(selectedFile);

        if (selectedFile) {
            const reader = new FileReader();
            reader.onload = (evt) => {
                const data = evt.target?.result;
                if (!data) return;
                const workbook = XLSX.read(data, { type: "binary" });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(worksheet);
                setPreviewUsers(json);
            };
            reader.readAsBinaryString(selectedFile);
        } else {
            setPreviewUsers([]);
        }
    };

    return (
        <SidebarLayout sidebarWidthPx={sidebarWidthPx}>
            <h1 className="page-title" style={{ marginBottom: '0px' }}>Carga Masiva de Usuarios</h1>
            <div className="mass-invite-user-form-card card-body">
                <p style={{ width: "100%" }}>
                    Descarga la plantilla de Excel, complétala y súbela para invitar usuarios en masa.<br />
                    <b>Formato:</b> Primer Nombre | Apellido | Email | Nombre Rol
                </p>
                <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", width: "100%" }}>
                    <button
                        className="btn btn-outline-primary"
                        onClick={handleDownloadTemplate}
                        disabled={loading}
                        type="button"
                    >
                        {loading ? <Spinner /> : "Descargar Plantilla"}
                    </button>
                    <form onSubmit={handleUpload} style={{ display: "flex", gap: "1rem" }}>
                        <input
                            type="file"
                            accept=".xlsx,.xls"
                            className="form-control"
                            style={{ maxWidth: 250 }}
                            onChange={handleFileChange}
                            disabled={loading}
                        />
                        <button
                            className="btn btn-primary"
                            type="submit"
                            disabled={loading || !file}
                        >
                            {loading ? <Spinner /> : "Subir Archivo"}
                        </button>
                    </form>
                </div>
                {previewUsers.length > 0 && (
                    <div
                        style={{
                            marginTop: "2rem",
                            background: "#fff",
                            width: "100%",
                        }}
                    >
                        <div style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "10px" }}>
                            <i className="bi bi-people" style={{ fontSize: "1.5rem", color: "#0d6efd" }}></i>
                            <div>
                                <h5 style={{ margin: 0, fontWeight: 600 }}>Vista previa de usuarios a invitar</h5>
                                <span style={{ color: "#6c757d", fontSize: "0.95rem" }}>
                                    {previewUsers.length} usuario{previewUsers.length > 1 ? "s" : ""} listo{previewUsers.length > 1 ? "s" : ""} para invitar
                                </span>
                            </div>
                        </div>
                        <div style={{ overflowX: "auto" }}>
                            <table className="table" style={{ minWidth: 600 }}>
                                <thead>
                                    <tr style={{ background: "#f8fafc" }}>
                                        <th style={{ fontWeight: 700, fontSize: "1rem" }}>Primer Nombre</th>
                                        <th style={{ fontWeight: 700, fontSize: "1rem" }}>Apellido</th>
                                        <th style={{ fontWeight: 700, fontSize: "1rem" }}>Email</th>
                                        <th style={{ fontWeight: 700, fontSize: "1rem" }}>Nombre Rol</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {previewUsers.map((user, idx) => (
                                        <tr
                                            key={idx}
                                            style={{
                                                background: idx % 2 === 0 ? "#f9fafb" : "#fff",
                                                verticalAlign: "middle"
                                            }}
                                        >
                                            <td style={{ fontWeight: 500 }}>{user["Primer Nombre"]}</td>
                                            <td style={{ fontWeight: 500 }}>{user["Apellido"]}</td>
                                            <td>
                                                <span
                                                    style={{
                                                        background: "#f1f5f9",
                                                        borderRadius: "6px",
                                                        padding: "2px 8px",
                                                        fontFamily: "monospace",
                                                        fontSize: "0.97em"
                                                    }}
                                                >
                                                    {user["Email"]}
                                                </span>
                                            </td>
                                            <td>
                                                <span
                                                    style={{
                                                        background: "#f3e8ff",
                                                        color: "#a21caf",
                                                        borderRadius: "6px",
                                                        padding: "2px 10px",
                                                        fontWeight: 600,
                                                        fontSize: "0.97em"
                                                    }}
                                                >
                                                    {user["Nombre Rol"]}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </SidebarLayout>
    );
}