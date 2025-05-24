import { useEffect } from "react";

type Listener = (data: any) => void;

export class KanbanSocketService {
    private static instance: KanbanSocketService;
    private socket: WebSocket | null = null;
    private listeners: Listener[] = [];
    private connected = false;

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
        this.socket = new WebSocket("ws://localhost:8000/ws/case-notifications/");
        this.socket.onopen = () => {
            this.connected = true;
            // console.log("WebSocket connected");
        };
        this.socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.listeners.forEach(listener => listener(data));
            } catch (e) {
                // Ignore invalid messages
            }
        };
        this.socket.onclose = () => {
            this.connected = false;
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

export function useKanbanSocket(onMessage: (data: any) => void) {
    useEffect(() => {
        const service = KanbanSocketService.getInstance();
        const unsubscribe = service.subscribe(onMessage);
        return () => unsubscribe();
    }, [onMessage]);
}