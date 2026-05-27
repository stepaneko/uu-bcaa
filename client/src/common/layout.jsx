import React from 'react';
import { Outlet } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import logo from '../vat-overview/logo.png';

export default function Layout() {
    return (
        <Container className="py-4">
            <header className="mb-4 px-2">
                <img src={logo} alt="EasyVAT Logo" style={{ height: '160px' }} />
            </header>

            <main>
                <Outlet />
            </main>
        </Container>
    );
}