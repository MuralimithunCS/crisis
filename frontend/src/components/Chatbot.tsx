import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Loader2 } from 'lucide-react';
import axios from 'axios';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function Chatbot({ context }: { context?: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Hello! I am CrisisIQ Assistant. How can I help you regarding emergency preparedness or active disasters?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const generateResponse = (userMsg: string) => {
    const txt = userMsg.toLowerCase();
    
    if (txt.includes('flood') || txt.includes('water') || txt.includes('rain')) {
      if (context?.weather?.humidity > 70) {
        return "🌧 Flood risk is increasing due to heavy regional humidity and potential rainfall. Move to higher ground immediately and avoid flooded roads.";
      }
      return "Move to higher ground immediately and avoid flooded roads. Do not attempt to cross flowing water.";
    }
    
    if (txt.includes('earthquake') || txt.includes('quake')) {
      return "Drop, cover, and hold on. Stay away from windows, outer walls, and heavy furniture.";
    }

    if (txt.includes('safe') || txt.includes('evacuate') || txt.includes('zone') || txt.includes('where')) {
      if (context?.riskLevel === 'Red') {
        return "🚨 Immediate evacuation is recommended based on current conditions. Please select the critical disaster on your map to generate the closest safe zone routing.";
      }
      return "I can help you locate the nearest safe zone. Please click a disaster marker on your map to generate an evacuation route.";
    }

    if (txt.includes('fire') || txt.includes('burn')) {
      return "Evacuate upwind of the fire. Seal all doors and windows if trapped inside, and dial local emergency services immediately.";
    }
    
    if (txt.includes('sos') || txt.includes('help') || txt.includes('emergency')) {
      return "If you are in immediate danger, please use the red SOS Alert button at the top right of your dashboard to broadcast your location to nearest responders.";
    }

    return "I analyze real-time disaster metrics and provide survival guidelines for floods, earthquakes, and fires. How can I help you today?";
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      // Priority 1: Contact OpenAI LLM Python API
      const response = await axios.post('http://127.0.0.1:8000/chat', { message: userMsg });
      if (response.data && response.data.response) {
        setMessages(prev => [...prev, { role: 'assistant', content: response.data.response }]);
      }
      setIsLoading(false);
    } catch (err) {
      // Fallback: Use precise contextual browser-graph
      setTimeout(() => {
        const resp = generateResponse(userMsg);
        setMessages(prev => [...prev, { role: 'assistant', content: resp }]);
        setIsLoading(false);
      }, 800 + Math.random() * 500);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 p-4 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.5)] bg-gradient-to-br from-blue-500 to-indigo-600 text-white hover:scale-110 transition-transform z-50 ${isOpen ? 'scale-0' : 'scale-100'}`}
      >
        <MessageSquare className="w-6 h-6 animate-pulse" />
      </button>

      {/* Glassmorphic Chat Window */}
      <div
        className={`fixed bottom-6 right-6 w-96 h-[500px] bg-[#0f172a]/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)] flex flex-col transition-all origin-bottom-right z-50 ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}
      >
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 rounded-t-2xl text-white flex justify-between items-center shadow-md">
          <h3 className="font-bold tracking-widest uppercase text-sm flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            CrisisIQ AI Link
          </h3>
          <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1.5 rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] p-3 text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm' : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-2xl rounded-tl-sm'}`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-800 border border-slate-700 p-3 rounded-2xl rounded-tl-sm flex gap-2 items-center text-slate-400 text-xs tracking-widest uppercase">
                <Loader2 className="w-3 h-3 animate-spin text-blue-500" /> Processing...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSend} className="p-4 border-t border-slate-700/50 bg-[#0f172a]/50 rounded-b-2xl">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Query emergency protocols..."
              className="flex-1 px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
