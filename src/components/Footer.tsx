import { useState } from 'react'
import { X, Mail, HelpCircle, Shield, FileText } from 'lucide-react'
import TuneTVLogo from './TuneTVLogo'

function FooterModal({ title, icon: Icon, content, isOpen, onClose }: { title: string, icon: any, content: string, isOpen: boolean, onClose: () => void }) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-[#181818] rounded-lg shadow-2xl border border-[#2F2F2F] w-full max-w-2xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-[#2F2F2F] sticky top-0 bg-[#181818] z-10">
          <div className="flex items-center gap-3">
            <Icon className="w-6 h-6 text-[#E50914]" />
            <h2 className="text-2xl font-bold text-white">{title}</h2>
          </div>
          <button onClick={onClose} className="text-[#808080] hover:text-white transition-colors"><X className="w-6 h-6" /></button>
        </div>
        <div className="p-6 text-[#B3B3B3] leading-relaxed whitespace-pre-line text-sm md:text-base">
          {content}
        </div>
      </div>
    </div>
  )
}

export default function Footer() {
  const [activeModal, setActiveModal] = useState<string | null>(null)

  const modals = {
    terminos: {
      title: 'Términos y Condiciones',
      icon: FileText,
      content: `ÚLTIMA ACTUALIZACIÓN: 2026

1. ACEPTACIÓN DE LOS TÉRMINOS
Al acceder y utilizar TuneTV, usted acepta estar sujeto a estos Términos y Condiciones. Si no está de acuerdo, debe abstenerse de utilizar la plataforma.

2. EXENCIÓN DE RESPONSABILIDAD (IMPORTANTE)
TuneTV actúa únicamente como un agregador de enlaces y un reproductor de contenido proporcionado por terceros. NO alojamos, transmitimos ni poseemos ningún contenido de video, canal o programación. 

El usuario reconoce y acepta que utiliza cualquier stream, canal o programación de terceros estrictamente bajo su propio riesgo. TuneTV se exime total y absolutamente de cualquier responsabilidad legal, civil o penal derivada del uso, mal uso, o visualización de contenido no autorizado, con derechos de autor o ilegal a través de nuestra aplicación.

3. USO DEL SERVICIO
Queda estrictamente prohibido utilizar TuneTV para fines ilegales, distribuir contenido protegido sin licencia o intentar manipular la infraestructura de la plataforma.`
    },
    privacidad: {
      title: 'Política de Privacidad',
      icon: Shield,
      content: `ÚLTIMA ACTUALIZACIÓN: 2026

1. RECOPILACIÓN DE DATOS
En TuneTV, respetamos su privacidad. Solo recopilamos la información estrictamente necesaria para el funcionamiento del servicio:
- Correo electrónico (para autenticación de cuenta).
- Preferencias de usuario (lista de favoritos, configuración de reproducción).
- Datos de sesión (para mantener su inicio de sesión activo de forma segura).

2. PROTECCIÓN DE DATOS
Sus datos se almacenan de forma encriptada y segura. NUNCA vendemos, alquilamos ni compartimos su información personal con terceros, anunciantes o empresas de marketing.

3. DERECHOS DEL USUARIO
Usted tiene derecho a acceder, modificar o eliminar su cuenta y todos sus datos asociados en cualquier momento desde el panel de Configuración. Al eliminar su cuenta, todos sus datos se borran permanentemente de nuestros servidores.`
    },
    ayuda: {
      title: 'Centro de Ayuda y FAQ',
      icon: HelpCircle,
      content: `PREGUNTAS FRECUENTES

1. ¿Cómo reproduzco un canal o película?
Simplemente haga clic en la tarjeta del contenido. El reproductor se abrirá automáticamente.

2. ¿Cómo envío el video a mi Smart TV (Chromecast/AirPlay)?
Dentro del reproductor, haga clic en el ícono de "Cast" (rectángulo con ondas). Seleccione su dispositivo en la lista. Asegúrese de que su TV y su dispositivo estén en la misma red Wi-Fi.

3. ¿Cómo guardo mis canales favoritos?
Haga clic en el ícono de Corazón (❤️) en cualquier tarjeta de canal. Sus favoritos aparecerán en la sección "Mis Favoritos" en la parte superior de cada categoría.

4. El stream no carga o se buferiza, ¿qué hago?
- Verifique su conexión a internet.
- El stream de origen (tercero) podría estar caído temporalmente. Intente con otro canal.
- Limpie la caché de su navegador o intente en modo incógnito.`
    },
    contacto: {
      title: 'Contacto y Soporte',
      icon: Mail,
      content: `¿NECESITA AYUDA?

Estamos aquí para asistirle con problemas técnicos o consultas generales sobre la plataforma.

📧 CORREO ELECTRÓNICO DE SOPORTE:
soporte@tunetv.com

⏰ HORARIO DE ATENCIÓN:
Lunes a Viernes: 9:00 AM - 6:00 PM (Hora local)

NOTA IMPORTANTE:
Para consultas sobre contenido específico (canales que no cargan, películas faltantes), por favor incluya en su correo el nombre del contenido y una captura de pantalla del error. Recuerde que TuneTV no controla la disponibilidad de los streams de terceros.`
    }
  }

  return (
    <>
      <footer className="border-t border-white/5 mt-20 bg-[#0a0a0a]">
        <div className="max-w-[1920px] mx-auto px-4 md:px-12 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <TuneTVLogo size={32}/>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold text-white">TUNE</span>
                <span className="text-lg font-bold text-[#E50914]">TV</span>
              </div>
              <span className="text-sm text-[#808080] ml-2">© 2026</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-[#808080]">
              <button onClick={() => setActiveModal('terminos')} className="hover:text-white transition-colors">Términos</button>
              <button onClick={() => setActiveModal('privacidad')} className="hover:text-white transition-colors">Privacidad</button>
              <button onClick={() => setActiveModal('ayuda')} className="hover:text-white transition-colors">Ayuda</button>
              <button onClick={() => setActiveModal('contacto')} className="hover:text-white transition-colors">Contacto</button>
            </div>
          </div>
        </div>
      </footer>

      {activeModal && modals[activeModal as keyof typeof modals] && (
        <FooterModal 
          title={modals[activeModal as keyof typeof modals].title}
          icon={modals[activeModal as keyof typeof modals].icon}
          content={modals[activeModal as keyof typeof modals].content}
          isOpen={!!activeModal}
          onClose={() => setActiveModal(null)}
        />
      )}
    </>
  )
}
