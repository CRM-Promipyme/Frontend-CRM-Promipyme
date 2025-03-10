import { Route, Routes } from 'react-router-dom'
import { WorkflowMenu } from '../pages/workflowPages/WorkflowMenu'
import { WorkflowBoardView } from '../pages/workflowPages/processes/WorkflowBoardView'
import { WorkflowSelectionMenu } from '../pages/workflowPages/processes/WorkflowSelectionMenu'

export function WorkflowRoutes() {
    const publicWorkflowRoutes = [
        {path: "/menu", comp: WorkflowMenu},
        {path: "/processes/menu", comp: WorkflowSelectionMenu},
        {path: "/board-view/:workflowId", comp: WorkflowBoardView},
    ]

    return (
        <Routes>
            {publicWorkflowRoutes.map((route, index) => (
                <Route key={index} path={route.path} element={<route.comp />} />
            ))}
        </Routes>
    )
}
