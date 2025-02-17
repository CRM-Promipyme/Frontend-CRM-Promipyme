import axios from "axios";
import { useState } from "react";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import { Spinner } from "../../components/ui/Spinner";
import { PasswordField } from "../../components/ui/forms/PasswordField";
import { AuthLayout } from "../../components/layouts/authLayouts/authLayout";

const BASE_URL = import.meta.env.VITE_REACT_APP_DJANGO_API_URL;

export function RequestAccount() {
    // Inicializar el estado local
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        email: "",
        password: "",
    });

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    }

    function handlePasswordChange(newPassword: string) {
        setFormData({ ...formData, password: newPassword });
    }

    const requestAccount = (e: React.FormEvent) => {
        e.preventDefault(); // Evitar recargar la página
        
        if (submitted) {
            // Evitar que se envíen múltiples solicitudes
            toast.warning("¡Ya has enviado una solicitud de cuenta! Por favor, espera a que un administrador apruebe tu solicitud.");
        }
        else {
            setLoading(true);

            // Enviar la solicitud de cuenta al servidor
            axios.post(`${BASE_URL}/auth/request-account/`, formData)
                .then(() => {
                    setSubmitted(true);
                    toast.success("¡Solicitud de cuenta enviada! Por favor, espera a que un administrador apruebe tu solicitud.");
                })
                .catch((error) => {
                    // Mostrar mensajes de error
                    const data = error.response?.data;

                    // Verificar si hubieron errores puntuales en la solicitud
                    if (data?.errors) {
                        const errorMap = data.errors as Record<string, string[]>;
                            Object.values(errorMap).forEach((errorArray) => {
                            errorArray.forEach((errMsg) => toast.error(errMsg));
                        });
                    } else if (data?.message) {
                        // Mostrar un mensaje de error genérico
                        toast.error(data.message);
                    } else {
                        toast.error("Ha ocurrido un error al enviar la solicitud de cuenta. Por favor, intenta más tarde.");
                    }
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    };

    return (
        <AuthLayout
            authContent={
                <div style={{ textAlign: "center" }}>
                    <h1>CRM Promipyme</h1>
                    <p style={{ marginBottom: "30px" }}>
                        Solicita una cuenta para acceder al sistema de CRM
                    </p>
                    <form 
                        className="auth-reqacc-form"
                        style={{ textAlign: "left", lineHeight: '2' }}
                        onSubmit={requestAccount}
                    >
                        <label htmlFor="first_name">Nombres</label>
                        <input
                            style={{ marginBottom: "15px" }}
                            type="text"
                            name="first_name"
                            className="form-control"
                            id="first_name"
                            value={formData.first_name}
                            onChange={handleChange}
                            placeholder="Escribe tus nombres aquí..."
                            required
                        />

                        <label htmlFor="last_name">Apellidos</label>
                        <input
                            style={{ marginBottom: "15px" }}
                            type="text"
                            name="last_name"
                            className="form-control"
                            id="last_name"
                            value={formData.last_name}
                            onChange={handleChange}
                            placeholder="Escribe tus apellidos aquí..."
                            required
                        />

                        <label htmlFor="email">Correo Electrónico</label>
                        <input
                            style={{ marginBottom: "15px" }}
                            type="text"
                            name="email"
                            className="form-control"
                            id="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Escribe tu correo electrónico aquí..."
                            required
                        />
                        
                        <PasswordField value={formData.password} onChange={handlePasswordChange} />
                        
                        <button
                            id="req-acc-btn"
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
                            className="btn btn-primary mt-3"
                        >
                            {loading ? <Spinner /> : "Solicitar Cuenta"}
                        </button>
                    </form>
                    <div className="auth-actions" style={{ lineHeight: '0.5' }}>
                        <p>¿Ya tienes una cuenta?</p>
                        <Link to="/auth/login" style={{ textDecoration: "none" }}>Inicia sesión aquí</Link>
                    </div>
                </div>
            }
        />
    )
}