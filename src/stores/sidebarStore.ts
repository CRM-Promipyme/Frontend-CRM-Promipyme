import { create } from "zustand";

interface SidebarState {
    sidebarWidthPx: string;
    collapsed: boolean;
    toggleSidebar: () => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
    sidebarWidthPx: "260px",
    collapsed: false,
    
    toggleSidebar: () => set((state: SidebarState) => ({
        collapsed: !state.collapsed,
        sidebarWidthPx: state.collapsed ? "260px" : "60px",
    })),
}));
