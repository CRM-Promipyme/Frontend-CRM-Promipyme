import { Route, Routes } from 'react-router-dom'
import { Login } from "../pages/authPages/Login";
import { InviteUser } from '../pages/authPages/InviteUser';
import { RequestAccount } from '../pages/authPages/RequestAccount';
import { AccountApprovalQueue } from '../pages/authPages/AccountApprovalQueue';
import { UserList } from '../pages/authPages/UserList';

export function AuthRoutes() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/user-list" element={<UserList />} />
            <Route path="/request-account" element={<RequestAccount />} />
            <Route path="/invite-user" element={<InviteUser />} />
            <Route path="/account-approval-queue" element={<AccountApprovalQueue />} />
        </Routes>
    )
}
