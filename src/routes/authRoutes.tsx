import { Route, Routes } from 'react-router-dom'
import { Login } from "../pages/authPages/Login";
import { UserList } from '../pages/authPages/UserList';
import { AdminMenu } from '../pages/authPages/AuthMenu';
import { InviteUser } from '../pages/authPages/InviteUser';
import { RequestAccount } from '../pages/authPages/RequestAccount';
import { UserProfileView } from '../pages/authPages/UserProfileView';
import { AccountApprovalQueue } from '../pages/authPages/AccountApprovalQueue';
import { RequestPasswordReset } from '../pages/authPages/RequestPasswordReset';
import { AdminRoutePermissions } from '../components/permissions/AdminRoutePermissions';
import { PasswordResetConfirmation } from '../pages/authPages/PasswordResetConfirmation';

export function AuthRoutes() {
    const publicAuthRoutes = [
        {path: "/login", comp: Login},
        {path: "/request-account", comp: RequestAccount},
        {path: "/user/profile/:userId", comp: UserProfileView},
        {path: "/auth-menu", comp: AdminMenu},
        {path: "/request-password-reset", comp: RequestPasswordReset},
        {path: "/confirm-password-reset/:uid/:token", comp: PasswordResetConfirmation}
    ]

    const fallbackUrl = "/auth/auth-menu";
    const privateAuthRoutes = [
        {path: "/invite-user", comp: InviteUser},
        {path: "/user-list", comp: UserList},
        {path: "/account-approval-queue", comp: AccountApprovalQueue}
    ]

    return (
        <Routes>
            {publicAuthRoutes.map((route, index) => (
                <Route key={index} path={route.path} element={<route.comp />} />
            ))}
            {privateAuthRoutes.map((route, index) => (
                <Route key={index} path={route.path} element={
                    <AdminRoutePermissions fallbackUrl={fallbackUrl}>
                        <route.comp />
                    </AdminRoutePermissions>
                } />
            ))}
        </Routes>
    )
}
