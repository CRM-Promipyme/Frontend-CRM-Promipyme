import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { NavbarFooterLayout } from "../components/layouts/NavbarFooterLayout";

export function Error404() {
    const navigate = useNavigate();
    const { accessToken } = useAuthStore();

    useEffect(() => {
        // Redirect to login if user is not authenticated
        if (!accessToken) {
            navigate("/auth/login", { replace: true });
        }
    }, [accessToken, navigate]);

    // Show 404 page only if user is authenticated
    if (!accessToken) {
        return null;
    }

    return (
        <NavbarFooterLayout
            contentStyle={{ 
                textAlign: "center", 
                display: "flex", 
                flexDirection: "column", 
                justifyContent: "center",
                minHeight: "100vh",
                padding: "40px 20px"
            }}
            pageContent={
                <div style={{ 
                    textAlign: "center",
                    maxWidth: "600px",
                    margin: "0 auto"
                }}>
                    <img 
                        src="/assets/404_error.png" 
                        alt="404 Error" 
                        style={{ 
                            width: '300px', 
                            marginBottom: "40px",
                            animation: "float 3s ease-in-out infinite"
                        }} 
                    />
                    <h1 style={{
                        fontSize: "48px",
                        fontWeight: "700",
                        color: "#1a1a1a",
                        marginBottom: "16px",
                        letterSpacing: "-0.5px"
                    }}>
                        Página no encontrada
                    </h1>
                    <p style={{
                        fontSize: "18px",
                        color: "#6b7280",
                        marginBottom: "40px",
                        lineHeight: "1.6"
                    }}>
                        La página que buscas no existe. Por favor, verifica la URL e intenta nuevamente.
                    </p>
                    <button 
                        onClick={() => window.history.back()}
                        style={{
                            padding: "12px 32px",
                            backgroundColor: "#0066cc",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "16px",
                            fontWeight: "600",
                            transition: "all 0.3s ease",
                            boxShadow: "0 2px 8px rgba(0, 102, 204, 0.25)",
                            transform: "translateY(0)"
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#0052a3";
                            e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 102, 204, 0.35)";
                            e.currentTarget.style.transform = "translateY(-2px)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "#0066cc";
                            e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 102, 204, 0.25)";
                            e.currentTarget.style.transform = "translateY(0)";
                        }}
                    >
                        Volver atrás
                    </button>
                    <style>{`
                        @keyframes float {
                            0%, 100% { transform: translateY(0px); }
                            50% { transform: translateY(-10px); }
                        }
                    `}</style>
                </div>
            }
        />
    );
}
