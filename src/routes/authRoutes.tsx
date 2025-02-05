import { Route, Routes } from 'react-router-dom'
import { Login } from "../pages/authPages/Login";
import { RequestAccount } from '../pages/authPages/RequestAccount';

export function AuthRoutes() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/request-account" element={<RequestAccount />} />
        </Routes>
    )
}
