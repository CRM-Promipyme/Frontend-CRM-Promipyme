import axios from "axios";
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
    const [users, setUsers] = useState<any[]>([]);
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
            const response = await axios.post(
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
            setUsers(response.data.users || []);
            toast.success("Archivo procesado correctamente.");
        } catch {
            toast.error("No se pudo procesar el archivo. Verifica el formato.");
            setUsers([]);
        }
        setLoading(false);
    };

    return (
        <SidebarLayout sidebarWidthPx={sidebarWidthPx}>
            <h1 className="page-title" style={{ marginBottom: '0px' }}>Carga Masiva de Usuarios</h1>
            <div className="invite-user-form-card card-body">
                <p>
                    Descarga la plantilla de Excel, complétala y súbela para invitar usuarios en masa.<br />
                    <b>Formato:</b> Primer Nombre | Apellido | Email | Nombre Rol
                </p>
                <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
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
                            onChange={e => setFile(e.target.files?.[0] || null)}
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
                {users.length > 0 && (
                    <div style={{ marginTop: "2rem" }}>
                        <h5>Usuarios a Invitar:</h5>
                        <div style={{ overflowX: "auto" }}>
                            <table className="table table-bordered table-striped">
                                <thead>
                                    <tr>
                                        <th>Primer Nombre</th>
                                        <th>Apellido</th>
                                        <th>Email</th>
                                        <th>Nombre Rol</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user, idx) => (
                                        <tr key={idx}>
                                            <td>{user.first_name || user["Primer Nombre"]}</td>
                                            <td>{user.last_name || user["Apellido"]}</td>
                                            <td>{user.email || user["Email"]}</td>
                                            <td>{user.role_name || user["Nombre Rol"]}</td>
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