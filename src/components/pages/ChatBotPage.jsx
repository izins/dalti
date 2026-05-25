import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Send, Bot, User, ArrowLeft, Sparkles, Loader2, RotateCcw, ChevronDown, CheckCircle } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { structuresAPI, ticketsAPI } from '../../api/client';

// Initialize Gemini API (key from environment)
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
if (!apiKey) {
  console.warn("Missing VITE_GEMINI_API_KEY environment variable. Chatbot will not function.");
}
const genAI = new GoogleGenerativeAI(apiKey || 'missing-key');
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// Animated typing dots
function TypingIndicator() {
  return (
    <div className="flex items-end gap-3 animate-fade-in">
      <div className="w-12 h-12 rounded-xl bg-amber-300 border-2 border-surface-900 flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0">
        <Bot size={24} className="text-surface-900" />
      </div>
      <div className="bg-white border-2 border-surface-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-2xl rounded-bl-md px-5 py-4">
        <div className="flex gap-1.5">
          <span className="w-2 h-2 bg-surface-900 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-surface-900 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-surface-900 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

// Single message bubble
function ChatMessage({ message, isLast }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex items-end gap-3 ${isUser ? 'flex-row-reverse' : ''} ${isLast ? 'animate-slide-up' : ''}`}>
      {/* Avatar */}
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border-2 border-surface-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
        isUser
          ? 'bg-sky-300'
          : 'bg-amber-300'
      }`}>
        {isUser ? <User size={24} className="text-surface-900" /> : <Bot size={24} className="text-surface-900" />}
      </div>

      {/* Bubble */}
      <div className={`max-w-[85%] lg:max-w-[75%] border-2 border-surface-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] px-5 py-4 ${
        isUser
          ? 'bg-sky-300 text-surface-900 rounded-2xl rounded-br-md'
          : 'bg-white text-surface-900 rounded-2xl rounded-bl-md'
      }`}>
        <div className="text-sm font-bold leading-relaxed whitespace-pre-wrap break-words chatbot-message-content">
          {message.content}
        </div>
        
        {message.isTicketSuccess && message.ticket && (
          <div className="mt-4 p-4 bg-emerald-300 border-2 border-surface-900 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-surface-900 uppercase tracking-widest bg-white px-2 py-0.5 rounded border-2 border-surface-900 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">Ticket Généré</span>
              <CheckCircle size={20} className="text-surface-900" />
            </div>
            <p className="text-4xl font-black text-surface-900 mb-1">#{message.ticket.number || '000'}</p>
            <p className="text-xs font-black uppercase text-surface-900 mb-4 bg-white/50 inline-block px-2 py-1 rounded border-2 border-surface-900">Temps estimé : {message.ticket.estimated_time || 0} min</p>
            <Link 
              to={`/ticket/${message.ticket.id}`}
              className="block text-center py-2.5 px-4 bg-surface-900 text-white text-sm font-black uppercase tracking-widest rounded-xl hover:-translate-y-1 transition-transform border-2 border-surface-900 shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]"
            >
              Voir le ticket en direct
            </Link>
          </div>
        )}

        <p className={`text-[10px] mt-2 font-black uppercase tracking-widest ${isUser ? 'text-surface-900/60 text-right' : 'text-surface-400'}`}>
          {message.time}
        </p>
      </div>
    </div>
  );
}

// Quick suggestion chips
function SuggestionChips({ onSelect }) {
  const suggestions = [
    { text: '🏦 Retirer de l\'argent', value: 'Je veux retirer de l\'argent' },
    { text: '📮 Envoyer un colis', value: 'Je veux envoyer un colis' },
    { text: '🆔 Carte d\'identité', value: 'Je dois renouveler ma carte d\'identité' },
    { text: '📋 Mes tickets', value: 'Quels sont mes tickets actifs ?' },
    { text: '💰 نسحب فلوس', value: 'أنا محتاج نسحب فلوس' },
  ];

  return (
    <div className="flex flex-wrap gap-3 px-1">
      {suggestions.map((s, i) => (
        <button
          key={i}
          onClick={() => onSelect(s.value)}
          className="px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl border-2 border-surface-900 text-surface-900 bg-emerald-300 hover:bg-emerald-400 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-y-0 cursor-pointer"
        >
          {s.text}
        </button>
      ))}
    </div>
  );
}

export default function ChatBotPage() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Merhba bik! 👋 Je suis l\'assistant DALTI.\n\nJe peux vous aider à :\n• 🔍 Trouver un service ou une structure (le plus rapide)\n• 🎫 Prendre un ticket de file d\'attente\n• 📊 Suivre vos tickets actifs\n\nDites-moi de quoi vous avez besoin et dans quelle wilaya !',
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [contextData, setContextData] = useState(null);
  const [chatSession, setChatSession] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const chatContainerRef = useRef(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  // Auto scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Detect if user has scrolled up
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 100);
    };
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load context and initialize chat session
  useEffect(() => {
    const initChat = async () => {
      try {
        const res = await structuresAPI.list();
        // Enrich context with actual waiting info and services
        const structs = res.structures || res;
        
        // Fetch services for each structure to build a complete map
        const enrichedStructs = await Promise.all(
          structs.map(async (s) => {
            try {
              const sRes = await structuresAPI.getServices(s.id);
              return { ...s, available_services: sRes.services || sRes };
            } catch {
              return { ...s, available_services: [] };
            }
          })
        );
        
        setContextData(enrichedStructs);

        const promptContext = `
Tu es l'assistant intelligent de DALTI, une plateforme de gestion de file d'attente en Algérie.
Ton rôle est d'aider les utilisateurs à trouver la meilleure structure pour leur besoin, en tenant compte de leur localisation (Wilaya), du service souhaité, et du temps d'attente actuel (le nombre de personnes en attente 'total_waiting').
Parle en français ou en derja selon l'utilisateur. Sois chaleureux, concis et utile.

Voici les données en temps réel des structures et services disponibles:
${JSON.stringify(enrichedStructs, null, 2)}

RÈGLES IMPORTANTES:
1. Si l'utilisateur cherche un service sans préciser sa wilaya, demande-lui sa wilaya.
2. S'il précise la wilaya, propose-lui la structure la plus rapide (celle avec le moins de 'total_waiting' offrant ce service).
3. S'il est prêt à prendre un ticket, tu dois LUI DEMANDER CONFIRMATION.
4. Une fois qu'il confirme vouloir prendre le ticket dans une structure précise pour un service précis, tu DOIS ABSOLUMENT inclure à la FIN de ton message le bloc JSON exact suivant, et rien d'autre après ce bloc:
ACTION_TAKE_TICKET: {"structure_id": "L_ID_DE_LA_STRUCTURE", "service_id": "L_ID_DU_SERVICE"}

Ne mets pas ACTION_TAKE_TICKET tant qu'il n'a pas explicitement validé la structure et le service.
        `;

        const session = model.startChat({
          history: [
            {
              role: "user",
              parts: [{ text: promptContext }],
            },
            {
              role: "model",
              parts: [{ text: "Compris. Je suis prêt à aider l'utilisateur avec ces données en temps réel." }],
            }
          ]
        });
        
        setChatSession(session);
      } catch (err) {
        console.error("Failed to init chat context", err);
      }
    };
    initChat();
  }, []);

  const sendMessage = async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || isLoading || !chatSession) return;

    const userMsg = {
      role: 'user',
      content: trimmed,
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const result = await chatSession.sendMessage(trimmed);
      let botReply = result.response.text();
      
      // Check for ACTION_TAKE_TICKET
      const actionMatch = botReply.match(/ACTION_TAKE_TICKET:\s*({[\s\S]*?})/);
      let ticketSuccessMsg = null;

      if (actionMatch) {
        try {
          // Clean up potential markdown formatting from JSON
          let jsonString = actionMatch[1];
          jsonString = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();
          
          const actionData = JSON.parse(jsonString);
          botReply = botReply.replace(actionMatch[0], '').trim();
          
          // Execute ticket booking
          const ticketRes = await ticketsAPI.take(actionData.structure_id, actionData.service_id);
          const newTicket = ticketRes.ticket || ticketRes;
          
          ticketSuccessMsg = {
            role: 'assistant',
            isTicketSuccess: true,
            ticket: newTicket,
            content: "🎉 C'est fait ! Votre ticket a été généré avec succès.",
            time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          };
        } catch (ticketErr) {
          console.error("Ticket booking failed via chatbot:", ticketErr);
          botReply += "\n\n⚠️ Oups, une erreur s'est produite lors de la création du ticket. Vérifiez que la file n'est pas fermée.";
        }
      }

      setMessages(prev => {
        const newMsgs = [...prev, {
          role: 'assistant',
          content: botReply,
          time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        }];
        if (ticketSuccessMsg) newMsgs.push(ticketSuccessMsg);
        return newMsgs;
      });

    } catch (err) {
      console.error('Chatbot error:', err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `⚠️ Erreur de connexion au cerveau: ${err.message || String(err)}. Veuillez réessayer.`,
        time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      }]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      content: 'Conversation réinitialisée 🔄\n\nComment puis-je vous aider ?',
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    }]);
  };

  return (
    <div className="flex flex-col h-screen bg-[#FDFBF7]">

      {/* ============ HEADER ============ */}
      <header className="bg-white border-b-4 border-surface-900 px-4 lg:px-6 shrink-0 relative z-20">
        <div className="max-w-4xl mx-auto flex items-center justify-between h-20">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="w-12 h-12 rounded-xl bg-surface-900 flex items-center justify-center text-white hover:bg-surface-800 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5"
            >
              <ArrowLeft size={24} />
            </Link>
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-amber-300 flex items-center justify-center border-2 border-surface-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <Bot size={28} className="text-surface-900" />
                </div>
                <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 border-2 border-surface-900 rounded-full animate-pulse-dot" />
              </div>
              <div>
                <h1 className="font-black text-surface-900 text-lg uppercase tracking-tight leading-tight">DALTI Assistant</h1>
                <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  En ligne
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={clearChat}
              className="w-12 h-12 rounded-xl flex items-center justify-center text-surface-900 bg-rose-300 hover:bg-rose-400 border-2 border-surface-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-transform"
              title="Nouvelle conversation"
            >
              <RotateCcw size={20} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </header>

      {/* ============ MESSAGES AREA ============ */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto relative">
        <div className="max-w-4xl mx-auto px-4 lg:px-6 py-6 space-y-6">

          {/* Welcome card (shown only at start) */}
          {messages.length <= 1 && (
            <div className="bg-violet-300 rounded-[2rem] p-8 border-4 border-surface-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8 animate-fade-in">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
                <div className="w-20 h-20 rounded-2xl bg-white border-4 border-surface-900 flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] shrink-0">
                  <Sparkles size={40} className="text-surface-900" />
                </div>
                <div>
                  <h2 className="font-black text-surface-900 text-2xl mb-3 uppercase tracking-tight">Bienvenue sur l'assistant DALTI</h2>
                  <p className="text-base font-bold text-surface-800 leading-relaxed max-w-xl">
                    Je comprends le <strong className="bg-white px-2 py-0.5 rounded border-2 border-surface-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">français</strong> et l'<strong className="bg-white px-2 py-0.5 rounded border-2 border-surface-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">arabe algérien</strong> (derja).
                    Décrivez simplement votre besoin et je m'occupe du reste.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg, i) => (
            <ChatMessage key={i} message={msg} isLast={i === messages.length - 1} />
          ))}

          {/* Typing indicator */}
          {isLoading && <TypingIndicator />}

          {/* Suggestions after first message */}
          {messages.length === 1 && !isLoading && (
            <div className="animate-fade-in mt-4">
              <p className="text-xs font-semibold text-surface-400 uppercase tracking-widest mb-3 px-1">Suggestions rapides</p>
              <SuggestionChips onSelect={(val) => sendMessage(val)} />
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Scroll to bottom fab */}
        {showScrollBtn && (
          <button
            onClick={scrollToBottom}
            className="fixed bottom-32 right-6 lg:right-[calc(50%-28rem)] w-14 h-14 rounded-full bg-amber-300 border-2 border-surface-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center text-surface-900 hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all z-30 animate-fade-in"
          >
            <ChevronDown size={28} strokeWidth={3} />
          </button>
        )}
      </div>

      {/* ============ INPUT BAR ============ */}
      <div className="bg-white border-t-4 border-surface-900 px-4 lg:px-6 py-6 shrink-0">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Écrivez votre message... / اكتب رسالتك..."
                rows={1}
                className="w-full resize-none bg-white border-2 border-surface-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-2xl px-6 py-4 pr-16 text-base font-bold text-surface-900 placeholder:text-surface-400 focus:outline-none focus:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] focus:-translate-y-0.5 transition-all max-h-32"
                style={{ minHeight: '56px' }}
                onInput={(e) => {
                  e.target.style.height = '56px';
                  e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
                }}
                disabled={isLoading}
                id="chatbot-message-input"
              />
            </div>
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isLoading}
              className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shrink-0 border-2 border-surface-900 ${
                input.trim() && !isLoading
                  ? 'bg-emerald-300 text-surface-900 hover:-translate-y-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] cursor-pointer'
                  : 'bg-surface-200 text-surface-400 cursor-not-allowed shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
              }`}
              id="chatbot-send-button"
            >
              {isLoading ? (
                <Loader2 size={24} className="animate-spin" />
              ) : (
                <Send size={24} className={input.trim() && !isLoading ? "translate-x-0.5 -translate-y-0.5" : ""} />
              )}
            </button>
          </div>
          <p className="text-center text-[10px] text-surface-500 mt-4 font-black uppercase tracking-widest">
            DALTI Assistant · Propulsé par Gemini AI · FR / عربي
          </p>
        </div>
      </div>
    </div>
  );
}
