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

    const [dateRange, setDateRange] = useState<string>("30d");
    const [dateStart, setDateStart] = useState<string>("");
    const [dateEnd, setDateEnd] = useState<string>("");
    const dateOptions = [
        '30 días', '1 semana', 'Rango Personalizado'
    ]

    const tabs = [
        { id: "general", label: "General", icon: "bi bi-file-bar-graph", component: <Dashboard dateStart={dateStart} dateEnd={dateEnd} /> },
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

        const dateRangeFromURL = searchParams.get("date_range");
        if (dateRangeFromURL) {
            setDateRange(dateRangeFromURL);
        } else {
            setDateRange("30 días");
        }
    }, [searchParams]);

    // Update dateStart and dateEnd whenever dateRange changes
    useEffect(() => {
        const today = new Date();

        if (dateRange === '30 días') {
            const thirtyDaysAgo = new Date(today);
            thirtyDaysAgo.setDate(today.getDate() - 30);
            setDateStart(thirtyDaysAgo.toISOString().split('T')[0]);
            setDateEnd(today.toISOString().split('T')[0]);
        } else if (dateRange === '1 semana') {
            const oneWeekAgo = new Date(today);
            oneWeekAgo.setDate(today.getDate() - 7);
            setDateStart(oneWeekAgo.toISOString().split('T')[0]);
            setDateEnd(today.toISOString().split('T')[0]);
        } else if (dateRange === 'Rango Personalizado') {
            // If user switches to custom range, don't set anything
            setDateStart("");
            setDateEnd("");
        }
    }, [dateRange]);
    
    return (
        <SidebarLayout sidebarWidthPx={sidebarWidthPx}>
            <h1 className="page-title" style={{ marginBottom: '0px' }}>
                Dashboard de Reportes
            </h1>
            <div className="nav-controls">
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
                {/* DATE RANGE SELECTOR */}
                <div className="report-tab-nav">
                    {dateOptions.map(option => (
                        <button
                            key={option}
                            className={`report-tab-item ${dateRange === option ? "active" : ""}`}
                            onClick={() => {
                                setDateRange(option);
                                const newParams = new URLSearchParams(searchParams);
                                newParams.set("date_range", option);
                                setSearchParams(newParams);
                            }}
                        >
                            {option}
                        </button>
                    ))}
                </div>
            </div>

            {/* Custom Date Range Selector */}
            {dateRange === 'Rango Personalizado' && (
                <div style={{ marginTop: "15px", marginLeft: "25px", display: "flex", gap: "10px", alignItems: "center" }}>
                    <div>
                        <label>Desde:</label>
                        <input
                            type="date"
                            value={dateStart}
                            onChange={(e) => setDateStart(e.target.value)}
                            className="form-control"
                        />
                    </div>
                    <div>
                        <label>Hasta:</label>
                        <input
                            type="date"
                            value={dateEnd}
                            onChange={(e) => setDateEnd(e.target.value)}
                            className="form-control"
                        />
                    </div>
                </div>
            )}

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
