export default function Dashboard() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white">Panel Principal</h1>
        <p className="mt-2 text-sm text-gray-400">Bienvenido al Sistema de Gestión de Pedidos e Imágenes.</p>
      </div>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Card 1 */}
        <div className="bg-gray-900 overflow-hidden shadow rounded-xl border border-gray-800 transition-all hover:border-gray-700">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-500/10 rounded-md p-3">
                <svg className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-400 truncate">Procesar Pedidos</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-white">Generar imágenes</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-950/50 px-6 py-3 border-t border-gray-800">
            <div className="text-sm">
              <a href="/pedidos" className="font-medium text-blue-500 hover:text-blue-400 transition-colors">
                Ir a pedidos &rarr;
              </a>
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-gray-900 overflow-hidden shadow rounded-xl border border-gray-800 transition-all hover:border-gray-700">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-500/10 rounded-md p-3">
                <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-400 truncate">Subir Fotos</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-white">Gestionar stock</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-950/50 px-6 py-3 border-t border-gray-800">
            <div className="text-sm">
              <a href="/subir-fotos" className="font-medium text-blue-500 hover:text-blue-400 transition-colors">
                Ir a fotos &rarr;
              </a>
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-gray-900 overflow-hidden shadow rounded-xl border border-gray-800 transition-all hover:border-gray-700">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-500/10 rounded-md p-3">
                <svg className="h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-400 truncate">Configuración</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-white">Ajustes</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-950/50 px-6 py-3 border-t border-gray-800">
            <div className="text-sm">
              <a href="/configuracion" className="font-medium text-blue-500 hover:text-blue-400 transition-colors">
                Ir a configuración &rarr;
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
