import { Route } from 'react-router-dom'
import { Login } from "../pages/authPages/Login";
import { UserList } from '../pages/authPages/UserList';
import { RoleList } from '../pages/authPages/RoleList';
import { AdminMenu } from '../pages/authPages/AuthMenu';
import { InviteUser } from '../pages/authPages/InviteUser';
import { RequestAccount } from '../pages/authPages/RequestAccount';
import { UserProfileView } from '../pages/authPages/UserProfileView';
import { With404Fallback } from '../components/permissions/With404Fallback';
import { AccountApprovalQueue } from '../pages/authPages/AccountApprovalQueue';
import { RequestPasswordReset } from '../pages/authPages/RequestPasswordReset';
import { AdminRoutePermissions } from '../components/permissions/AdminRoutePermissions';
import { PasswordResetConfirmation } from '../pages/authPages/PasswordResetConfirmation';
import { AuthenticatedRoutePermissions } from '../components/permissions/AuthenticatedRoutePermissions';
import { BulkInviteUsers } from '../pages/authPages/BulkInviteUsers';
import { MassInviteUsers } from '../pages/authPages/MassInviteUsers';

export function AuthRoutes() {
    const publicAuthRoutes = [
        {path: "/login", comp: Login},
        {path: "/request-account", comp: RequestAccount},
        {path: "/request-password-reset", comp: RequestPasswordReset},
        {path: "/confirm-password-reset/:uid/:token", comp: PasswordResetConfirmation}
    ]

    const authFallback = "/auth/login";
    const privateAuthRoutes = [
        {path: "/user/profile/:userId", comp: UserProfileView},
        {path: "/auth-menu", comp: AdminMenu},
    ]

    const fallbackUrl = "/auth/auth-menu";
    const adminAuthRoutes = [
        {
            path: "/invite-user",
            comp: InviteUser,
            requiredBasePermissions: ["invite_users"]
        },
        {
            path: "/bulk-invite-users",
            comp: BulkInviteUsers,
            requiredBasePermissions: ["invite_users"]
        },
        {
            path: "upload-user-list",
            comp: MassInviteUsers,
            requiredBasePermissions: ["invite_users"]
        },
        {
            path: "/user-list",
            comp: UserList,
            requiredBasePermissions: ["see_user_list"]
        },
        {
            path: "/account-approval-queue",
            comp: AccountApprovalQueue,
            requiredBasePermissions: ["approve_accounts", "deny_accounts"]
        },
        {
            path: "/manage/system-roles/list",
            comp: RoleList,
            requiredBasePermissions: ["create_roles", "update_roles", "delete_roles"]
        }
    ]

    return (
        <With404Fallback>
            {publicAuthRoutes.map((route, index) => (
                <Route key={index} path={route.path} element={<route.comp />} />
            ))}
            {privateAuthRoutes.map((route, index) => (
                <Route key={index} path={route.path} element={
                    <AuthenticatedRoutePermissions fallbackUrl={authFallback}>
                        <route.comp />
                    </AuthenticatedRoutePermissions>
                } />
            ))}
            {adminAuthRoutes.map((route, index) => (
                <Route key={index} path={route.path} element={
                    <AdminRoutePermissions fallbackUrl={fallbackUrl} requiredBasePermissions={route.requiredBasePermissions}>
                        <route.comp />
                    </AdminRoutePermissions>
                } />
            ))}
        </With404Fallback>
    )
}
