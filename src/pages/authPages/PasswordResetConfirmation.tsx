import axios from "axios";
import { useState } from "react";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import '../../styles/auth/authStyles.css';
import { Spinner } from "../../components/ui/Spinner";
import { LoginResponse } from "../../types/authTypes";
import { useNavigate, useParams } from "react-router-dom";
import { PasswordField } from "../../components/ui/forms/PasswordField";
import { AuthLayout } from "../../components/layouts/authLayouts/authLayout";

const BASE_URL = import.meta.env.VITE_VERCEL_REACT_APP_DJANGO_API_URL;

export function PasswordResetConfirmation() {
    // Inicializar el estado local
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    // Get UID and token from route params
    const { uid, token } = useParams<{ uid: string; token: string }>();

    const handlePasswordChange = (newPassword: string) => {
        setPassword(newPassword);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault(); // Evitar recargar la página
        setLoading(true);

        axios.post<LoginResponse>(`${BASE_URL}/auth/confirm-reset-password/?uid=${uid}&token=${token}`, { new_password: password })
            .then((response) => {
                if (response.status === 200) {
                    toast.success("¡Haz restablecido tu contraseña exitosamente!");
                    navigate("/auth/login");
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
                        Cambia tu contraseña ingresando tu nueva contraseña.
                    </p>
                    <form 
                        className="auth-login-form" 
                        style={{ textAlign: "left", lineHeight: '2' }}
                        onSubmit={handleSubmit}
                    >
                        <PasswordField value={password} onChange={handlePasswordChange} />
                        
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
                            {loading ? <Spinner /> : "Cambiar Contraseña"}
                        </button>
                    </form>
                    <div className="auth-actions" style={{ lineHeight: '0.5' }}>
                        <p>¿Te acordaste de tu contraseña?</p>
                        <Link to="/auth/login" style={{ textDecoration: "none" }}>Inicia sesión aquí</Link>
                    </div>
                </div>
            }
        />
    );
}
