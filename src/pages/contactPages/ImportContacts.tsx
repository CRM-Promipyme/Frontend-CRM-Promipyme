import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useSidebarStore } from '../../stores/sidebarStore';
import { useAuthStore } from '../../stores/authStore';
import { SidebarLayout } from '../../components/layouts/SidebarLayout';
import { Spinner } from '../../components/ui/Spinner';

interface ImportResult {
    total_rows: number;
    successful_imports: number;
    failed_imports: number;
    imported_contact_ids: number[];
    errors: Array<{
        row: number;
        error: string;
    }>;
}

export function ImportContacts() {
    const sidebarWidthPx = useSidebarStore((state) => state.sidebarWidthPx);
    const accessToken = useAuthStore((state) => state.accessToken);

    const [loading, setLoading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [importResult, setImportResult] = useState<ImportResult | null>(null);
    const [fileError, setFileError] = useState<string | null>(null);

    const BASE_URL = import.meta.env.VITE_VERCEL_REACT_APP_DJANGO_API_URL;

    const VALID_EXTENSIONS = ['.xlsx', '.xls', '.csv'];
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    function validateFile(file: File): boolean {
        setFileError(null);

        const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
        if (!VALID_EXTENSIONS.includes(extension)) {
            setFileError('Formato de archivo inválido. Por favor, usa Excel (.xlsx, .xls) o CSV (.csv).');
            return false;
        }

        if (file.size > MAX_FILE_SIZE) {
            setFileError('El archivo es demasiado grande. Máximo 10MB permitido.');
            return false;
        }

        if (file.size === 0) {
            setFileError('El archivo está vacío.');
            return false;
        }

        return true;
    }

    async function downloadTemplate() {
        if (!accessToken) {
            toast.error("Tu sesión ha caducado. Por favor, inicia sesión nuevamente.");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(
                `${BASE_URL}/contacts/bulk-import/`,
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Error al descargar la plantilla.');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'plantilla_importacion_contactos.xlsx';
            document.body.appendChild(link);
            link.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(link);
            
            toast.success('Plantilla de Excel descargada exitosamente.');
        } catch (error: any) {
            toast.error(error.message || 'Error al descargar la plantilla.');
        } finally {
            setLoading(false);
        }
    }

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file && validateFile(file)) {
            setSelectedFile(file);
        } else {
            setSelectedFile(null);
        }
    }

    async function handleImport(e?: React.FormEvent) {
        if (e) e.preventDefault();

        if (!accessToken) {
            toast.error("Tu sesión ha caducado. Por favor, inicia sesión nuevamente.");
            return;
        }

        if (!selectedFile) {
            toast.error("Por favor, selecciona un archivo para importar.");
            return;
        }

        setLoading(true);
        setImportResult(null);

        try {
            const formData = new FormData();
            formData.append('file', selectedFile);

            const response = await axios.post(
                `${BASE_URL}/contacts/bulk-import/`,
                formData,
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            const result = response.data as ImportResult;
            setImportResult(result);

            if (result.successful_imports > 0) {
                toast.success(
                    `¡Éxito! Se importaron ${result.successful_imports} contacto${result.successful_imports > 1 ? 's' : ''}.`
                );
                setSelectedFile(null);
                // Reset file input
                const fileInput = document.getElementById('fileInput') as HTMLInputElement;
                if (fileInput) fileInput.value = '';
            }

            if (result.failed_imports > 0) {
                toast.warning(
                    `${result.failed_imports} contacto${result.failed_imports > 1 ? 's' : ''} no se pudieron importar.`
                );
            }
        } catch (error: any) {
            const errorData = error.response?.data;
            const errorMessage = errorData?.error || error.message || 'Error al importar contactos.';
            toast.error(errorMessage);
            setImportResult(null);
        } finally {
            setLoading(false);
        }
    }

    return (
        <SidebarLayout sidebarWidthPx={sidebarWidthPx}>
            <h1 className="page-title" style={{ marginBottom: '0px' }}>Importar Contactos</h1>

            <div
                style={{
                    marginTop: '2rem',
                    background: '#fff',
                    borderRadius: '12px',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
                    padding: '2rem',
                    border: '1px solid #e5e7eb',
                    marginLeft: '25px',
                    marginRight: '25px'
                }}
            >
                <div style={{ marginBottom: '2rem' }}>
                    <h5 style={{ marginBottom: '1.5rem', fontWeight: 600 }}>
                        <i className="bi bi-download" style={{ marginRight: '0.5rem' }}></i>
                        Paso 1: Descargar Plantilla
                    </h5>
                    <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
                        Descarga una plantilla pre-formateada con todos los campos disponibles (campos base y personalizados).
                    </p>
                    <div
                        style={{
                            display: 'flex',
                            gap: '1rem',
                            flexWrap: 'wrap'
                        }}
                    >
                        <button
                            type="button"
                            className="btn btn-outline-primary"
                            onClick={() => downloadTemplate()}
                            disabled={loading}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            {loading ? (
                                <>
                                    <Spinner /> Descargando...
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-file-earmark-excel"></i>
                                    Descargar Plantilla Excel
                                </>
                            )}
                        </button>
                    </div>
                </div>

                <hr style={{ margin: '2rem 0', borderColor: '#e5e7eb' }} />

                <div style={{ marginBottom: '2rem' }}>
                    <h5 style={{ marginBottom: '1.5rem', fontWeight: 600 }}>
                        <i className="bi bi-pencil-square" style={{ marginRight: '0.5rem' }}></i>
                        Paso 2: Completar y Subir Plantilla
                    </h5>
                    <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
                        Abre la plantilla descargada, complétala con los datos de tus contactos y súbela aquí.
                    </p>

                    <div style={{ marginBottom: '2rem' }}>
                        <label
                            htmlFor="fileInput"
                            style={{
                                display: 'block',
                                marginBottom: '0.5rem',
                                fontWeight: 600,
                                color: '#2d3748'
                            }}
                        >
                            Selecciona tu archivo
                        </label>
                        <input
                            id="fileInput"
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            onChange={handleFileChange}
                            className="form-control"
                            style={{ padding: '0.75rem' }}
                            disabled={loading}
                        />
                        {fileError && (
                            <div
                                style={{
                                    marginTop: '0.5rem',
                                    color: '#dc2626',
                                    fontSize: '0.95rem'
                                }}
                            >
                                <i className="bi bi-exclamation-circle" style={{ marginRight: '0.5rem' }}></i>
                                {fileError}
                            </div>
                        )}
                        {selectedFile && !fileError && (
                            <div
                                style={{
                                    marginTop: '0.5rem',
                                    color: '#059669',
                                    fontSize: '0.95rem'
                                }}
                            >
                                <i className="bi bi-check-circle" style={{ marginRight: '0.5rem' }}></i>
                                Archivo seleccionado: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                            </div>
                        )}
                    </div>

                    <button
                        type="button"
                        className="btn btn-primary"
                        style={{ width: '100%', height: '45px' }}
                        onClick={handleImport}
                        disabled={loading || !selectedFile || fileError !== null}
                    >
                        {loading ? (
                            <>
                                <Spinner /> Importando...
                            </>
                        ) : (
                            <>
                                <i className="bi bi-upload" style={{ marginRight: '0.5rem' }}></i>
                                Importar Contactos
                            </>
                        )}
                    </button>
                </div>

                <div
                    style={{
                        padding: '1rem',
                        background: '#f3f4f6',
                        borderRadius: '8px',
                        borderLeft: '4px solid #0d6efd'
                    }}
                >
                    <h6 style={{ marginTop: 0, fontWeight: 600 }}>
                        <i className="bi bi-info-circle" style={{ marginRight: '0.5rem' }}></i>
                        Requisitos del Archivo
                    </h6>
                    <ul style={{ marginBottom: 0, paddingLeft: '1.5rem', color: '#4b5563' }}>
                        <li style={{ marginBottom: '0.5rem' }}>
                            <strong>Formato:</strong> Excel (.xlsx, .xls) o CSV (.csv)
                        </li>
                        <li style={{ marginBottom: '0.5rem' }}>
                            <strong>Columnas obligatorias:</strong> cedula, nombres, apellidos, email, fecha_nacimiento
                        </li>
                        <li style={{ marginBottom: '0.5rem' }}>
                            <strong>Formato de cédula:</strong> 11 dígitos (ej: 10123456789)
                        </li>
                        <li style={{ marginBottom: '0.5rem' }}>
                            <strong>Formato de fecha:</strong> YYYY-MM-DD (ej: 1990-05-15)
                        </li>
                        <li>
                            <strong>Tamaño máximo:</strong> 10 MB
                        </li>
                    </ul>
                </div>
            </div>

            {importResult && (
                <div
                    style={{
                        marginTop: '2rem',
                        background: '#fff',
                        borderRadius: '12px',
                        boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
                        padding: '2rem',
                        border: '1px solid #e5e7eb'
                    }}
                >
                    <div style={{ marginBottom: '2rem' }}>
                        <h5 style={{ marginBottom: '1.5rem', fontWeight: 600 }}>Resultado de la Importación</h5>

                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                                gap: '1rem',
                                marginBottom: '2rem'
                            }}
                        >
                            <div
                                style={{
                                    background: '#f3f4f6',
                                    padding: '1rem',
                                    borderRadius: '8px',
                                    textAlign: 'center'
                                }}
                            >
                                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1f2937' }}>
                                    {importResult.total_rows}
                                </div>
                                <div style={{ fontSize: '0.9rem', color: '#6b7280', marginTop: '0.25rem' }}>
                                    Total de Filas
                                </div>
                            </div>

                            <div
                                style={{
                                    background: '#dcfce7',
                                    padding: '1rem',
                                    borderRadius: '8px',
                                    textAlign: 'center'
                                }}
                            >
                                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#15803d' }}>
                                    {importResult.successful_imports}
                                </div>
                                <div style={{ fontSize: '0.9rem', color: '#166534', marginTop: '0.25rem' }}>
                                    Importados Exitosamente
                                </div>
                            </div>

                            {importResult.failed_imports > 0 && (
                                <div
                                    style={{
                                        background: '#fee2e2',
                                        padding: '1rem',
                                        borderRadius: '8px',
                                        textAlign: 'center'
                                    }}
                                >
                                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#b91c1c' }}>
                                        {importResult.failed_imports}
                                    </div>
                                    <div style={{ fontSize: '0.9rem', color: '#7f1d1d', marginTop: '0.25rem' }}>
                                        Fallos
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {importResult.failed_imports > 0 && importResult.errors.length > 0 && (
                        <div>
                            <h6 style={{ marginBottom: '1rem', fontWeight: 600, color: '#dc2626' }}>
                                <i className="bi bi-exclamation-triangle" style={{ marginRight: '0.5rem' }}></i>
                                Detalles de Errores
                            </h6>

                            <div style={{ overflowX: 'auto' }}>
                                <table className="table" style={{ minWidth: 500, marginBottom: 0 }}>
                                    <thead>
                                        <tr style={{ background: '#f8fafc' }}>
                                            <th style={{ fontWeight: 700, fontSize: '1rem' }}>Fila</th>
                                            <th style={{ fontWeight: 700, fontSize: '1rem' }}>Error</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {importResult.errors.map((err, idx) => (
                                            <tr
                                                key={idx}
                                                style={{
                                                    background: idx % 2 === 0 ? '#f9fafb' : '#fff',
                                                    verticalAlign: 'middle'
                                                }}
                                            >
                                                <td style={{ fontWeight: 600, color: '#6b7280' }}>
                                                    {err.row}
                                                </td>
                                                <td style={{ color: '#dc2626' }}>
                                                    {err.error}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {importResult.successful_imports > 0 && (
                        <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#f0fdf4', borderRadius: '8px' }}>
                            <p style={{ margin: 0, color: '#15803d' }}>
                                <i className="bi bi-check-circle" style={{ marginRight: '0.5rem' }}></i>
                                Se crearon {importResult.successful_imports} contacto{importResult.successful_imports > 1 ? 's' : ''} exitosamente.
                            </p>
                        </div>
                    )}
                </div>
            )}
        </SidebarLayout>
    );
}
