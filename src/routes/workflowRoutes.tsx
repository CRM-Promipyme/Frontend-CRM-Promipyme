import { Route, Routes } from 'react-router-dom'
import { CreateCase } from '../pages/workflowPages/cases/CreateCase'
import { CreateWorkflow } from '../pages/workflowPages/processes/CreateWorkflow'
import { AdminRoutePermissions } from '../components/permissions/AdminRoutePermissions'
import { WorkflowSelectionMenu } from '../pages/workflowPages/processes/WorkflowSelectionMenu'
import { WorkflowBoardView } from '../pages/workflowPages/processes/boardView/WorkflowBoardView'
import { UpdateCase } from '../pages/workflowPages/cases/UpdateCase'

export function WorkflowRoutes() {
    const publicWorkflowRoutes = [
        {path: "/processes/menu", comp: WorkflowSelectionMenu},
        {path: "/processes/create", comp: CreateWorkflow},
        {path: "/board-view/:workflowId", comp: WorkflowBoardView},
    ]

    const fallbackUrl = "/workflows/processes/menu";
    const privateWorkflowRoutes = [
        {path: "/processes/create", comp: CreateWorkflow},
        {path: "/cases/create/:workflowId", comp: CreateCase},
        {path: "/cases/update/:caseId", comp: UpdateCase},
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
