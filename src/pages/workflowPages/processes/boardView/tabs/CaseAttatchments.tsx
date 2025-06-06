import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Spinner } from "../../../../../components/ui/Spinner";
import { useAuthStore } from "../../../../../stores/authStore";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface CaseAttatchmentsProps {
    caseId: number;
}

interface Attachment {
    id_adjunto: number;
    archivo: string;
    archivo_url: string;
    fecha_creacion: string;
    subido_por: string;
}

export function CaseAttatchments({ caseId }: CaseAttatchmentsProps) {
    const BASE_URL = import.meta.env.VITE_VERCEL_REACT_APP_DJANGO_API_URL;
    const authStore = useAuthStore();
    const accessToken = authStore.accessToken;

    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [fileSizes, setFileSizes] = useState<{ [id: number]: string }>({});
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch attachments
    const fetchAttachments = async () => {
        setLoading(true);
        try {
            const res = await axios.get(
                `${BASE_URL}/workflows/casos/manage/attachments/${caseId}/`,
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            setAttachments(res.data);
        } catch {
            toast.error("No se pudieron cargar los archivos adjuntos.");
        }
        setLoading(false);
    };

    useEffect(() => {
        if (caseId) fetchAttachments();
        // eslint-disable-next-line
    }, [caseId]);

    // Upload handler
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        const formData = new FormData();
        formData.append("archivo", file);

        try {
            await axios.post(
                `${BASE_URL}/workflows/casos/manage/attachments/${caseId}/`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        "Content-Type": "multipart/form-data",
                    },
                }
            );
            toast.success("Archivo subido correctamente.");
            fetchAttachments();
        } catch {
            toast.error("No se pudo subir el archivo.");
        }
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // Helper: get file extension
    function getFileExtension(filename: string) {
        return filename.split('.').pop()?.toUpperCase() || '';
    }

    // Helper: get file size (fetches HEAD, returns string in MB/KB)
    async function fetchFileSize(url: string): Promise<string> {
        try {
            const res = await fetch(url, { method: 'HEAD' });
            const size = res.headers.get('content-length');
            if (!size) return '';
            const bytes = parseInt(size, 10);
            if (bytes > 1024 * 1024)
                return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
            if (bytes > 1024)
                return (bytes / 1024).toFixed(1) + ' KB';
            return bytes + ' B';
        } catch {
            return '';
        }
    }

    useEffect(() => {
        // Fetch file sizes for all attachments
        async function loadSizes() {
            const sizes: { [id: number]: string } = {};
            await Promise.all(
                attachments.map(async (att) => {
                    const url = att.archivo_url || att.archivo;
                    sizes[att.id_adjunto] = await fetchFileSize(url);
                })
            );
            setFileSizes(sizes);
        }
        if (attachments.length > 0) loadSizes();
    }, [attachments]);

    return (
        <div
            style={{
                marginTop: "2rem",
                background: "#fff",
                borderRadius: "12px",
            }}
        >
            <div style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "10px" }}>
                <i className="bi bi-paperclip" style={{ fontSize: "1.5rem", color: "#0d6efd" }}></i>
                <div>
                    <h5 style={{ margin: 0, fontWeight: 600 }}>Archivos Adjuntos</h5>
                    <span style={{ color: "#6c757d", fontSize: "0.95rem" }}>
                        Adjunta y visualiza archivos relacionados a este caso.
                    </span>
                </div>
            </div>
            <form
                onSubmit={e => { e.preventDefault(); fileInputRef.current?.click(); }}
                style={{ marginBottom: "1.5rem" }}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    onChange={handleFileChange}
                    disabled={uploading}
                    accept="application/pdf,image/*"
                />
                <button
                    className="btn btn-outline-primary"
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                >
                    {uploading ? <Spinner className="me-2" /> : <i className="bi bi-upload me-2"></i>}
                    {uploading ? "Subiendo..." : "Subir Archivo"}
                </button>
            </form>
            {loading ? (
                <div className="d-flex justify-content-center py-4">
                    <Spinner />
                </div>
            ) : attachments.length === 0 ? (
                <div className="text-muted" style={{ padding: "1rem" }}>
                    No hay archivos adjuntos para este caso.
                </div>
            ) : (
                <div style={{ overflowX: "auto" }}>
                    <table className="table" style={{ minWidth: 700 }}>
                        <thead>
                            <tr style={{ background: "#f8fafc" }}>
                                <th style={{ fontWeight: 700 }}>
                                    <i className="bi bi-file-earmark" style={{ marginRight: 6 }} /> Archivo
                                </th>
                                <th style={{ fontWeight: 700 }}>
                                    <i className="bi bi-person" style={{ marginRight: 6 }} /> Subido por
                                </th>
                                <th style={{ fontWeight: 700 }}>
                                    <i className="bi bi-calendar" style={{ marginRight: 6 }} /> Fecha de subida
                                </th>
                                <th style={{ fontWeight: 700 }}>Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {attachments.map((att) => {
                                const fileName = att.archivo.split("/").pop() || "archivo";
                                const ext = getFileExtension(fileName);
                                const isPdf = ext === "PDF";
                                return (
                                    <tr key={att.id_adjunto} style={{ verticalAlign: "middle" }}>
                                        <td>
                                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                                <i className={`bi ${isPdf ? "bi-file-earmark-pdf" : "bi-file-earmark"} text-danger`} style={{ fontSize: 24 }} />
                                                <div>
                                                    <a
                                                        href={att.archivo_url || att.archivo}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        style={{ textDecoration: "none", color: "#0d6efd", fontWeight: 500 }}
                                                    >
                                                        {fileName}
                                                    </a>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
                                                        <span style={{
                                                            background: isPdf ? "#fee2e2" : "#f3e8ff",
                                                            color: isPdf ? "#b91c1c" : "#7c3aed",
                                                            borderRadius: 6,
                                                            fontSize: "0.8em",
                                                            fontWeight: 600,
                                                            padding: "2px 8px"
                                                        }}>
                                                            {ext}
                                                        </span>
                                                        {fileSizes[att.id_adjunto] && (
                                                            <span style={{
                                                                color: "#64748b",
                                                                fontSize: "0.8em",
                                                                fontWeight: 500
                                                            }}>
                                                                {fileSizes[att.id_adjunto]}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                <i className="bi bi-person-badge" style={{ fontSize: 20, color: "#6366f1" }} />
                                                <div>
                                                    <div style={{ fontWeight: 500 }}>{att.subido_por}</div>
                                                    <div style={{ fontSize: "0.85em", color: "#64748b" }}>Colaborador</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div>
                                                <div style={{ fontWeight: 500 }}>
                                                    {format(new Date(att.fecha_creacion), "d 'de' MMMM yyyy", { locale: es })}
                                                </div>
                                                <div style={{ fontSize: "0.85em", color: "#64748b" }}>
                                                    {format(new Date(att.fecha_creacion), "h:mm aaa", { locale: es })}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <a
                                                href={att.archivo_url || att.archivo}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="btn btn-primary"
                                                style={{
                                                    borderRadius: 8,
                                                    fontWeight: 600,
                                                    fontSize: "0.97em",
                                                    padding: "6px 18px",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 6
                                                }}
                                            >
                                                <i className="bi bi-download" /> Descargar
                                            </a>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}