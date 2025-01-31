import React from 'react'
import './authLayout.css' // Use your existing CSS or inline styles

interface AuthLayoutProps {
    authContent?: React.ReactNode
}

export function AuthLayout({ authContent }: AuthLayoutProps) {
    return (
        <div className="auth-container">
            <div className="card-body">
                <div
                    id="auth-content-col"
                    className="column"
                    style={{ padding: '25px' }}
                >
                    {authContent}
                </div>
            </div>
        </div>
    )
}