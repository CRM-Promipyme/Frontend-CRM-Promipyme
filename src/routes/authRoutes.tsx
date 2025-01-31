import { Route, Routes } from 'react-router-dom'
import { Login } from "../pages/authPages/Login";

export function AuthRoutes() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
        </Routes>
    )
}
