import { Route, Routes } from 'react-router-dom'
import { WorkflowMenu } from '../pages/workflowPages/WorkflowMenu'
import { CreateWorkflow } from '../pages/workflowPages/processes/CreateWorkflow'
import { WorkflowBoardView } from '../pages/workflowPages/processes/WorkflowBoardView'
import { AdminRoutePermissions } from '../components/permissions/AdminRoutePermissions'
import { WorkflowSelectionMenu } from '../pages/workflowPages/processes/WorkflowSelectionMenu'

export function WorkflowRoutes() {
    const publicWorkflowRoutes = [
        {path: "/menu", comp: WorkflowMenu},
        {path: "/processes/menu", comp: WorkflowSelectionMenu},
        {path: "/processes/create", comp: CreateWorkflow},
        {path: "/board-view/:workflowId", comp: WorkflowBoardView},
    ]

    const fallbackUrl = "/workflows/processes/menu";
    const privateWorkflowRoutes = [
        {path: "/processes/create", comp: CreateWorkflow},
    ]

    return (
        <Routes>
            {publicWorkflowRoutes.map((route, index) => (
                <Route key={index} path={route.path} element={<route.comp />} />
            ))}
            
            {privateWorkflowRoutes.map((route, index) => (
                <Route key={index} path={route.path} element={
                    <AdminRoutePermissions fallbackUrl={fallbackUrl}>
                        <route.comp />
                    </AdminRoutePermissions>
                } />
            ))}
        </Routes>
    )
}
