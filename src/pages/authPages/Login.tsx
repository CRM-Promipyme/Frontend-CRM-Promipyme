import axios from "axios";
import { useState } from "react";
import { toast } from "react-toastify";
import '../../styles/auth/authStyles.css';
import { Link, useNavigate } from "react-router-dom";
import { Spinner } from "../../components/ui/Spinner";
import { useAuthStore } from "../../stores/authStore";
import { LoginResponse } from "../../types/authTypes";
import { PasswordField } from "../../components/ui/forms/PasswordField";
import { AuthLayout } from "../../components/layouts/authLayouts/authLayout";

const BASE_URL = import.meta.env.VITE_VERCEL_REACT_APP_DJANGO_API_URL;

export function Login() {
    // Estados de autenticación
    const navigate = useNavigate();
    const authStore = useAuthStore(state => state);

    // Estados locales
    const [useEmail, setUseEmail] = useState(false); // Toggle entre email/username
    const [credential, setCredential] = useState(""); // Almacena email o username
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handlePasswordChange = (newPassword: string) => {
        setPassword(newPassword);
    };

    const redirects = [
        {
            role: 'Administrador',
            redirect: '/auth/auth-menu'
        },
    ]

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Construir payload dinámicamente
        const payload = useEmail ? { email: credential, password } : { username: credential, password };

        axios.post<LoginResponse>(`${BASE_URL}/auth/login/`, payload)
            .then((response) => {
                if (response.status === 200) {
                    authStore.login(response.data);
                    
                    const userRoles = response.data.roles;
                    const redirect = redirects.find(r =>
                        userRoles.some(roleObj => roleObj.nombre_rol === r.role)
                    );
                    if (redirect) {
                        navigate(redirect.redirect);
                    } else {
                        navigate(`/auth/user/profile/${response.data.user_id}`);
                    }
                    
                    toast.success("¡Inicio de sesión exitoso!");
                }
            })
            .catch((error) => {
                console.error(error);
                if (error.response?.status === 400) {
                    toast.error("Credenciales inválidas. Por favor, intenta nuevamente.");
                } else {
                    toast.error("No se pudo iniciar sesión. Por favor, intenta más tarde.");
                }
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
                        Inicia sesión utilizando tus credenciales
                    </p>

                    <form 
                        className="auth-login-form" 
                        style={{ textAlign: "left", lineHeight: '2' }}
                        onSubmit={handleSubmit}
                    >
                        {/* Toggle para cambiar entre Email/Username */}
                        <div className="d-flex align-items-center justify-content-between mb-3">
                            <label className="form-label" style={{ marginBottom: '0rem' }}>{useEmail ? "Correo Electrónico" : "Nombre de Usuario"}</label>
                            <div className="toggle-switch">
                                <input
                                    type="checkbox"
                                    id="toggleLoginMethod"
                                    checked={useEmail}
                                    onChange={() => {
                                        setUseEmail(!useEmail);
                                        setCredential(""); // Reset field on toggle
                                    }}
                                />
                                <label htmlFor="toggleLoginMethod" className="slider"></label>
                            </div>
                        </div>

                        <input
                            style={{ marginBottom: "15px" }}
                            type="text"
                            className="form-control"
                            value={credential}
                            onChange={(e) => setCredential(e.target.value)}
                            placeholder={useEmail ? "Ingresa tu correo electrónico..." : "Ingresa tu nombre de usuario..."}
                            required
                        />

                        <PasswordField value={password} onChange={handlePasswordChange} />

                        <div className="forgot-password-container text-end">
                            <Link to="/auth/request-password-reset" style={{ textDecoration: "none" }}>
                                ¿Olvidaste tu contraseña?
                            </Link>
                        </div>

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
                            {loading ? <Spinner /> : "Iniciar Sesión"}
                        </button>
                    </form>

                    <div className="auth-actions" style={{ lineHeight: '0.5' }}>
                        <p>¿No tienes una cuenta?</p>
                        <Link to="/auth/request-account" style={{ textDecoration: "none" }}>
                            Solicita una cuenta a tu organización
                        </Link>
                    </div>
                </div>
            }
        />
    );
}
