import { useState, useEffect, useRef } from "react";
import api from "../../../../../../controllers/api";
import authStore from "../../../../../../stores/authStore";
import { toast } from "react-toastify";
import axios from "axios";
import { se, tr } from "date-fns/locale";

const BASE_URL = import.meta.env.VITE_REACT_APP_DJANGO_API_URL;

interface NotesSectionProps {
    id: number;
}
interface Note {
    id_nota_caso: number,
    descripcion_nota: string,
    fecha_creacion: string,
    caso: number,
    creador_nota: number
}

interface NotesResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: Note[];
}

export function NotesSection({ id }: NotesSectionProps) {
    const [noteText, setNoteText] = useState<string>("");
    const [notes, setNotes] = useState<Note[]>([]);
    const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
    const [editedText, setEditedText] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [nextPage, setNextPage] = useState<string | null>(null);
    const notesContainerRef = useRef<HTMLDivElement>(null);
    const [loadingMore, setLoadingMore] = useState(false);

    const fetchNotes = async (url?: string) => {
        if (loadingMore && !url) return;
        
        setLoading(true);
        try {
            const endpoint = url || `${BASE_URL}/workflows/casos/manage/notes/list/${id}/`;
            const response = await api.get<NotesResponse>(endpoint);
            
            if (response.status === 200) {
                const data = response.data;
                setNotes(prev => url ? [...prev, ...data.results] : data.results);
                setNextPage(data.next);
            }
        } catch (error) {
            console.error("Error fetching notes:", error);
            toast.error("Error al cargar las notas");
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }

    const handleEditClick = (note: Note) => {
        setEditingNoteId(note.id_nota_caso);
        setEditedText(note.descripcion_nota);
    };

    const handleEditSave = async (noteId: number) => {
        if (editedText.trim() === "") {
            toast.error("La nota no puede estar vacía");
            return;
        }

        const payload = {
            note_description: editedText.trim()
        };

        try {
            const response = await api.put(`${BASE_URL}/workflows/casos/manage/notes/${id}/?note_id=${noteId}`, payload);
            if (response.status === 200) {
                toast.success("¡Nota editada exitosamente!");
                setEditingNoteId(null);
                fetchNotes();
            }
        } catch (error) {
            console.error(error);
            toast.error("Error al editar la nota.");
        }
    };

    const handleEditCancel = () => {
        setEditingNoteId(null);
        setEditedText("");
    };

    useEffect(() => {
        fetchNotes();
    }, [id]);

    // Infinite scroll handler
    useEffect(() => {
        const container = notesContainerRef.current;
        if (!container) return;

        const handleScroll = () => {
            if (loading || loadingMore || !nextPage) return;

            const { scrollTop, scrollHeight, clientHeight } = container;
            if (scrollHeight - scrollTop <= clientHeight + 100) {
                setLoadingMore(true);
                fetchNotes(nextPage);
            }
        };

        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, [loading, loadingMore, nextPage]);

    const handleSubmit = async (e: React.FormEvent) =>{

        e.preventDefault();

        if (noteText.trim() === "") {
            toast.error("¡Por favor, escribe una nota antes de enviar!");
            return;
        }

        const payload = {
            note_description: noteText.trim(),
        }
        await api.post(`${BASE_URL}/workflows/casos/manage/notes/${id}/`, payload)
            .then((response) => {
                if (response.status === 201) {
                    toast.success("¡Nota enviada exitosamente!");
                    setNoteText("");
                }
            })
            .catch((error) => {
                console.error(error);
                toast.error("Error al enviar la nota.");
            });
    };
    
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('es-ES', { 
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    async function fetchMoreNotes(url: string) {
            try {
                const response = await api.get(url);
                return response.data;
            } catch (error) {
                console.error("Error fetching more cases:", error);
                return null;
            }
        }
    return (
        <div>
            <div className="case-item-container">
                <div className="case-item-header">
                    <i className="bi bi-chat-right-dots"></i>
                    <p>Notas y Comentarios</p>
                </div>
                <form onSubmit={handleSubmit} className="case-item-body">
                    <textarea
                        className="form-control"
                        onChange={(e) => setNoteText(e.target.value)}
                        value={noteText}
                        placeholder="Escribe una nota o comentario..."
                        style={{ 
                            marginBottom: '10px',
                            width: '100%' 
                        }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
                        <button 
                            type="submit"
                            className="btn btn-primary"
                        >
                            Enviar 
                        </button>
                    </div>
                </form>

                {/* Updated Notes Display Section */}
                <div 
                    ref={notesContainerRef}
                    className="notes" 
                    style={{ 
                        marginTop: '20px', 
                        overflowY: 'auto', 
                        maxHeight: '300px', 
                        marginBottom: '10%' 
                    }}
                >
                    {notes.map((note) => (
                        <div 
                            key={note.id_nota_caso} 
                            className="note-item"
                            style={{
                                padding: '10px',
                                borderBottom: '1px solid #eee',
                                marginBottom: '10px'
                            }}
                        >
                            <div style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center',
                                marginBottom: '5px' 
                            }}>
                                <strong>Usuario {note.creador_nota}</strong>
                                <div>
                                    <small className="text-muted me-2">
                                        {formatDate(note.fecha_creacion)}
                                    </small>
                                    {editingNoteId !== note.id_nota_caso && (
                                        <button 
                                            className="btn btn-outline-primary btn-sm"
                                            onClick={() => handleEditClick(note)}
                                        >
                                            <i className="bi bi-pencil"/>
                                        </button>
                                    )}
                                </div>
                            </div>
                            
                            {editingNoteId === note.id_nota_caso ? (
                                <div>
                                    <textarea
                                        className="form-control mb-2"
                                        value={editedText}
                                        onChange={(e) => setEditedText(e.target.value)}
                                        style={{ width: '100%' }}
                                    />
                                    <div className="d-flex justify-content-end gap-2">
                                        <button 
                                            className="btn btn-secondary btn-sm"
                                            onClick={handleEditCancel}
                                        >
                                            Cancelar
                                        </button>
                                        <button 
                                            className="btn btn-primary btn-sm"
                                            onClick={() => handleEditSave(note.id_nota_caso)}
                                        >
                                            Guardar
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <p style={{ margin: 0 }}>{note.descripcion_nota}</p>
                            )}
                        </div>
                    ))}
                    {loadingMore && (
                        <div className="text-center p-2">
                            <div className="spinner-border spinner-border-sm" role="status">
                                <span className="visually-hidden">Cargando...</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}