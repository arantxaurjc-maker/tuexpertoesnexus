// src/routes/cancel.tsx
// Página que se muestra si el usuario cancela el pago

export default function CancelPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Franja superior roja */}
        <div className="h-2 bg-gradient-to-r from-red-400 to-pink-500"></div>

        {/* Contenido */}
        <div className="p-8">
          {/* Icono de cancelación */}
          <div className="flex justify-center mb-6">
            <div className="flex items-center justify-center w-20 h-20 rounded-full bg-red-100">
              <svg
                className="w-10 h-10 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
          </div>

          {/* Título */}
          <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
            Pago cancelado
          </h1>
          <p className="text-center text-gray-600 mb-6">
            No se ha cobrado ninguna cantidad de tu cuenta
          </p>

          {/* Mensaje */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-900">
              Si cancelaste por error o tienes problemas, puedes intentar de nuevo en
              cualquier momento. El experto y tu sesión seguirán disponibles.
            </p>
          </div>

          {/* Opciones */}
          <div className="space-y-3">
            <a
              href="/"
              className="block w-full bg-blue-600 text-white text-center py-3 rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Volver al inicio
            </a>
            <a
              href="/explorar-expertos"
              className="block w-full bg-gray-100 text-gray-900 text-center py-3 rounded-lg hover:bg-gray-200 transition font-medium"
            >
              Seguir explorando expertos
            </a>
          </div>

          {/* Soporte */}
          <div className="mt-8 pt-6 border-t text-center text-sm text-gray-600">
            <p className="mb-2">¿Tienes algún problema?</p>
            <a
              href="mailto:soporte@tuexpertoesnexus.com"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Contacta a nuestro equipo de soporte
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
