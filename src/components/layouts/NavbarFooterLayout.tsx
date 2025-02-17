import React from 'react'
import { Navbar } from '../ui/NavBar'
import { Footer } from '../ui/Footer'

interface NavbarFooterLayoutProps {
    pageContent?: React.ReactNode,
    contentStyle?: React.CSSProperties
}

export function NavbarFooterLayout({ pageContent, contentStyle }: NavbarFooterLayoutProps) {
    return (
        <>
            <Navbar />
            <div className="page-container d-flex flex-column" style={{ minHeight: "calc(100vh - 120px)" }}>
                <div className="flex-grow-1" style={contentStyle}>{pageContent}</div>
            </div>
            <Footer />
        </>
    );
}
