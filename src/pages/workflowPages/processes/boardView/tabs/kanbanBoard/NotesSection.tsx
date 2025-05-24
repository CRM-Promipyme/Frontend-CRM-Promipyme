import { useState, useEffect, useRef } from "react";
import api from "../../../../../../controllers/api";
import {useAuthStore} from "../../../../../../stores/authStore";
import { toast } from "react-toastify";
import { PopupModal } from "../../../../../../components/ui/PopupModal";
import { motion } from "framer-motion";
import { pageVariants } from "../../../../../../utils/motionVariants";
import { Link } from "react-router-dom";


const BASE_URL = import.meta.env.VITE_REACT_APP_DJANGO_API_URL;

interface NotesSectionProps {
    id: number;
}
interface Note {
    id_nota_caso: number,
    descripcion_nota: string,
    fecha_creacion: string,
    caso: number,
    creador_nota: number,
    creador_first_name: string,
    creador_last_name: string,
}

interface NotesResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: Note[];
}

interface NoteToDelete {
    id: number;
    descripcion: string;
}

export function NotesSection({ id }: NotesSectionProps) {
    const authStore = useAuthStore();
    const userId = authStore.userId;
    const [noteText, setNoteText] = useState<string>("");
    const [showModal, setShowModal] = useState(false);
    const [notes, setNotes] = useState<Note[]>([]);
    const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
    const [editedText, setEditedText] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [nextPage, setNextPage] = useState<string | null>(null);
    const notesContainerRef = useRef<HTMLDivElement>(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const [noteToDelete, setNoteToDelete] = useState<NoteToDelete | null>(null);

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
            if (!container || loading || !nextPage) return;

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
        try {
            const response = await api.post(`${BASE_URL}/workflows/casos/manage/notes/${id}/`, payload)
                    if (response.status === 201) {
                        toast.success("¡Nota enviada exitosamente!");
                        setNoteText("");
                        fetchNotes();
                    }
                }
        catch(error){
                console.error(error);
                toast.error("Error al enviar la nota.");
        };
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
    const deleteNote = async (noteId: number) => {
        try {
            if (!authStore.isAdmin()) {
                toast.error("No tienes permisos para eliminar esta nota.");
                return;
            }
    
            const response = await api.delete(`${BASE_URL}/workflows/casos/manage/notes/${id}/?note_id=${noteId}`);
    
            if (response.status === 200) {
                // Refetch primero
                fetchNotes();
    
                // Luego cerrar modal y resetear estado
                setShowModal(false);
                setNoteToDelete(null);
    
                // Mostrar el toast
                toast.success("¡Nota eliminada exitosamente!");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error al eliminar la nota.");
        }
    };
    
    // Add this function to handle delete click
    const handleDeleteClick = (note: Note) => {
        setNoteToDelete({
            id: note.id_nota_caso,
            descripcion: note.descripcion_nota
        });
        setShowModal(true);
        fetchNotes();
    };

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
                    {noteText.length > 0 && (
                        <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
                            <button
                                type="submit"
                                className="btn btn-primary"
                            >
                                Enviar
                            </button>
                        </motion.div>
                    )}
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
                        <div key={note.id_nota_caso} className="note-item"
                            style={{
                                padding: '10px',
                                borderBottom: '1px solid #eee',
                                marginBottom: '10px'
                            }}
                        >
                            <div style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'baseline',
                                marginBottom: '5px' 
                            }}>
                                <div className="note-header">
                                    <strong>
                                        <Link
                                            to={`/auth/user/profile/${note.creador_nota}`}
                                            className="user-profile-url"
                                        >
                                            {`${note.creador_first_name} ${note.creador_last_name}`}
                                        </Link>
                                    </strong>
                                    <small className="text-muted me-2" style={{ marginTop: '0px'}}>
                                        {formatDate(note.fecha_creacion)}
                                    </small>
                                </div>
                                <div>
                                    {/* Only show edit button if the note creator matches current user */}
                                    {userId === note.creador_nota && editingNoteId !== note.id_nota_caso && (
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            className="btn btn-outline-primary btn-sm"
                                            onClick={() => handleEditClick(note)}
                                        >
                                            <i className="bi bi-pencil"/>
                                        </motion.button>
                                    )}
                                    {/* You might want to apply the same condition to delete button */}
                                    {authStore.isAdmin() && (
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            className="btn btn-outline-danger btn-sm" 
                                            style={{ marginLeft: '5px' }}
                                            onClick={() => handleDeleteClick(note)}
                                        >
                                            <i className="bi bi-trash"></i>
                                        </motion.button>
                                    )}
                                </div>
                            </div>
                            
                            {editingNoteId === note.id_nota_caso ? (
                                <motion.div
                                    variants={pageVariants}
                                >
                                    <textarea
                                        className="form-control mb-2"
                                        value={editedText}
                                        onChange={(e) => setEditedText(e.target.value)}
                                        style={{ width: '100%' }}
                                    />
                                    <motion.div className="d-flex justify-content-end gap-2" variants={pageVariants}>
                                        <motion.button 
                                            whileHover={{ scale: 1.1 }}
                                            className="btn btn-secondary btn-sm"
                                            onClick={handleEditCancel}
                                        >
                                            Cancelar
                                        </motion.button>
                                        <motion.button 
                                            whileHover={{ scale: 1.1 }}
                                            className="btn btn-primary btn-sm"
                                            onClick={() => handleEditSave(note.id_nota_caso)}
                                        >
                                            Guardar
                                        </motion.button>
                                    </motion.div>
                                </motion.div>
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

            {/* Add the PopupModal component at the end of your JSX */}
            {showModal && noteToDelete && (
                <PopupModal
                    show={showModal}
                    onClose={() => {
                        setShowModal(false);
                        setNoteToDelete(null);
                    }}
                >
                    <div>
                        <h5>Confirmar Eliminación</h5>
                        <p>¿Estás seguro de que deseas eliminar esta nota?</p>
                        <p className="text-muted" style={{ fontSize: '1em' }}>
                            "{noteToDelete.descripcion.slice(0, 50)}
                            {noteToDelete.descripcion.length > 50 ? '...' : ''}"
                        </p>
                        <div className="d-flex justify-content-end gap-2 mt-3">
                            <button 
                                className="btn btn-secondary"
                                onClick={() => {
                                    setShowModal(false);
                                    setNoteToDelete(null);
                                }}
                            >
                                Cancelar
                            </button>
                            <button 
                                className="btn btn-danger"
                                onClick={() => deleteNote(noteToDelete.id)}
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                </PopupModal>
            )}
        </div>
    );
}