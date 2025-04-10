import { useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import "../../styles/components/dashboard.css";
import { useSidebarStore } from "../../stores/sidebarStore";
import { SidebarLayout } from "../../components/layouts/SidebarLayout";
import { AnimatePresence, motion } from "framer-motion";
import { Dashboard } from "./Dashboard";

export function ReportScreen() {
    const sidebarWidthPx = useSidebarStore((state) => state.sidebarWidthPx);
    const [activeTab, setActiveTab] = useState<string>("general");
    const [searchParams, setSearchParams] = useSearchParams();
    const tabs = [
        { id: "general", label: "General", icon: "bi bi-file-bar-graph", component: <Dashboard /> },
        { id: "Reportes", label: "Reportes", icon: "bi bi-file-earmark-bar-graph", component: <div>Reportes</div> },
    ];
    const tabVariants = {
        hidden: { opacity: 0, x: -20 },
        visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
        exit: { opacity: 0, x: 20, transition: { duration: 0.2 } }
    };
    
    // collect active tab from URL search params
    useEffect(() => {
        const tabFromURL = searchParams.get("active_tab");
        if (tabFromURL) {
            setActiveTab(tabFromURL);
        }
    }, [searchParams]);
    
    return (
        <SidebarLayout sidebarWidthPx={sidebarWidthPx}>
            <h1 className="page-title" style={{ marginBottom: '0px' }}>
                Dashboard de Reportes
            </h1>
            <div className="report-tab-nav">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`report-tab-item ${activeTab === tab.id ? "active" : ""}`}
                        onClick={() => {
                            const newParams = new URLSearchParams(searchParams);
                            newParams.set("active_tab", tab.id);
                            setSearchParams(newParams);
                        }}
                    >
                        <i className={tab.icon}></i> {tab.label}
                    </button>
                ))}
            </div>
            <AnimatePresence mode="wait">
                {tabs.map(tab =>
                    tab.id === activeTab && (
                        <motion.div key={tab.id} variants={tabVariants} initial="hidden" animate="visible" exit="exit">
                            {tab.component}
                        </motion.div>
                    )
                )}
            </AnimatePresence>
            <div style={{ height: '25px' }}>
                <></>
            </div>
        </SidebarLayout>
    );
}
