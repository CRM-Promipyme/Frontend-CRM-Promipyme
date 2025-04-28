import { NavbarFooterLayout } from "../components/layouts/NavbarFooterLayout";

// TODO: Review the error page design
export function Error404() {
    return (
        <NavbarFooterLayout
            contentStyle={{ textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "center" }}
            pageContent={
                <div style={{ textAlign: "center" }}>
                    <img src="/assets/404_error.png" alt="404 Error" style={{ width: '300px', marginTop: "25px" }} />
                    <h1>Página no encontrada</h1>
                    <p>La página que buscas no existe. Por favor, verifica la URL e intenta nuevamente.</p>
                </div>
            }
        />
    );
}
