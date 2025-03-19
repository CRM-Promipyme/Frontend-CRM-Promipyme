import { Route, Routes } from 'react-router-dom'
import { ContactList } from '../pages/contactPages/ContactList'
import { ContactsMenu } from '../pages/contactPages/ContactsMenu'
import { ContactDetail } from '../pages/contactPages/ContactDetail'
import { CreateContact } from '../pages/contactPages/CreateContact'

export function ContactRoutes() {
    const publicContactRoutes = [
        {path: "/menu", comp: ContactsMenu},
        {path: "/list", comp: ContactList},
        {path: "/details/:contact_id", comp: ContactDetail},
        {path: "/create", comp: CreateContact}
    ]

    return (
        <Routes>
            {publicContactRoutes.map((route, index) => (
                <Route key={index} path={route.path} element={<route.comp />} />
            ))}
        </Routes>
    )
}
