import { Route, Routes } from 'react-router-dom'
import { Dashboard } from '../pages/reports/Dashboard';
import { AdminRoutePermissions } from '../components/permissions/AdminRoutePermissions'


export function ReportRoutes() {
    const fallbackUrl = "/workflows/processes/menu";
    const privateReportRoutes = [
        {path: "/reports/dashboard", comp:Dashboard},
    ]

    return (
        <Routes>
            {privateReportRoutes.map((route, index) => (
                <Route key={index} path={route.path} element={
                    <AdminRoutePermissions fallbackUrl={fallbackUrl}>
                        <route.comp />
                    </AdminRoutePermissions>
                } />
            ))}
        </Routes>
    )
}
