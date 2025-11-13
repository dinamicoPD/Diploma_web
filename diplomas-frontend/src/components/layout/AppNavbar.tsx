/* eslint-disable @next/next/no-img-element */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Navbar, Nav, Container } from 'react-bootstrap';

export default function AppNavbar() {
  const pathname = usePathname() || '/';
  const links = [
    { label: 'Inicio', href: '/' },
    { label: 'Editor', href: '/editor' },
    { label: 'Lotes', href: '/lotes' },
  ];

  return (
    <Navbar expand="lg" className="brand-navbar">
      <Container>
        <Navbar.Brand as={Link} href="/" className="d-flex align-items-center gap-2">
          {/* ✅ Logo sin distorsión */}
          <img src="/logo.png" alt="Dinámico" className="brand-logo bg-white rounded-2 p-1 border" />
          <span className="fw-bold text-brand-ink">Diplomas App</span>
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="main-nav" className="btn btn-sm btn-outline-brand" />
        <Navbar.Collapse id="main-nav">
          <Nav className="ms-auto">
            {links.map((l) => {
              const active = pathname === l.href || pathname.startsWith(l.href + '/');
              return (
                <Nav.Link
                  key={l.href}
                  as={Link}
                  href={l.href}
                  className={`nav-pill ${active ? 'active' : ''}`}
                >
                  {l.label}
                </Nav.Link>
              );
            })}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
