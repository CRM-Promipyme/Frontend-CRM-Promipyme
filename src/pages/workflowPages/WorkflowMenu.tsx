import { useSidebarStore } from '../../stores/sidebarStore';
import { MenuItemCard } from '../../components/ui/MenuItemCard';
import { SidebarLayout } from '../../components/layouts/SidebarLayout';

export function WorkflowMenu() {
    // Estados globales
    const sidebarWidthPx = useSidebarStore((state) => state.sidebarWidthPx);

    const menuItems = [
        {
            title: "Procesos en el Sistema",
            description: "Ver y administrar los procesos registrados en la plataforma y sus respectivas etapas.",
            icon: "bi bi-diagram-3",
            url: "/workflows/processes/menu"
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