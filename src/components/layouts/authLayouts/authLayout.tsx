import React from 'react'
import '../../../styles/auth/authStyles.css'

interface AuthLayoutProps {
    authContent?: React.ReactNode
}

export function AuthLayout({ authContent }: AuthLayoutProps) {
    return (
        <div className="auth-container">
            <div className="card-body">
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '45px', marginBottom: '45px' }}>
                    <img src="/assets/logo_promipyme.png" alt="Logo" style={{ width: '300px', marginTop: "25px" }} />
                    <div
                        id="auth-content-col"
                        className="column"
                        style={{ padding: '25px' }}
                    >
                        {authContent}
                    </div>
                </div>
            </div>
        </div>
    )
}