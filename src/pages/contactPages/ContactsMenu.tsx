import { useSidebarStore } from '../../stores/sidebarStore';
import { MenuItemCard } from '../../components/ui/MenuItemCard';
import { SidebarLayout } from '../../components/layouts/SidebarLayout';

export function ContactsMenu() {
    // Estados globales
    const sidebarWidthPx = useSidebarStore((state) => state.sidebarWidthPx);

    const menuItems = [
        {
            title: "Contactos en el Sistema",
            description: "Ver y administrar los clientes registrados en la plataforma.",
            icon: "bi bi-people",
            url: "/contacts/list"
        },
        {
            title: "Crear Contacto",
            description: "Añadir un nuevo contacto al sistema.",
            icon: "bi bi-person-plus",
            url: "/contacts/create"
        }
    ]

    return (
        <SidebarLayout sidebarWidthPx={sidebarWidthPx}>
            {/* Display menu cards */}
            <div className="menu-cards">
                {menuItems.map((item, index) => (
                    <MenuItemCard key={index} title={item.title} description={item.description} icon={item.icon} url={item.url} />
                ))}
            </div>
        </SidebarLayout>
    )
}