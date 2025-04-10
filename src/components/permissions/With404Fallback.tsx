import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { Error404 } from '../../pages/Error404';

export function With404Fallback({ children }: { children: React.ReactNode }) {
    return (
        <Routes>
            {children}
            <Route path="*" element={<Error404 />} />
        </Routes>
    );
}
