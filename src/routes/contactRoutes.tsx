import { Route } from 'react-router-dom'
import { ContactList } from '../pages/contactPages/ContactList'
import { ContactsMenu } from '../pages/contactPages/ContactsMenu'
import { ContactDetail } from '../pages/contactPages/ContactDetail'
import { CreateContact } from '../pages/contactPages/CreateContact'
import { With404Fallback } from '../components/permissions/With404Fallback';

export function ContactRoutes() {
    const publicContactRoutes = [
        {path: "/menu", comp: ContactsMenu},
        {path: "/list", comp: ContactList},
        {path: "/details/:contact_id", comp: ContactDetail},
        {path: "/create", comp: CreateContact}
    ]

    return (
        <With404Fallback>
            {publicContactRoutes.map((route, index) => (
                <Route key={index} path={route.path} element={<route.comp />} />
            ))}
        </With404Fallback>
    )
}
