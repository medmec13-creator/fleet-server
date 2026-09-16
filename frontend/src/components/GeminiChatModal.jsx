import React, { useState } from 'react';
import { X, Send, Bot, User, Sparkles, Database, Terminal, Lightbulb } from 'lucide-react';
import { getLang } from '../i18n';
import { API, apiFetch } from '../apiConfig';

export default function GeminiChatModal({ isOpen, onClose, lang = 'fr' }) {
  if (!isOpen) return null;
  const t = getLang(lang);

  const initialMessage = lang === 'es'
    ? '¡Hola! Soy tu asistente de inteligencia de flota v4.0 conectado en vivo a tu base SQLite (306 600 viajes). Hazme preguntas sobre vehículos, conductores, costes o accidentes.'
    : 'Bonjour ! Je suis votre assistant virtuel Fleet Intelligence v4.0 connecté en direct à votre base SQLite (306 600 trajets). Posez-moi des questions sur vos véhicules, chauffeurs, coûts ou accidents !';

  const suggestedQuestions = lang === 'es' ? [
    "¿Cuáles son los conductores más seguros?",
    "Costes de mantenimiento por tipo",
    "¿Qué marca consume más combustible?",
    "Vehículos en riesgo crítico"
  ] : [
    "Quels sont les chauffeurs les plus sûrs ?",
    "Coûts de maintenance par type",
    "Quelle marque consomme le plus ?",
    "Véhicules à risque critique"
  ];

  const [messages, setMessages] = useState([
    { sender: 'bot', text: initialMessage }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendQuery = async (queryText) => {
    if (!queryText.trim()) return;

    setMessages(prev => [...prev, { sender: 'user', text: queryText }]);
    setInput('');
    setLoading(true);

    try {
      const res = await apiFetch('/api/ai/query', {
        method: 'POST',
        body: JSON.stringify({ prompt: queryText })
      });
      const data = await res.json();

      setMessages(prev => [...prev, {
        sender: 'bot',
        text: data.answer,
        sql: data.sql,
        tableData: data.data
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        sender: 'bot',
        text: lang === 'es' ? "Error al consultar la base SQLite." : "Désolé, une erreur est survenue lors de l'interrogation de la base SQLite."
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = () => sendQuery(input);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="glass-panel w-full max-w-3xl rounded-2xl border border-indigo-500/40 shadow-2xl flex flex-col h-[620px] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-gradient-to-r from-indigo-950/90 to-purple-950/90 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-white font-outfit">Assistant AI Fleet Intelligence v4.0</h3>
                <span className="px-2 py-0.5 text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full font-mono">
                  Live SQLite Engine
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {lang === 'es' ? 'Consultas SQL dinámicas en lenguaje natural' : 'Requêtes SQL dynamiques en langage naturel'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Suggested Chips Bar */}
        <div className="px-4 py-2 border-b border-slate-800/60 bg-slate-950/50 flex items-center gap-2 overflow-x-auto text-[11px]">
          <span className="text-slate-500 flex items-center gap-1 font-mono shrink-0">
            <Lightbulb className="w-3 h-3 text-amber-400" />
            Suggestions:
          </span>
          {suggestedQuestions.map((q, i) => (
            <button
              key={i}
              onClick={() => sendQuery(q)}
              className="px-2.5 py-1 rounded-lg bg-indigo-950/40 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-500/30 shrink-0 transition"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Chat Messages Body */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
          {messages.map((m, i) => (
            <div key={i} className={`flex items-start space-x-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.sender === 'bot' && (
                <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div className={`p-3.5 rounded-2xl max-w-[85%] leading-relaxed space-y-2 ${
                m.sender === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-none'
                  : 'bg-slate-900/90 text-slate-200 border border-slate-800 rounded-tl-none'
              }`}>
                <p>{m.text}</p>

                {/* Optional SQL badge */}
                {m.sql && (
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[10px] text-slate-400 flex items-center space-x-1.5 overflow-x-auto">
                    <Terminal className="w-3 h-3 text-indigo-400 shrink-0" />
                    <span className="text-indigo-300">{m.sql}</span>
                  </div>
                )}

                {/* Optional Result Table */}
                {m.tableData && m.tableData.length > 0 && (
                  <div className="overflow-x-auto pt-1 max-h-48 overflow-y-auto">
                    <table className="w-full text-left text-[11px] border-collapse">
                      <thead className="sticky top-0 bg-[#0d1526]">
                        <tr className="text-slate-400 border-b border-slate-800">
                          {Object.keys(m.tableData[0]).map((k, idx) => (
                            <th key={idx} className="pb-1.5 pr-3 font-semibold">{k}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40">
                        {m.tableData.map((row, rIdx) => (
                          <tr key={rIdx}>
                            {Object.values(row).map((val, cIdx) => (
                              <td key={cIdx} className="py-1 pr-3 text-slate-300 font-mono">{String(val)}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {m.sender === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center space-x-2 text-slate-400 text-xs">
              <Bot className="w-4 h-4 animate-spin text-indigo-400" />
              <span>Génération de la requête SQL et interrogation de fleet.db...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/90 flex items-center space-x-2">
          <input
            type="text"
            placeholder={lang === 'es' ? "Haz tu pregunta en lenguaje natural..." : "Posez votre question (ex: 'Quels sont les chauffeurs les plus sûrs ?')..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 bg-slate-800/90 border border-slate-700 text-slate-200 text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-indigo-500 transition"
          />
          <button
            onClick={handleSend}
            className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-md shadow-indigo-500/20 transition"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
