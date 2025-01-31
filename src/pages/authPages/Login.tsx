import { AuthLayout } from "../../components/layouts/authLayouts/authLayout";
import { PasswordField } from "../../components/ui/forms/PasswordField"; 
import { toast } from "react-toastify";
import { useState } from "react";
import axios from "axios";
import { LoginResponse } from "../../types/authTypes";
import { useAuthStore } from "../../stores/authStore";

const BASE_URL = import.meta.env.VITE_REACT_APP_DJANGO_API_URL;

export function Login() {
    // Inicializar estado de autenticación
    const authStore = useAuthStore(state => state);

    // Inicializar el estado local
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const handlePasswordChange = (newPassword: string) => {
        setPassword(newPassword);
    };

    const login = authStore.login;
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

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
                        style={{ textAlign: "left" }} 
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
                        <button style={{ width: '100%' }} type="submit" className="btn btn-primary mt-3">
                            Iniciar Sesión
                        </button>
                    </form>
                </div>
            }
        />
    );
}
