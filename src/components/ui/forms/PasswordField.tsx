import React, { useState } from 'react'

interface PasswordFieldProps {
    value?: string
    onChange?: (val: string) => void
}

export function PasswordField({ value = '', onChange }: PasswordFieldProps) {
    const [password, setPassword] = useState(value)
    const [showPassword, setShowPassword] = useState(false)

    function toggleShowPassword() {
        setShowPassword((prev) => !prev)
    }

    function handlePasswordChange(e: React.ChangeEvent<HTMLInputElement>) {
        setPassword(e.target.value)
        onChange?.(e.target.value)
    }

    return (
        <>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'space-between', alignItems: 'center' }}>
                <label htmlFor="password">Contraseña</label>
                <p className={`warning-text ${showPassword ? "visible" : ""}`} style={{ marginBottom: 0 }}>
                    ¡La contraseña es visible!
                </p>
            </div>
            <div className="input-group">
                <input
                    required
                    id="password"
                    className="form-control"
                    placeholder="Escribe tu contraseña aquí..."
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={handlePasswordChange}
                />
                <div className="input-group-append password-show-btn">
                    <button
                        type="button"
                        className="btn btn-outline-primary"
                        style={{ height: '100%', borderRadius: '0px 10px 10px 0px' }}
                        onClick={toggleShowPassword}
                    >
                        {showPassword ? (
                            <svg
                                xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                                fill="currentColor" className="bi bi-eye-slash" viewBox="0 0 16 16"
                                strokeWidth="1"
                            >
                                <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5A7 7 0 0 0 5.21 3.588l.77.771A6 6 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755q-.247.248-.517.486z" />
                                <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829" />
                                <path d="M3.35 5.47q-.27.24-.518.487A13 13 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7 7 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12z" />
                            </svg>
                        ) : (
                            <svg
                                xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                                fill="currentColor" className="bi bi-eye" viewBox="0 0 16 16"
                                strokeWidth="1"
                            >
                                <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8" />
                                <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>
        </>
    )
}