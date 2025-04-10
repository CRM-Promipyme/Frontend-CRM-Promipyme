import { Route } from 'react-router-dom'
import { ReportScreen } from '../pages/reports/ReportScreen';
import { With404Fallback } from '../components/permissions/With404Fallback';
import { AdminRoutePermissions } from '../components/permissions/AdminRoutePermissions'


export function ReportRoutes() {
    const fallbackUrl = "/workflows/processes/menu";
    const privateReportRoutes = [
        {path: "/dashboard", comp: ReportScreen},
    ]

    return (
        <With404Fallback>
            {privateReportRoutes.map((route, index) => (
                <Route key={index} path={route.path} element={
                    <AdminRoutePermissions fallbackUrl={fallbackUrl}>
                        <route.comp />
                    </AdminRoutePermissions>
                } />
            ))}
        </With404Fallback>
    )
}
