import { toast } from "react-toastify";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import "../../../../styles/workflows/workflowStyles.css";
import { Proceso } from "../../../../types/workflowTypes";
import { Spinner } from "../../../../components/ui/Spinner";
import { useSidebarStore } from "../../../../stores/sidebarStore";
import { WorkflowKanban } from "./tabs/kanbanBoard/WorkflowKanban";
import { RecentWorkflowActivity } from "./tabs/RecentWorkflowActivity";
import { SidebarLayout } from "../../../../components/layouts/SidebarLayout";
import { fetchSingleProcess } from "../../../../controllers/workflowControllers";


export function WorkflowBoardView() {
    // Global States
    const sidebarWidthPx = useSidebarStore((state) => state.sidebarWidthPx);
    
    // Local States
    const [loading, setLoading] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<string>("workflow-kanban-tab"); // Store active tab
    const [process, setProcess] = useState<Proceso>({} as Proceso);

    // Get workflow ID from route params
    const { workflowId } = useParams<{ workflowId: string }>();
    
    // Fetch process from the backend on component mount
    useEffect(() => {
        const loadProcess = async () => {
            try {
                if (workflowId) {
                    const data = await fetchSingleProcess(workflowId);

                    setProcess(data);
                    console.log(data);
                } else {
                    toast.error("Workflow ID is missing.");
                }
            } catch {
                toast.error("Ha ocurrido un error al cargar los procesos, por favor, intente más tarde...");
            } finally {
                setLoading(false);
            }
        };

        loadProcess();
    }, [workflowId]);

    // Animation Variants
    const tabVariants = {
        hidden: { opacity: 0, x: -20 },
        visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
        exit: { opacity: 0, x: 20, transition: { duration: 0.2 } }
    };

    // Loading Spinner
    if (loading) {
        return (
            <SidebarLayout sidebarWidthPx={sidebarWidthPx}>
                <Spinner className='spinner-border-lg'/>
            </SidebarLayout>
        );
    }

    // Tab Navigation Data
    const tabs = [
        { id: "workflow-kanban-tab", label: "Flujo de Trabajo", icon: "bi bi-kanban", component: <WorkflowKanban process={process} /> },
        { id: "case-list-tab", label: "Lista de Casos", icon: "bi bi-list-ul", component: <div><h2>Test tab</h2><p>This is just to view how the tab change would look</p></div> },
        { id: "activity-log-tab", label: "Actividad Reciente", icon: "bi bi-list-ul", component: <RecentWorkflowActivity process={process} /> },
        { id: "settings-tab", label: "Configuración", icon: "bi bi-gear", component: <div><h2>Test tab</h2><p>This is just to view how the tab change would look</p></div> }
    ];
    // TODO: FInish the rest of the tabs

    return (
        <SidebarLayout sidebarWidthPx={sidebarWidthPx}>
            <h1 className="page-title" style={{ marginBottom: '0px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <p className="text-muted" style={{ fontWeight: 450, fontSize: '1rem', marginBottom: '-10px' }}>Proceso</p>
                {process.nombre_proceso}
            </h1>

            {/* Tab Navigation (Loop through tabs) */}
            <nav className="tab-nav">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`tab-item ${activeTab === tab.id ? "active" : ""}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        <i className={tab.icon}></i> {tab.label}
                    </button>
                ))}
            </nav>

            {/* Animated Tab Content (Loop through tabs to render selected component) */}
            <div className="tab-content">
                <AnimatePresence mode="wait">
                    {tabs.map(tab =>
                        tab.id === activeTab && (
                            <motion.div key={tab.id} variants={tabVariants} initial="hidden" animate="visible" exit="exit">
                                {tab.component}
                            </motion.div>
                        )
                    )}
                </AnimatePresence>
            </div>
        </SidebarLayout>
    );
}
