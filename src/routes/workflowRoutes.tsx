import { Route } from 'react-router-dom'
import { CreateCase } from '../pages/workflowPages/cases/CreateCase'
import { UpdateCase } from '../pages/workflowPages/cases/UpdateCase'
import { With404Fallback } from '../components/permissions/With404Fallback'
import { CreateWorkflow } from '../pages/workflowPages/processes/CreateWorkflow'
import { AdminRoutePermissions } from '../components/permissions/AdminRoutePermissions'
import { WorkflowSelectionMenu } from '../pages/workflowPages/processes/WorkflowSelectionMenu'
import { WorkflowBoardView } from '../pages/workflowPages/processes/boardView/WorkflowBoardView'
import { AuthenticatedRoutePermissions } from '../components/permissions/AuthenticatedRoutePermissions'

export function WorkflowRoutes() {
    const publicWorkflowRoutes = [
        {path: "/processes/menu", comp: WorkflowSelectionMenu},
        {path: "/board-view/:workflowId", comp: WorkflowBoardView},
    ]

    const authFallback = "/auth/login";
    const fallbackUrl = "/workflows/processes/menu";
    const privateWorkflowRoutes = [
        {
            path: "/processes/create",
            comp: CreateWorkflow,
            requiredBasePermissions: []
        },
        {
            path: "/cases/create/:workflowId",
            comp: CreateCase,
            requiredBasePermissions: []
        },
        {
            path: "/cases/update/:caseId",
            comp: UpdateCase,
            requiredBasePermissions: []
        },
    ]

    return (
        <With404Fallback>
            {publicWorkflowRoutes.map((route, index) => (
                <Route key={index} path={route.path} element={
                    <AuthenticatedRoutePermissions fallbackUrl={authFallback}>
                        <route.comp />
                    </AuthenticatedRoutePermissions>
                } />
            ))}
            
            {privateWorkflowRoutes.map((route, index) => (
                <Route key={index} path={route.path} element={
                    <AdminRoutePermissions fallbackUrl={fallbackUrl} requiredBasePermissions={route.requiredBasePermissions}>
                        <route.comp />
                    </AdminRoutePermissions>
                } />
            ))}
        </With404Fallback>
    )
}
