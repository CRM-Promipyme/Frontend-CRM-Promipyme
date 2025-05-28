import { useEffect } from "react";

export interface SocketMessageData {
    message: string;
    process_id: number;
    from_stage_id: number;
    to_stage_id: number;
}

type Listener = (data: SocketMessageData) => void;

const API_SOCKET_URL = import.meta.env.VITE_REACT_APP_DJANGO_SOCKET_URL;

export class KanbanSocketService {
    private static instance: KanbanSocketService;
    private socket: WebSocket | null = null;
    private listeners: Listener[] = [];

    private constructor() {
        this.connect();
    }

    public static getInstance() {
        if (!KanbanSocketService.instance) {
            KanbanSocketService.instance = new KanbanSocketService();
        }
        return KanbanSocketService.instance;
    }

    private connect() {
        this.socket = new WebSocket(`${API_SOCKET_URL}/ws/case-notifications/`);
        this.socket.onopen = () => {
            console.log("WebSocket connected");
        };
        this.socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.listeners.forEach(listener => listener(data));
            } catch {
                // Ignore invalid messages
            }
        };
        this.socket.onclose = () => {
            // Optionally, implement reconnect logic here
        };
        this.socket.onerror = () => {
            // Optionally, handle errors
        };
    }

    public subscribe(listener: Listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }
}

export function useKanbanSocket(onMessage: (data: SocketMessageData) => void) {
    useEffect(() => {
        const service = KanbanSocketService.getInstance();
        const unsubscribe = service.subscribe(onMessage);
        return () => unsubscribe();
    }, [onMessage]);
}