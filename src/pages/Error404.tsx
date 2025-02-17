import { Link } from "react-router-dom";
import { NavbarFooterLayout } from "../components/layouts/NavbarFooterLayout";

export function Error404() {
    return (
        <NavbarFooterLayout
            contentStyle={{ textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "center" }}
            pageContent={
                <div style={{ textAlign: "center" }}>
                    <img src="/assets/404_error.png" alt="404 Error" style={{ width: '300px', marginTop: "25px" }} />
                    <h1>Página no encontrada</h1>
                    <p>La página que buscas no existe. Por favor, verifica la URL e intenta nuevamente.</p>
                    <Link to="/" style={{ textDecoration: "none" }}>Haz click aquí para volver al inicio.</Link>
                </div>
            }
        />
    );
}
