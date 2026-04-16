import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import api from '../../controllers/api';
import { Spinner } from '../../components/ui/Spinner';
import { SidebarLayout } from '../../components/layouts/SidebarLayout';
import { useSidebarStore } from '../../stores/sidebarStore';
import { Requisito } from '../../types/workflowTypes';
import {
    fetchProductoRequisitos,
    createRequisito,
    updateRequisito,
    deleteRequisito
} from '../../controllers/requisitosCrediticiosControllers';

interface Producto {
    id_producto: number;
    nombre_producto: string;
    fondo_crediticio: number;
    fondo_nombre: string;
}

interface Fondo {
    id_fondo: number;
    nombre_fondo: string;
    productos: Producto[];
}

export function FondosCrediticios() {
    const sidebarWidthPx = useSidebarStore((state) => state.sidebarWidthPx);
    
    const [fondos, setFondos] = useState<Fondo[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedFondoId, setSelectedFondoId] = useState<number | null>(null);
    const [selectedFondoName, setSelectedFondoName] = useState<string>('');
    const [selectedProductoId, setSelectedProductoId] = useState<number | null>(null);
    const [selectedProductoName, setSelectedProductoName] = useState<string>('');
    
    // Requisitos state
    const [requisitos, setRequisitos] = useState<Requisito[]>([]);
    const [loadingRequisitos, setLoadingRequisitos] = useState(false);
    
    // Form states
    const [showCreateFondoModal, setShowCreateFondoModal] = useState(false);
    const [showCreateProductoModal, setShowCreateProductoModal] = useState(false);
    const [showEditFondoModal, setShowEditFondoModal] = useState(false);
    const [showEditProductoModal, setShowEditProductoModal] = useState(false);
    const [showCreateRequisitoModal, setShowCreateRequisitoModal] = useState(false);
    const [showEditRequisitoModal, setShowEditRequisitoModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteType, setDeleteType] = useState<'fondo' | 'producto' | 'requisito' | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    
    const [fondoName, setFondoName] = useState('');
    const [editFondoName, setEditFondoName] = useState('');
    const [productoName, setProductoName] = useState('');
    const [editProductoName, setEditProductoName] = useState('');
    
    // Requisito form states
    const [nombreRequisito, setNombreRequisito] = useState('');
    const [descripcionRequisito, setDescripcionRequisito] = useState('');
    const [categoriaRequisito, setCategoriaRequisito] = useState('');
    const [ordenRequisito, setOrdenRequisito] = useState('0');
    const [esObligatorioRequisito, setEsObligatorioRequisito] = useState(true);
    const [editRequisitoId, setEditRequisitoId] = useState<number | null>(null);
    
    const [creating, setCreating] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        loadFondos();
    }, []);

    useEffect(() => {
        if (selectedProductoId && selectedFondoId) {
            loadRequisitos();
        } else {
            setRequisitos([]);
        }
    }, [selectedProductoId, selectedFondoId]);

    const loadFondos = async () => {
        try {
            setLoading(true);
            const response = await api.get('/workflows/fondos-crediticios/list/');
            setFondos(response.data || []);
        } catch (error) {
            console.error('Error loading fondos:', error);
            toast.error('Error al cargar los fondos crediticios');
        } finally {
            setLoading(false);
        }
    };

    const loadRequisitos = async () => {
        if (!selectedFondoId || !selectedProductoId) return;
        
        try {
            setLoadingRequisitos(true);
            const data = await fetchProductoRequisitos(selectedFondoId, selectedProductoId);
            setRequisitos(data || []);
        } catch (error) {
            console.error('Error loading requisitos:', error);
            toast.error('Error al cargar los requisitos');
        } finally {
            setLoadingRequisitos(false);
        }
    };

    const handleCreateFondo = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fondoName.trim()) {
            toast.error('El nombre del fondo es requerido');
            return;
        }

        try {
            setCreating(true);
            await api.post('/workflows/fondos-crediticios/manage/', {
                nombre_fondo: fondoName.trim()
            });
            toast.success('Fondo crediticio creado exitosamente');
            setFondoName('');
            setShowCreateFondoModal(false);
            loadFondos();
        } catch (error: any) {
            console.error('Error creating fondo:', error);
            toast.error(error.response?.data?.message || 'Error al crear el fondo');
        } finally {
            setCreating(false);
        }
    };

    const handleUpdateFondo = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFondoId || !editFondoName.trim()) {
            toast.error('El nombre del fondo es requerido');
            return;
        }

        try {
            setCreating(true);
            await api.put(`/workflows/fondos-crediticios/manage/${selectedFondoId}/`, {
                nombre_fondo: editFondoName.trim()
            });
            toast.success('Fondo crediticio actualizado exitosamente');
            setShowEditFondoModal(false);
            setEditFondoName('');
            loadFondos();
        } catch (error: any) {
            console.error('Error updating fondo:', error);
            toast.error(error.response?.data?.message || 'Error al actualizar el fondo');
        } finally {
            setCreating(false);
        }
    };

    const handleCreateProducto = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFondoId || !productoName.trim()) {
            toast.error('El nombre del producto es requerido');
            return;
        }

        try {
            setCreating(true);
            await api.post(`/workflows/fondos-crediticios/${selectedFondoId}/productos/manage/`, {
                nombre_producto: productoName.trim()
            });
            toast.success('Producto crediticio creado exitosamente');
            setProductoName('');
            setShowCreateProductoModal(false);
            loadFondos();
        } catch (error: any) {
            console.error('Error creating producto:', error);
            toast.error(error.response?.data?.message || 'Error al crear el producto');
        } finally {
            setCreating(false);
        }
    };

    const handleUpdateProducto = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFondoId || !selectedProductoId || !editProductoName.trim()) {
            toast.error('El nombre del producto es requerido');
            return;
        }

        try {
            setCreating(true);
            await api.put(
                `/workflows/fondos-crediticios/${selectedFondoId}/productos/manage/${selectedProductoId}/`,
                { nombre_producto: editProductoName.trim() }
            );
            toast.success('Producto crediticio actualizado exitosamente');
            setShowEditProductoModal(false);
            setEditProductoName('');
            loadFondos();
        } catch (error: any) {
            console.error('Error updating producto:', error);
            toast.error(error.response?.data?.message || 'Error al actualizar el producto');
        } finally {
            setCreating(false);
        }
    };

    const handleCreateRequisito = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFondoId || !selectedProductoId || !nombreRequisito.trim()) {
            toast.error('El nombre del requisito es requerido');
            return;
        }

        try {
            setCreating(true);
            await createRequisito(selectedFondoId, selectedProductoId, {
                nombre_requisito: nombreRequisito.trim(),
                descripcion: descripcionRequisito.trim() || undefined,
                es_obligatorio: esObligatorioRequisito,
                categoria: categoriaRequisito.trim() || undefined,
                orden: parseInt(ordenRequisito) || 0
            });
            toast.success('Requisito creado exitosamente');
            resetRequisitoForm();
            setShowCreateRequisitoModal(false);
            loadRequisitos();
        } catch (error: any) {
            console.error('Error creating requisito:', error);
            toast.error(error.response?.data?.message || 'Error al crear el requisito');
        } finally {
            setCreating(false);
        }
    };

    const handleUpdateRequisito = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFondoId || !selectedProductoId || !editRequisitoId || !nombreRequisito.trim()) {
            toast.error('El nombre del requisito es requerido');
            return;
        }

        try {
            setCreating(true);
            await updateRequisito(selectedFondoId, selectedProductoId, editRequisitoId, {
                nombre_requisito: nombreRequisito.trim(),
                descripcion: descripcionRequisito.trim() || undefined,
                es_obligatorio: esObligatorioRequisito,
                categoria: categoriaRequisito.trim() || undefined,
                orden: parseInt(ordenRequisito) || 0
            });
            toast.success('Requisito actualizado exitosamente');
            resetRequisitoForm();
            setShowEditRequisitoModal(false);
            loadRequisitos();
        } catch (error: any) {
            console.error('Error updating requisito:', error);
            toast.error(error.response?.data?.message || 'Error al actualizar el requisito');
        } finally {
            setCreating(false);
        }
    };

    const resetRequisitoForm = () => {
        setNombreRequisito('');
        setDescripcionRequisito('');
        setCategoriaRequisito('');
        setOrdenRequisito('0');
        setEsObligatorioRequisito(true);
        setEditRequisitoId(null);
    };

    const handleDeleteFondo = async (fondoId: number) => {
        setDeleteType('fondo');
        setDeleteId(fondoId);
        setShowDeleteConfirm(true);
    };

    const handleDeleteProducto = async (productoId: number) => {
        setDeleteType('producto');
        setDeleteId(productoId);
        setShowDeleteConfirm(true);
    };

    const handleDeleteRequisito = async (requisitoId: number) => {
        setDeleteType('requisito');
        setDeleteId(requisitoId);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        if (!deleteId || !deleteType) return;

        try {
            setDeleting(true);
            if (deleteType === 'fondo') {
                await api.delete(`/workflows/fondos-crediticios/manage/${deleteId}/`);
                toast.success('Fondo crediticio eliminado exitosamente');
                setSelectedFondoId(null);
            } else if (deleteType === 'producto') {
                await api.delete(
                    `/workflows/fondos-crediticios/${selectedFondoId}/productos/manage/${deleteId}/`
                );
                toast.success('Producto crediticio eliminado exitosamente');
                setSelectedProductoId(null);
            } else {
                await deleteRequisito(selectedFondoId!, selectedProductoId!, deleteId);
                toast.success('Requisito eliminado exitosamente');
            }
            setShowDeleteConfirm(false);
            setDeleteType(null);
            setDeleteId(null);
            loadFondos();
            if (deleteType !== 'fondo' && deleteType !== 'producto') {
                loadRequisitos();
            }
        } catch (error: any) {
            console.error('Error deleting:', error);
            toast.error(error.response?.data?.message || 'Error al eliminar');
        } finally {
            setDeleting(false);
        }
    };

    const selectedFondo = fondos.find(f => f.id_fondo === selectedFondoId);

    // Group requisitos by category
    const requisitosByCategory = requisitos.reduce((acc, req) => {
        const cat = req.categoria || 'Sin Categoría';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(req);
        return acc;
    }, {} as Record<string, Requisito[]>);

    const sortedCategories = Object.keys(requisitosByCategory).sort();

    return (
        <SidebarLayout sidebarWidthPx={sidebarWidthPx}>
            <div style={{ padding: '2rem' }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    {/* Header */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '2rem'
                    }}>
                        <div>
                            <h1 style={{ margin: 0, marginBottom: '0.5rem' }}>Fondos Crediticios</h1>
                            <p style={{ color: '#6c757d', margin: 0 }}>Gestionar fondos, productos y requisitos</p>
                        </div>
                        <motion.button
                            className="btn btn-primary"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowCreateFondoModal(true)}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            <i className="bi bi-plus-lg"></i>
                            Nuevo Fondo
                        </motion.button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr', gap: '2rem' }}>
                        {/* Fondos List */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: 0.1 }}
                            style={{
                                background: '#fff',
                                borderRadius: '12px',
                                padding: '1.5rem',
                                border: '1px solid #e9ecef',
                                height: 'fit-content'
                            }}
                        >
                            <h5 style={{ marginBottom: '1rem', fontWeight: 600 }}>Fondos Disponibles</h5>
                            {loading ? (
                                <div style={{ textAlign: 'center', padding: '2rem' }}>
                                    <Spinner />
                                </div>
                            ) : fondos.length === 0 ? (
                                <div style={{ textAlign: 'center', color: '#6c757d', padding: '2rem 0' }}>
                                    <i className="bi bi-inbox" style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'block' }}></i>
                                    <p>No hay fondos crediticios aún</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {fondos.map((fondo) => (
                                        <motion.div
                                            key={fondo.id_fondo}
                                            whileHover={{ backgroundColor: '#f8f9fa' }}
                                            onClick={() => {
                                                setSelectedFondoId(fondo.id_fondo);
                                                setSelectedFondoName(fondo.nombre_fondo);
                                                setSelectedProductoId(null);
                                            }}
                                            style={{
                                                padding: '1rem',
                                                borderRadius: '8px',
                                                border: selectedFondoId === fondo.id_fondo ? '2px solid #0d6efd' : '1px solid #dee2e6',
                                                cursor: 'pointer',
                                                background: selectedFondoId === fondo.id_fondo ? '#e7f1ff' : '#fff',
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <h6 style={{ margin: 0, marginBottom: '4px', fontWeight: 600 }}>
                                                        {fondo.nombre_fondo}
                                                    </h6>
                                                    <span style={{ fontSize: '0.85rem', color: '#6c757d' }}>
                                                        {fondo.productos.length} producto{fondo.productos.length !== 1 ? 's' : ''}
                                                    </span>
                                                </div>
                                                <i className="bi bi-chevron-right" style={{ color: '#6c757d' }}></i>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </motion.div>

                        {/* Productos List */}
                        {selectedFondoId ? (
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3, delay: 0.15 }}
                                style={{
                                    background: '#fff',
                                    borderRadius: '12px',
                                    padding: '1.5rem',
                                    border: '1px solid #e9ecef',
                                    height: 'fit-content'
                                }}
                            >
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '1rem'
                                }}>
                                    <h5 style={{ margin: 0, fontWeight: 600, fontSize: '0.95rem' }}>Productos</h5>
                                    <motion.button
                                        className="btn btn-sm btn-success"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setShowCreateProductoModal(true)}
                                        style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px' }}
                                    >
                                        <i className="bi bi-plus-lg"></i>
                                        Nuevo
                                    </motion.button>
                                </div>

                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '1rem',
                                    padding: '0.75rem',
                                    background: '#f8f9fa',
                                    borderRadius: '6px'
                                }}>
                                    <div>
                                        <h6 style={{ margin: 0, marginBottom: '2px', fontWeight: 600, fontSize: '0.9rem' }}>
                                            {selectedFondoName}
                                        </h6>
                                    </div>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        <motion.button
                                            className="btn btn-sm btn-outline-primary"
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => {
                                                setEditFondoName(selectedFondoName);
                                                setShowEditFondoModal(true);
                                            }}
                                            style={{ padding: '4px 8px' }}
                                        >
                                            <i className="bi bi-pencil"></i>
                                        </motion.button>
                                        <motion.button
                                            className="btn btn-sm btn-outline-danger"
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => handleDeleteFondo(selectedFondoId)}
                                            style={{ padding: '4px 8px' }}
                                        >
                                            <i className="bi bi-trash"></i>
                                        </motion.button>
                                    </div>
                                </div>

                                {selectedFondo && selectedFondo.productos.length === 0 ? (
                                    <div style={{
                                        textAlign: 'center',
                                        padding: '2rem 1rem',
                                        color: '#6c757d',
                                        background: '#f8f9fa',
                                        borderRadius: '8px'
                                    }}>
                                        <i className="bi bi-box" style={{ fontSize: '1.5rem', marginBottom: '0.5rem', display: 'block' }}></i>
                                        <p style={{ fontSize: '0.9rem' }}>No hay productos</p>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {selectedFondo?.productos.map((producto) => (
                                            <motion.div
                                                key={producto.id_producto}
                                                whileHover={{ backgroundColor: '#f8f9fa' }}
                                                onClick={() => {
                                                    setSelectedProductoId(producto.id_producto);
                                                    setSelectedProductoName(producto.nombre_producto);
                                                }}
                                                style={{
                                                    padding: '0.75rem',
                                                    borderRadius: '6px',
                                                    border: selectedProductoId === producto.id_producto ? '2px solid #28a745' : '1px solid #dee2e6',
                                                    background: selectedProductoId === producto.id_producto ? '#d4edda' : '#fff',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s ease'
                                                }}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <div>
                                                        <h6 style={{ margin: 0, marginBottom: '2px', fontWeight: 600, fontSize: '0.9rem' }}>
                                                            {producto.nombre_producto}
                                                        </h6>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '6px' }}>
                                                        <motion.button
                                                            className="btn btn-sm btn-outline-primary"
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedProductoId(producto.id_producto);
                                                                setSelectedProductoName(producto.nombre_producto);
                                                                setEditProductoName(producto.nombre_producto);
                                                                setShowEditProductoModal(true);
                                                            }}
                                                            style={{ padding: '4px 8px' }}
                                                        >
                                                            <i className="bi bi-pencil"></i>
                                                        </motion.button>
                                                        <motion.button
                                                            className="btn btn-sm btn-outline-danger"
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteProducto(producto.id_producto);
                                                            }}
                                                            style={{ padding: '4px 8px' }}
                                                        >
                                                            <i className="bi bi-trash"></i>
                                                        </motion.button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        ) : null}

                        {/* Requisitos Section */}
                        {selectedProductoId ? (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3, delay: 0.2 }}
                                style={{
                                    background: '#fff',
                                    borderRadius: '12px',
                                    padding: '1.5rem',
                                    border: '1px solid #e9ecef'
                                }}
                            >
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '1.5rem'
                                }}>
                                    <h5 style={{ margin: 0, fontWeight: 600 }}>Requisitos</h5>
                                    <motion.button
                                        className="btn btn-sm btn-info"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => {
                                            resetRequisitoForm();
                                            setShowCreateRequisitoModal(true);
                                        }}
                                        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                                    >
                                        <i className="bi bi-plus-lg"></i>
                                        Agregar
                                    </motion.button>
                                </div>

                                <div style={{
                                    padding: '0.75rem',
                                    background: '#f8f9fa',
                                    borderRadius: '6px',
                                    marginBottom: '1.5rem',
                                    fontSize: '0.9rem'
                                }}>
                                    <strong>{selectedProductoName}</strong>
                                </div>

                                {loadingRequisitos ? (
                                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                                        <Spinner />
                                    </div>
                                ) : requisitos.length === 0 ? (
                                    <div style={{
                                        textAlign: 'center',
                                        padding: '2rem 1rem',
                                        color: '#6c757d',
                                        background: '#f8f9fa',
                                        borderRadius: '8px'
                                    }}>
                                        <i className="bi bi-checklist" style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'block' }}></i>
                                        <p>Sin requisitos aún</p>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {sortedCategories.map((category) => (
                                            <div key={category}>
                                                <h6 style={{
                                                    margin: '0 0 0.75rem 0',
                                                    fontWeight: 600,
                                                    fontSize: '0.85rem',
                                                    color: '#495057',
                                                    textTransform: 'uppercase'
                                                }}>
                                                    {category}
                                                </h6>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginLeft: '0.5rem' }}>
                                                    {requisitosByCategory[category]
                                                        .sort((a, b) => a.orden - b.orden)
                                                        .map((requisito) => (
                                                        <motion.div
                                                            key={requisito.id_requisito}
                                                            initial={{ opacity: 0, y: -10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            exit={{ opacity: 0, y: -10 }}
                                                            whileHover={{ backgroundColor: '#f8f9fa' }}
                                                            style={{
                                                                padding: '0.75rem',
                                                                borderRadius: '6px',
                                                                border: '1px solid #dee2e6',
                                                                background: '#fff',
                                                                transition: 'all 0.2s ease',
                                                                display: 'flex',
                                                                justifyContent: 'space-between',
                                                                alignItems: 'flex-start'
                                                            }}
                                                        >
                                                            <div style={{ flex: 1 }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                                                    <h6 style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem' }}>
                                                                        {requisito.nombre_requisito}
                                                                    </h6>
                                                                    <span style={{
                                                                        fontSize: '0.75rem',
                                                                        padding: '2px 6px',
                                                                        borderRadius: '4px',
                                                                        background: requisito.es_obligatorio ? '#dc3545' : '#ffc107',
                                                                        color: requisito.es_obligatorio ? '#fff' : '#000',
                                                                        fontWeight: 600
                                                                    }}>
                                                                        {requisito.es_obligatorio ? 'Obligatorio' : 'Opcional'}
                                                                    </span>
                                                                </div>
                                                                {requisito.descripcion && (
                                                                    <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#6c757d' }}>
                                                                        {requisito.descripcion}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <div style={{ display: 'flex', gap: '6px', marginLeft: '8px' }}>
                                                                <motion.button
                                                                    className="btn btn-sm btn-outline-primary"
                                                                    whileHover={{ scale: 1.05 }}
                                                                    whileTap={{ scale: 0.95 }}
                                                                    onClick={() => {
                                                                        setNombreRequisito(requisito.nombre_requisito);
                                                                        setDescripcionRequisito(requisito.descripcion || '');
                                                                        setCategoriaRequisito(requisito.categoria || '');
                                                                        setOrdenRequisito(requisito.orden.toString());
                                                                        setEsObligatorioRequisito(requisito.es_obligatorio);
                                                                        setEditRequisitoId(requisito.id_requisito);
                                                                        setShowEditRequisitoModal(true);
                                                                    }}
                                                                    style={{ padding: '4px 8px' }}
                                                                >
                                                                    <i className="bi bi-pencil"></i>
                                                                </motion.button>
                                                                <motion.button
                                                                    className="btn btn-sm btn-outline-danger"
                                                                    whileHover={{ scale: 1.05 }}
                                                                    whileTap={{ scale: 0.95 }}
                                                                    onClick={() => handleDeleteRequisito(requisito.id_requisito)}
                                                                    style={{ padding: '4px 8px' }}
                                                                >
                                                                    <i className="bi bi-trash"></i>
                                                                </motion.button>
                                                            </div>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.3, delay: 0.2 }}
                                style={{
                                    background: '#f8f9fa',
                                    borderRadius: '12px',
                                    padding: '3rem',
                                    border: '1px dashed #dee2e6',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    textAlign: 'center',
                                    color: '#6c757d'
                                }}
                            >
                                <div>
                                    <i className="bi bi-hand-index" style={{ fontSize: '3rem', marginBottom: '1rem', display: 'block' }}></i>
                                    <p>Selecciona un producto para gestionar sus requisitos</p>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Modals */}
            <AnimatePresence>
                {/* Create Fondo Modal */}
                {showCreateFondoModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowCreateFondoModal(false)}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(0,0,0,0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1000
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                background: '#fff',
                                borderRadius: '12px',
                                padding: '2rem',
                                maxWidth: '500px',
                                width: '90%'
                            }}
                        >
                            <h5 style={{ marginBottom: '1.5rem', fontWeight: 600 }}>Nuevo Fondo Crediticio</h5>
                            <form onSubmit={handleCreateFondo}>
                                <div className="mb-3">
                                    <label htmlFor="fondoName" className="form-label">Nombre del Fondo</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="fondoName"
                                        value={fondoName}
                                        onChange={(e) => setFondoName(e.target.value)}
                                        placeholder="Ej: Fondo de Microfinanzas"
                                        disabled={creating}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => {
                                            setShowCreateFondoModal(false);
                                            setFondoName('');
                                        }}
                                        disabled={creating}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={creating || !fondoName.trim()}
                                    >
                                        {creating ? <Spinner /> : 'Crear'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}

                {/* Edit Fondo Modal */}
                {showEditFondoModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowEditFondoModal(false)}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(0,0,0,0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1000
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                background: '#fff',
                                borderRadius: '12px',
                                padding: '2rem',
                                maxWidth: '500px',
                                width: '90%'
                            }}
                        >
                            <h5 style={{ marginBottom: '1.5rem', fontWeight: 600 }}>Editar Fondo Crediticio</h5>
                            <form onSubmit={handleUpdateFondo}>
                                <div className="mb-3">
                                    <label htmlFor="editFondoName" className="form-label">Nombre del Fondo</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="editFondoName"
                                        value={editFondoName}
                                        onChange={(e) => setEditFondoName(e.target.value)}
                                        disabled={creating}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => setShowEditFondoModal(false)}
                                        disabled={creating}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={creating || !editFondoName.trim()}
                                    >
                                        {creating ? <Spinner /> : 'Actualizar'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}

                {/* Create Producto Modal */}
                {showCreateProductoModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowCreateProductoModal(false)}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(0,0,0,0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1000
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                background: '#fff',
                                borderRadius: '12px',
                                padding: '2rem',
                                maxWidth: '500px',
                                width: '90%'
                            }}
                        >
                            <h5 style={{ marginBottom: '1.5rem', fontWeight: 600 }}>Nuevo Producto en {selectedFondoName}</h5>
                            <form onSubmit={handleCreateProducto}>
                                <div className="mb-3">
                                    <label htmlFor="productoName" className="form-label">Nombre del Producto</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="productoName"
                                        value={productoName}
                                        onChange={(e) => setProductoName(e.target.value)}
                                        placeholder="Ej: Préstamo Rápido"
                                        disabled={creating}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => {
                                            setShowCreateProductoModal(false);
                                            setProductoName('');
                                        }}
                                        disabled={creating}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={creating || !productoName.trim()}
                                    >
                                        {creating ? <Spinner /> : 'Crear'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}

                {/* Edit Producto Modal */}
                {showEditProductoModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowEditProductoModal(false)}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(0,0,0,0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1000
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                background: '#fff',
                                borderRadius: '12px',
                                padding: '2rem',
                                maxWidth: '500px',
                                width: '90%'
                            }}
                        >
                            <h5 style={{ marginBottom: '1.5rem', fontWeight: 600 }}>Editar Producto</h5>
                            <form onSubmit={handleUpdateProducto}>
                                <div className="mb-3">
                                    <label htmlFor="editProductoName" className="form-label">Nombre del Producto</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="editProductoName"
                                        value={editProductoName}
                                        onChange={(e) => setEditProductoName(e.target.value)}
                                        disabled={creating}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => setShowEditProductoModal(false)}
                                        disabled={creating}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={creating || !editProductoName.trim()}
                                    >
                                        {creating ? <Spinner /> : 'Actualizar'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}

                {/* Create Requisito Modal */}
                {showCreateRequisitoModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowCreateRequisitoModal(false)}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(0,0,0,0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1000
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                background: '#fff',
                                borderRadius: '12px',
                                padding: '2rem',
                                maxWidth: '500px',
                                width: '90%',
                                maxHeight: '90vh',
                                overflowY: 'auto'
                            }}
                        >
                            <h5 style={{ marginBottom: '1.5rem', fontWeight: 600 }}>Nuevo Requisito</h5>
                            <form onSubmit={handleCreateRequisito}>
                                <div className="mb-3">
                                    <label htmlFor="nombreRequisito" className="form-label">Nombre del Requisito <span style={{ color: '#dc3545' }}>*</span></label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="nombreRequisito"
                                        value={nombreRequisito}
                                        onChange={(e) => setNombreRequisito(e.target.value)}
                                        placeholder="Ej: Cédula de identidad"
                                        disabled={creating}
                                    />
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="descripcionRequisito" className="form-label">Descripción</label>
                                    <textarea
                                        className="form-control"
                                        id="descripcionRequisito"
                                        value={descripcionRequisito}
                                        onChange={(e) => setDescripcionRequisito(e.target.value)}
                                        placeholder="Descripción del requisito"
                                        rows={3}
                                        disabled={creating}
                                    />
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="categoriaRequisito" className="form-label">Categoría</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="categoriaRequisito"
                                        value={categoriaRequisito}
                                        onChange={(e) => setCategoriaRequisito(e.target.value)}
                                        placeholder="Ej: Documentos, Garantías, Financiero"
                                        disabled={creating}
                                    />
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="ordenRequisito" className="form-label">Orden</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        id="ordenRequisito"
                                        value={ordenRequisito}
                                        onChange={(e) => setOrdenRequisito(e.target.value)}
                                        min="0"
                                        disabled={creating}
                                    />
                                </div>

                                <div className="mb-3">
                                    <div className="form-check">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            id="esObligatorioRequisito"
                                            checked={esObligatorioRequisito}
                                            onChange={(e) => setEsObligatorioRequisito(e.target.checked)}
                                            disabled={creating}
                                        />
                                        <label className="form-check-label" htmlFor="esObligatorioRequisito">
                                            Es Obligatorio
                                        </label>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => {
                                            setShowCreateRequisitoModal(false);
                                            resetRequisitoForm();
                                        }}
                                        disabled={creating}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={creating || !nombreRequisito.trim()}
                                    >
                                        {creating ? <Spinner /> : 'Crear'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}

                {/* Edit Requisito Modal */}
                {showEditRequisitoModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowEditRequisitoModal(false)}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(0,0,0,0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1000
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                background: '#fff',
                                borderRadius: '12px',
                                padding: '2rem',
                                maxWidth: '500px',
                                width: '90%',
                                maxHeight: '90vh',
                                overflowY: 'auto'
                            }}
                        >
                            <h5 style={{ marginBottom: '1.5rem', fontWeight: 600 }}>Editar Requisito</h5>
                            <form onSubmit={handleUpdateRequisito}>
                                <div className="mb-3">
                                    <label htmlFor="nombreRequisito" className="form-label">Nombre del Requisito <span style={{ color: '#dc3545' }}>*</span></label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="nombreRequisito"
                                        value={nombreRequisito}
                                        onChange={(e) => setNombreRequisito(e.target.value)}
                                        disabled={creating}
                                    />
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="descripcionRequisito" className="form-label">Descripción</label>
                                    <textarea
                                        className="form-control"
                                        id="descripcionRequisito"
                                        value={descripcionRequisito}
                                        onChange={(e) => setDescripcionRequisito(e.target.value)}
                                        rows={3}
                                        disabled={creating}
                                    />
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="categoriaRequisito" className="form-label">Categoría</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="categoriaRequisito"
                                        value={categoriaRequisito}
                                        onChange={(e) => setCategoriaRequisito(e.target.value)}
                                        disabled={creating}
                                    />
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="ordenRequisito" className="form-label">Orden</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        id="ordenRequisito"
                                        value={ordenRequisito}
                                        onChange={(e) => setOrdenRequisito(e.target.value)}
                                        min="0"
                                        disabled={creating}
                                    />
                                </div>

                                <div className="mb-3">
                                    <div className="form-check">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            id="esObligatorioRequisito"
                                            checked={esObligatorioRequisito}
                                            onChange={(e) => setEsObligatorioRequisito(e.target.checked)}
                                            disabled={creating}
                                        />
                                        <label className="form-check-label" htmlFor="esObligatorioRequisito">
                                            Es Obligatorio
                                        </label>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => {
                                            setShowEditRequisitoModal(false);
                                            resetRequisitoForm();
                                        }}
                                        disabled={creating}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={creating || !nombreRequisito.trim()}
                                    >
                                        {creating ? <Spinner /> : 'Actualizar'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}

                {/* Delete Confirmation Modal */}
                {showDeleteConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowDeleteConfirm(false)}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(0,0,0,0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1000
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                background: '#fff',
                                borderRadius: '12px',
                                padding: '2rem',
                                maxWidth: '400px',
                                width: '90%'
                            }}
                        >
                            <h5 style={{ marginBottom: '1rem', fontWeight: 600, color: '#dc3545' }}>Confirmar eliminación</h5>
                            <p style={{ marginBottom: '1.5rem', color: '#6c757d' }}>
                                {deleteType === 'fondo'
                                    ? '¿Estás seguro de que deseas eliminar este fondo crediticio? Esta acción no se puede deshacer.'
                                    : deleteType === 'producto'
                                    ? '¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.'
                                    : '¿Estás seguro de que deseas eliminar este requisito? Esta acción no se puede deshacer.'}
                            </p>
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => setShowDeleteConfirm(false)}
                                    disabled={deleting}
                                >
                                    Cancelar
                                </button>
                                <button
                                    className="btn btn-danger"
                                    onClick={confirmDelete}
                                    disabled={deleting}
                                >
                                    {deleting ? <Spinner /> : 'Eliminar'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </SidebarLayout>
    );
}
