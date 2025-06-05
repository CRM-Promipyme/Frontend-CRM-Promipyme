import { useSidebarStore } from '../../stores/sidebarStore';
import { MenuItemCard } from '../../components/ui/MenuItemCard';
import { SidebarLayout } from '../../components/layouts/SidebarLayout';

export function AdminMenu() {
    // Estados globales
    const sidebarWidthPx = useSidebarStore((state) => state.sidebarWidthPx);

    const menuItems = [
        {
            title: "Usuarios en el Sistema",
            description: "Ver y administrar los usuarios registrados en la plataforma.",
            icon: "bi bi-people",
            url: "/auth/user-list"
        },
        {
            title: "Solicitudes de Cuenta",
            description: "Revisar y aprobar solicitudes de cuenta de nuevos usuarios.",
            icon: "bi bi-person-badge",
            url: "/auth/account-approval-queue"
        },
        {
            title: "Invitar Usuario",
            description: "Invitar a un nuevo usuario a la plataforma.",
            icon: "bi bi-person-plus",
            url: "/auth/invite-user"
        },
        {
            title: "Invitar Usuarios en Masa",
            description: "Invitar múltiples usuarios a la plataforma de una sola vez.",
            icon: "bi bi-person-plus-fill",
            url: "/auth/bulk-invite-users"
        },
        {
            title: "Carga Masiva de Usuarios",
            description: "Subir una lista de usuarios desde un archivo Excel.",
            icon: "bi bi-file-earmark-spreadsheet",
            url: "/auth/upload-user-list"
        },
        {
            title: "Administrar Roles",
            description: "Crear, editar y eliminar roles de usuario.",
            icon: "bi bi-clipboard-minus",
            url: "/auth/manage/system-roles/list"
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