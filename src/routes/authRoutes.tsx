import { Route, Routes } from 'react-router-dom'
import { Login } from "../pages/authPages/Login";
import { UserList } from '../pages/authPages/UserList';
import { AdminMenu } from '../pages/authPages/AuthMenu';
import { InviteUser } from '../pages/authPages/InviteUser';
import { RequestAccount } from '../pages/authPages/RequestAccount';
import { UserProfileView } from '../pages/authPages/UserProfileView';
import { AccountApprovalQueue } from '../pages/authPages/AccountApprovalQueue';
import { RequestPasswordReset } from '../pages/authPages/RequestPasswordReset';
import { PasswordResetConfirmation } from '../pages/authPages/PasswordResetConfirmation';

export function AuthRoutes() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/user-list" element={<UserList />} />
            <Route path="/request-account" element={<RequestAccount />} />
            <Route path="/invite-user" element={<InviteUser />} />
            <Route path="/user/profile/:userId" element={<UserProfileView />} />
            <Route path="/auth-menu" element={<AdminMenu />} />
            <Route path="/account-approval-queue" element={<AccountApprovalQueue />} />
            <Route path="/request-password-reset" element={<RequestPasswordReset />} />
            <Route path="/confirm-password-reset/:uid/:token" element={<PasswordResetConfirmation />} />
        </Routes>
    )
}
