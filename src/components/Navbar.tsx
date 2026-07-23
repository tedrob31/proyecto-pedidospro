'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();
  
  if (pathname === '/login') return null;

  const links = [
    { href: '/', label: 'Dashboard' },
    { href: '/pedidos', label: 'Procesar Pedidos' },
    { href: '/subir-fotos', label: 'Subir Fotos' },
    { href: '/proveedores', label: 'Proveedores' },
    { href: '/configuracion', label: 'Configuración' },
  ];

  return (
    <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 font-bold text-xl text-white tracking-tight">
              Pedidos<span className="text-blue-500">Pro</span>
            </Link>
            <div className="hidden md:block ml-10">
              <div className="flex items-baseline space-x-4">
                {links.map((link) => {
                  const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-gray-800 text-white'
                          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="flex items-center">
             {/* A simple logout button can be added here or just an icon */}
             <button onClick={() => {
                document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
                window.location.href = '/login';
             }} className="text-gray-400 hover:text-white text-sm">
               Cerrar Sesión
             </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
