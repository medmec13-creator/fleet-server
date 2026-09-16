import React, { useState } from 'react';
import { X, BookOpen, LayoutDashboard, Cpu, Sliders, Radio, Wrench, Shield, Database, Sparkles, CheckCircle2, Globe, HelpCircle } from 'lucide-react';
import { getLang } from '../i18n';

export default function UserGuideModal({ isOpen, onClose, lang = 'fr' }) {
  if (!isOpen) return null;
  const t = getLang(lang);
  const [activeSection, setActiveSection] = useState('overview');

  const guideSections = lang === 'es' ? [
    { id: 'overview', label: '1. Visión General & Nav', icon: LayoutDashboard },
    { id: 'predictive', label: '2. IA Predictivo & CO₂', icon: Cpu },
    { id: 'simulator', label: '3. Simulador What-If', icon: Sliders },
    { id: 'iot', label: '4. Telemetría IoT Live', icon: Radio },
    { id: 'rul', label: '5. Usure RUL & Piezas', icon: Wrench },
    { id: 'chat', label: '6. Asistente IA Chat', icon: Sparkles },
    { id: 'explorer', label: '7. Explorador & CSV', icon: Database },
  ] : [
    { id: 'overview', label: '1. Vue d\'Ensemble & Nav', icon: LayoutDashboard },
    { id: 'predictive', label: '2. IA Prédictif & CO₂', icon: Cpu },
    { id: 'simulator', label: '3. Simulateur What-If', icon: Sliders },
    { id: 'iot', label: '4. Télémétrie IoT Live', icon: Radio },
    { id: 'rul', label: '5. Usure RUL & Pièces', icon: Wrench },
    { id: 'chat', label: '6. Assistant IA Chat', icon: Sparkles },
    { id: 'explorer', label: '7. Explorateur & CSV', icon: Database },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="glass-panel w-full max-w-4xl rounded-2xl border border-blue-500/40 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-blue-950/80 via-indigo-950/80 to-purple-950/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white font-outfit">
                {lang === 'es' ? 'Manuel de Uso — RifaragonPulse ERP v4.0' : 'Mode d\'Emploi & Guide d\'Utilisation — RifaragonPulse ERP v4.0'}
              </h3>
              <p className="text-xs text-slate-400">
                {lang === 'es' ? 'Guía completa para dominar la plataforma de flota' : 'Documentation complète et explications pas à pas de l\'outil'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Grid */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Section Navigation Column */}
          <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-800/80 bg-slate-950/60 p-3 space-y-1 overflow-y-auto shrink-0">
            {guideSections.map((sec) => {
              const Icon = sec.icon;
              const isActive = activeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  onClick={() => setActiveSection(sec.id)}
                  className={`w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{sec.label}</span>
                </button>
              );
            })}
          </div>

          {/* Section Content View */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6 text-xs text-slate-300 leading-relaxed">
            {activeSection === 'overview' && (
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-white font-outfit text-blue-400 flex items-center gap-2">
                  <LayoutDashboard className="w-4 h-4" />
                  {lang === 'es' ? '1. Visión General del Centro Ejecutivo' : '1. Vue d\'Ensemble du Centre de Contrôle'}
                </h4>
                <p>
                  {lang === 'es'
                    ? 'El Executive Hub procesa 306 600 viajes en tiempo real. Proporciona tarjetas KPI interactivas con minigráficos sparkline de tendencia:'
                    : 'Le Centre de Contrôle Exécutif agrège 306 600 trajets en temps réel. Il offre des cartes KPI haute densité avec mini-sparklines d\'évolution :'}
                </p>
                <ul className="list-disc pl-5 space-y-1 font-mono text-[11px] text-slate-300">
                  <li><strong>Facturación / Revenue:</strong> Suma total bruta del volumen transportado.</li>
                  <li><strong>Margen / Margin:</strong> Marge neta generada en € y porcentaje.</li>
                  <li><strong>Combustible / Fuel:</strong> Consumo medio (L/100km) y coste financiero.</li>
                  <li><strong>Filtros / Filters:</strong> Utilice el botón superior para filtrar por Año, Marca, Carburante y Anomalías.</li>
                </ul>
              </div>
            )}

            {activeSection === 'predictive' && (
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-white font-outfit text-indigo-400 flex items-center gap-2">
                  <Cpu className="w-4 h-4" />
                  {lang === 'es' ? '2. Inteligencia Predictiva & Huella CO₂' : '2. Intelligence Prédictive & Bilan Carbone ESG'}
                </h4>
                <p>
                  {lang === 'es'
                    ? 'Este módulo evalúa automáticamente el riesgo mecánico de avería (Score de 0 a 100) utilizando telemetría del motor:'
                    : 'Ce module évalue automatiquement le risque mécanique de panne (Score IA de 0 à 100) grâce à la télémétrie moteur :'}
                </p>
                <ul className="list-disc pl-5 space-y-1 font-mono text-[11px] text-slate-300">
                  <li><strong>Previsión 90 Días:</strong> Gráfico de pannes prévisibles (J+30, J+60, J+90).</li>
                  <li><strong>Bilan ESG:</strong> Emisiones totales en toneladas de CO₂ clasificadas por motorización.</li>
                  <li><strong>Ficha de Vehículo:</strong> Haga clic en cualquier vehículo prioritario para ver detalles y programar mantenimiento.</li>
                </ul>
              </div>
            )}

            {activeSection === 'simulator' && (
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-white font-outfit text-purple-400 flex items-center gap-2">
                  <Sliders className="w-4 h-4" />
                  {lang === 'es' ? '3. Simulador Financiero What-If' : '3. Simulateur Financier & Scénarios What-If'}
                </h4>
                <p>
                  {lang === 'es'
                    ? 'Permite simular el impacto en el margen neto variando 4 parámetros principales:'
                    : 'Permet de simuler l\'impact financier direct sur votre marge nette grâce à 4 curseurs de variation :'}
                </p>
                <ul className="list-disc pl-5 space-y-1 font-mono text-[11px] text-slate-300">
                  <li><strong>Cursores:</strong> Precio de venta (+/-20%), Combustible (+/-25%), Salarios (+/-20%), Mantenimiento (+/-30%).</li>
                  <li><strong>Boton Exportar:</strong> Descargue un informe completo del escenario simulado en archivo JSON.</li>
                  <li><strong>Boton Restablecer:</strong> Vuelve los valores a 0% para ver la baseline actual.</li>
                </ul>
              </div>
            )}

            {activeSection === 'iot' && (
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-white font-outfit text-cyan-400 flex items-center gap-2">
                  <Radio className="w-4 h-4" />
                  {lang === 'es' ? '4. Sensores de Telemetría IoT en Vivo' : '4. Télémétrie IoT & Capteurs Moteur Live'}
                </h4>
                <p>
                  {lang === 'es'
                    ? 'Monitoreo en directo de temperatura del motor, presión de neumáticos y estado de batería.'
                    : 'Surveillance en temps réel des sondes température moteur, pression des pneumatiques et état de la batterie.'}
                </p>
                <ul className="list-disc pl-5 space-y-1 font-mono text-[11px] text-slate-300">
                  <li><strong>Auto 10s ON/OFF:</strong> Refresco automático programado del feed IoT.</li>
                  <li><strong>Filtros de Estado:</strong> Vea únicamente vehículos en alerta (Sobrecalentamiento, Presión Baja).</li>
                  <li><strong>Eventos de Conducción:</strong> Muestra frenadas bruscas y excesos de velocidad.</li>
                </ul>
              </div>
            )}

            {activeSection === 'rul' && (
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-white font-outfit text-emerald-400 flex items-center gap-2">
                  <Wrench className="w-4 h-4" />
                  {lang === 'es' ? '5. Desgaste RUL & Gestión de Piezas' : '5. Usure RUL & Durée de Vie Restante'}
                </h4>
                <p>
                  {lang === 'es'
                    ? 'Pronóstico de usura de componentes mecánicos antes de la falla:'
                    : 'Prédiction du taux d\'usure des pièces mécaniques clés avant défaillance :'}
                </p>
                <ul className="list-disc pl-5 space-y-1 font-mono text-[11px] text-slate-300">
                  <li><strong>Indicadores:</strong> Pastillas de freno, Neumáticos, Vida restante del aceite.</li>
                  <li><strong>Boton Planificar Revisión:</strong> Registra la revisión de mantenimiento con confirmación visual.</li>
                </ul>
              </div>
            )}

            {activeSection === 'chat' && (
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-white font-outfit text-amber-400 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  {lang === 'es' ? '6. Asistente Virtual de Inteligencia' : '6. Assistant Virtuel & Requêtes SQL en Langage Naturel'}
                </h4>
                <p>
                  {lang === 'es'
                    ? 'Consulte la base de datos SQLite directamente usando lenguaje natural en español o francés.'
                    : 'Interrogez la base de données SQLite de 306 600 trajets en langage naturel :'}
                </p>
                <ul className="list-disc pl-5 space-y-1 font-mono text-[11px] text-slate-300">
                  <li><strong>Puces de Sugerencias:</strong> Haga clic en cualquier sugerencia predefinida para lanzar la consulta.</li>
                  <li><strong>Respuesta SQL:</strong> Muestra la sentencia SQL generada y una tabla de resultados en vivo.</li>
                </ul>
              </div>
            )}

            {activeSection === 'explorer' && (
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-white font-outfit text-teal-400 flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  {lang === 'es' ? '7. Explorador de Datos & Exportación CSV' : '7. Explorateur de Données & Exportation CSV'}
                </h4>
                <p>
                  {lang === 'es'
                    ? 'Búsqueda global y filtrado instantáneo en los registros:'
                    : 'Recherche globale et filtrage instantané sur l\'intégralité des enregistrements :'}
                </p>
                <ul className="list-disc pl-5 space-y-1 font-mono text-[11px] text-slate-300">
                  <li><strong>Boton Export CSV:</strong> Descarga la página o consulta actual en formato CSV.</li>
                  <li><strong>Icono Ojo (Ver):</strong> Abre la ficha telemétrica 360° detallada del viaje.</li>
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <span>RifaragonPulse ERP Manual · v4.0 Ultra</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition"
          >
            {lang === 'es' ? 'Entendido' : 'J\'ai Compris'}
          </button>
        </div>
      </div>
    </div>
  );
}
