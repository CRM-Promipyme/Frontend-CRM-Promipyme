import { useSidebarStore } from "../../stores/sidebarStore";
import { SidebarLayout } from "../../components/layouts/SidebarLayout";

export function AccountApprovalQueue() {
    const sidebarWidthPx = useSidebarStore((state) => state.sidebarWidthPx);

    return (
        <SidebarLayout sidebarWidthPx={sidebarWidthPx}>
            <h1>Cola de aprobación de cuentas</h1>
        </SidebarLayout>
    );
}
