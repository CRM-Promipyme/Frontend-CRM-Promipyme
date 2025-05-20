import { useAuthStore } from '../stores/authStore';
import { Route } from 'react-router-dom'
import { ReportScreen } from '../pages/reports/ReportScreen';
import { With404Fallback } from '../components/permissions/With404Fallback';
import { AdminRoutePermissions } from '../components/permissions/AdminRoutePermissions'


export function ReportRoutes() {
    const authStore = useAuthStore();
    const userId = authStore.userId;
    const fallbackUrl = `/auth/user/profile/${userId}`;
    const privateReportRoutes = [
        {
            path: "/dashboard",
            comp: ReportScreen,
            requiredBasePermissions: ["visualize_reports"]
        },
    ]

    return (
        <With404Fallback>
            {privateReportRoutes.map((route, index) => (
                <Route key={index} path={route.path} element={
                    <AdminRoutePermissions fallbackUrl={fallbackUrl} requiredBasePermissions={route.requiredBasePermissions}>
                        <route.comp />
                    </AdminRoutePermissions>
                } />
            ))}
        </With404Fallback>
    )
}
