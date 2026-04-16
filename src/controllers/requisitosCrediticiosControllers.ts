import api from './api';
import { Requisito } from '../types/workflowTypes';

/**
 * Fetch all requisitos for a specific producto
 */
export const fetchProductoRequisitos = async (
    fondoId: number,
    productoId: number
): Promise<Requisito[]> => {
    try {
        const response = await api.get(
            `/workflows/fondos-crediticios/${fondoId}/productos/${productoId}/requisitos/list/`
        );
        return response.data || [];
    } catch (error) {
        console.error('Error fetching requisitos:', error);
        throw error;
    }
};

/**
 * Create a new requisito for a producto
 */
export const createRequisito = async (
    fondoId: number,
    productoId: number,
    data: {
        nombre_requisito: string;
        descripcion?: string;
        es_obligatorio: boolean;
        categoria?: string;
        orden: number;
    }
): Promise<Requisito> => {
    try {
        const response = await api.post(
            `/workflows/fondos-crediticios/${fondoId}/productos/${productoId}/requisitos/manage/`,
            data
        );
        return response.data.requisito || response.data;
    } catch (error) {
        console.error('Error creating requisito:', error);
        throw error;
    }
};

/**
 * Update an existing requisito
 */
export const updateRequisito = async (
    fondoId: number,
    productoId: number,
    requisitoId: number,
    data: {
        nombre_requisito?: string;
        descripcion?: string;
        es_obligatorio?: boolean;
        categoria?: string;
        orden?: number;
    }
): Promise<Requisito> => {
    try {
        const response = await api.put(
            `/workflows/fondos-crediticios/${fondoId}/productos/${productoId}/requisitos/manage/${requisitoId}/`,
            data
        );
        return response.data.requisito || response.data;
    } catch (error) {
        console.error('Error updating requisito:', error);
        throw error;
    }
};

/**
 * Delete a requisito
 */
export const deleteRequisito = async (
    fondoId: number,
    productoId: number,
    requisitoId: number
): Promise<void> => {
    try {
        await api.delete(
            `/workflows/fondos-crediticios/${fondoId}/productos/${productoId}/requisitos/manage/${requisitoId}/`
        );
    } catch (error) {
        console.error('Error deleting requisito:', error);
        throw error;
    }
};
