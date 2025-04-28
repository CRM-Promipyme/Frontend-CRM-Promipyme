import { Route } from 'react-router-dom'
import { ContactList } from '../pages/contactPages/ContactList'
import { ContactsMenu } from '../pages/contactPages/ContactsMenu'
import { ContactDetail } from '../pages/contactPages/ContactDetail'
import { CreateContact } from '../pages/contactPages/CreateContact'
import { ContactFields } from '../pages/contactPages/ContactFields'
import { With404Fallback } from '../components/permissions/With404Fallback';
import { AdminRoutePermissions } from '../components/permissions/AdminRoutePermissions';
import { AuthenticatedRoutePermissions } from '../components/permissions/AuthenticatedRoutePermissions'

export function ContactRoutes() {
    const authFallback = "/auth/login";
    const authenticatedRoutes = [
        {path: "/menu", comp: ContactsMenu},
        {path: "/list", comp: ContactList},
        {path: "/details/:contact_id", comp: ContactDetail},
        {path: "/create", comp: CreateContact}
    ]

    const fallbackUrl = "/contacts/menu";
    const adminContactRoutes = [
        {path: "/customize-fields", comp: ContactFields},
    ]

    return (
        <With404Fallback>
            {authenticatedRoutes.map((route, index) => (
                <Route key={index} path={route.path} element={
                    <AuthenticatedRoutePermissions fallbackUrl={authFallback}>
                        <route.comp />
                    </AuthenticatedRoutePermissions>
                } />
            ))}
            {adminContactRoutes.map((route, index) => (
                <Route key={index} path={route.path} element={
                    <AdminRoutePermissions fallbackUrl={fallbackUrl}>
                        <route.comp />
                    </AdminRoutePermissions>
                } />
            ))}
        </With404Fallback>
    )
}
