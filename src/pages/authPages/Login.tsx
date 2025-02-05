import axios from "axios";
import { useState } from "react";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import '../../styles/auth/authStyles.css';
import { Spinner } from "../../components/ui/Spinner";
import { useAuthStore } from "../../stores/authStore";
import { LoginResponse } from "../../types/authTypes";
import { PasswordField } from "../../components/ui/forms/PasswordField"; 
import { AuthLayout } from "../../components/layouts/authLayouts/authLayout";

const BASE_URL = import.meta.env.VITE_REACT_APP_DJANGO_API_URL;

export function Login() {
    // Inicializar estado de autenticación
    const authStore = useAuthStore(state => state);

    // Inicializar el estado local
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handlePasswordChange = (newPassword: string) => {
        setPassword(newPassword);
    };

    const login = authStore.login;
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault(); // Evitar recargar la página
        setLoading(true);

        axios.post<LoginResponse>(`${BASE_URL}/auth/login/`, { username, password })
            .then((response) => {
                if (response.status === 200) {
                    login(response.data);
                    toast.success("¡Inicio de sesión exitoso!");

                    // TODO: Redirigir a la página de inicio
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
                        <label htmlFor="username">Nombre de Usuario</label>
                        <input
                            style={{ marginBottom: "15px" }}
                            type="text"
                            className="form-control"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Escribe tu nombre de usuario aquí..."
                            required
                        />
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
                            {loading ? <Spinner /> : "Iniciar Sesión"}
                        </button>
                    </form>
                    <div className="auth-actions" style={{ lineHeight: '0.5' }}>
                        <p>¿No tienes una cuenta?</p>
                        <Link to="/auth/request-account" style={{ textDecoration: "none" }}>Solicita una cuenta a tu organización</Link>
                    </div>
                </div>
            }
        />
    );
}
