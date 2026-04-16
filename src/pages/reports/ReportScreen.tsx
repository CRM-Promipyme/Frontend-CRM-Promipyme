import { useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
// import { CustomReport } from './CustomReport';
import "../../styles/components/dashboard.css";
import { useSidebarStore } from "../../stores/sidebarStore";
import { SidebarLayout } from "../../components/layouts/SidebarLayout";
import { AnimatePresence, motion } from "framer-motion";
import { Dashboard } from "./Dashboard";
import { DepartmentReport } from "./DepartmentReport";
import { IndividualUserReport } from "./IndividualUserReport";

export function ReportScreen() {
    const sidebarWidthPx = useSidebarStore((state) => state.sidebarWidthPx);
    const [activeTab, setActiveTab] = useState<string>("general");
    const [searchParams, setSearchParams] = useSearchParams();

    const [dateRange, setDateRange] = useState<string>("30d");
    const [dateStart, setDateStart] = useState<string>("");
    const [dateEnd, setDateEnd] = useState<string>("");
    
    // Dashboard filters (now functional)
    const [sucursal_id, setSucursal_id] = useState<number | undefined>(undefined);
    const [region, setRegion] = useState<string | undefined>(undefined);
    const [restructurado, setRestructurado] = useState<string | undefined>(undefined);
    
    const dateOptions = [
        '30 días', '1 semana', 'Rango Personalizado'
    ]

    const tabs = [
        { id: "general", label: "General", icon: "bi bi-file-bar-graph", component: <Dashboard dateStart={dateStart} dateEnd={dateEnd} sucursal_id={sucursal_id} region={region} restructurado={restructurado} /> },
        // { id: "Reportes", label: "Reportes", icon: "bi bi-file-earmark-bar-graph", component: <CustomReport dateStart={dateStart} dateEnd={dateEnd} /> },
        { id: "reporte-departamento", label: "Reporte por Departamento", icon: "bi bi-building", component: <DepartmentReport dateStart={dateStart} dateEnd={dateEnd} />},
        { id: "reporte-usuario", label: "Reporte de Usuario", icon: "bi bi-person-badge", component: <IndividualUserReport dateStart={dateStart} dateEnd={dateEnd} />}
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

            {/* FILTER PANEL - Sucursal, Region, Restructurado */}
            {activeTab === "general" && (
                <div style={{ marginTop: "20px", marginLeft: "25px", marginRight: "25px", display: "flex", gap: "20px", alignItems: "flex-end", flexWrap: "wrap", backgroundColor: "#f8f9fa", padding: "15px", borderRadius: "6px" }}>
                    <div style={{ flex: "0 1 auto" }}>
                        <label style={{ display: "block", marginBottom: "6px", fontWeight: 500, fontSize: "14px", color: "#495057" }}>
                            <i className="bi bi-building" style={{ marginRight: "6px" }}></i>Sucursal
                        </label>
                        <select
                            value={sucursal_id || ''}
                            onChange={(e) => setSucursal_id(e.target.value ? Number(e.target.value) : undefined)}
                            className="form-control"
                            style={{ fontSize: "14px", minWidth: "150px" }}
                        >
                            <option value="">Todas las Sucursales</option>
                            <option value="1">Bogotá Principal</option>
                            <option value="2">Cali</option>
                            <option value="3">Medellín</option>
                            <option value="4">Barranquilla</option>
                        </select>
                    </div>

                    <div style={{ flex: "0 1 auto" }}>
                        <label style={{ display: "block", marginBottom: "6px", fontWeight: 500, fontSize: "14px", color: "#495057" }}>
                            <i className="bi bi-compass" style={{ marginRight: "6px" }}></i>Región
                        </label>
                        <select
                            value={region || ''}
                            onChange={(e) => setRegion(e.target.value || undefined)}
                            className="form-control"
                            style={{ fontSize: "14px", minWidth: "150px" }}
                        >
                            <option value="">Todas las Regiones</option>
                            <option value="Centro">Centro</option>
                            <option value="Este">Este</option>
                            <option value="Oeste">Oeste</option>
                            <option value="Pacifico">Pacifico</option>
                        </select>
                    </div>

                    <div style={{ flex: "0 1 auto" }}>
                        <label style={{ display: "block", marginBottom: "6px", fontWeight: 500, fontSize: "14px", color: "#495057" }}>
                            <i className="bi bi-arrow-repeat" style={{ marginRight: "6px" }}></i>Estado
                        </label>
                        <select
                            value={restructurado || ''}
                            onChange={(e) => setRestructurado(e.target.value || undefined)}
                            className="form-control"
                            style={{ fontSize: "14px", minWidth: "150px" }}
                        >
                            <option value="">Todos los Casos</option>
                            <option value="true">Restructurados</option>
                            <option value="false">No Restructurados</option>
                        </select>
                    </div>

                    <button
                        onClick={() => {
                            setSucursal_id(undefined);
                            setRegion(undefined);
                            setRestructurado(undefined);
                        }}
                        className="btn btn-outline-secondary"
                        style={{ fontSize: "14px", padding: "6px 12px" }}
                    >
                        <i className="bi bi-arrow-clockwise me-2"></i>Limpiar Filtros
                    </button>
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
