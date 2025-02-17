export function Footer() {
    return (
        <footer className="bg-dark text-white text-center py-3 mt-4 shadow-lg">
            <div className="container">
                <p className="mb-0">
                    &copy; {new Date().getFullYear()} CRM Promipyme. Todos los derechos reservados.
                </p>
                <p className="mb-0">
                    {/* TODO: Verificar si esto es necesario */}
                    <a href="###" className="text-white text-decoration-none">Política de Privacidad</a> | 
                    <a href="###" className="text-white text-decoration-none ms-2">Términos de Servicio</a>
                </p>
            </div>
        </footer>
    );
}
