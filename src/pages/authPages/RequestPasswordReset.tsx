import axios from "axios";
import { useState } from "react";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import '../../styles/auth/authStyles.css';
import { Spinner } from "../../components/ui/Spinner";
import { LoginResponse } from "../../types/authTypes";
import { AuthLayout } from "../../components/layouts/authLayouts/authLayout";

const BASE_URL = import.meta.env.VITE_REACT_APP_DJANGO_API_URL;

export function RequestPasswordReset() {
    // Inicializar el estado local
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault(); // Evitar recargar la página
        setLoading(true);

        axios.post<LoginResponse>(`${BASE_URL}/auth/reset-password/`, { email })
            .then((response) => {
                if (response.status === 200) {
                    toast.success("¡Solicitud de restablecimiento de contraseña enviada! Por favor, revisa tu correo electrónico.");
                }
                
            })
            .catch(() => {
                toast.error("No se pudo enviar la solicitud de restablecimiento de contraseña. Por favor, intenta más tarde.");
            })
            .finally(() => {
                setLoading(false);
            });
    };

    return (
        <AuthLayout
            authContent={
                <div style={{ textAlign: "center" }}>
                    <h1>CRM Promipyme</h1>
                    <p style={{ marginBottom: "30px" }}>
                        Solicita un restablecimiento de contraseña ingresando tu correo electrónico.
                    </p>
                    <form 
                        className="auth-login-form" 
                        style={{ textAlign: "left", lineHeight: '2' }}
                        onSubmit={handleSubmit}
                    >
                        <label htmlFor="email">Correo Electrónico</label>
                        <input
                            style={{ marginBottom: "15px" }}
                            type="text"
                            className="form-control"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Escribe tu nombre de email aquí..."
                            required
                        />
                        
                        <button 
                            style={{ 
                                width: '100%',
                                height: '45px',
                                marginTop: '2rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px'
                            }} 
                            type="submit" 
                            className="btn btn-primary"
                        >
                            {loading ? <Spinner /> : "Solictar Restablecimiento de Contraseña"}
                        </button>
                    </form>
                    <div className="auth-actions" style={{ lineHeight: '0.5' }}>
                        <p>¿Ya tienes una cuenta?</p>
                        <Link to="/auth/login" style={{ textDecoration: "none" }}>Inicia sesión aquí</Link>
                    </div>
                </div>
            }
        />
    );
}
