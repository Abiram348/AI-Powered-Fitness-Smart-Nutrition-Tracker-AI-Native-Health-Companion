import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout } from '../components/Layout';
import { 
  MessageCircle, Send, Loader2, Trash2, Bot, User, 
  Dumbbell, Heart, Sparkles, FlaskConical, Settings2 
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PERSONA_CONFIG = {
  strict_coach: {
    name: 'Strict Coach',
    emoji: '🏋️',
    icon: Dumbbell,
    color: 'from-red-500 to-orange-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    textColor: 'text-red-400',
    description: 'Tough love, no excuses. Pushes you to your limits.',
  },
  friendly_buddy: {
    name: 'Friendly Buddy',
    emoji: '😊',
    icon: Heart,
    color: 'from-green-500 to-emerald-500',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    textColor: 'text-green-400',
    description: 'Your supportive best friend who makes fitness fun.',
  },
  motivational: {
    name: 'Motivational Speaker',
    emoji: '🔥',
    icon: Sparkles,
    color: 'from-yellow-500 to-amber-500',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    textColor: 'text-yellow-400',
    description: 'Inspiring words that ignite your passion.',
  },
  scientific: {
    name: 'Science Advisor',
    emoji: '🧬',
    icon: FlaskConical,
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    textColor: 'text-blue-400',
    description: 'Evidence-based guidance backed by science.',
  },
};

const QUICK_PROMPTS = [
  "What should I eat before a workout?",
  "Give me a quick 15-min workout",
  "How much water should I drink daily?",
  "Tips to improve my sleep quality",
  "How can I stay motivated?",
  "Best exercises for weight loss",
];

export const FitnessChatbot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState('friendly_buddy');
  const [showPersonaSelector, setShowPersonaSelector] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load persona and history on mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [personaRes, historyRes] = await Promise.all([
          axios.get(`${API}/chatbot/persona`),
          axios.get(`${API}/chatbot/history?limit=50`),
        ]);
        setSelectedPersona(personaRes.data.persona);
        if (historyRes.data.messages && historyRes.data.messages.length > 0) {
          setMessages(historyRes.data.messages);
        }
      } catch (error) {
        // If no history exists, that's fine
      } finally {
        setHistoryLoaded(true);
      }
    };
    loadInitialData();
  }, []);

  const handlePersonaChange = async (persona) => {
    try {
      await axios.put(`${API}/chatbot/persona`, { persona });
      setSelectedPersona(persona);
      setShowPersonaSelector(false);
      toast.success(`Switched to ${PERSONA_CONFIG[persona].name}!`);
    } catch (error) {
      toast.error('Failed to update persona');
    }
  };

  const sendMessage = async (messageText) => {
    const text = messageText || input.trim();
    if (!text || loading) return;

    const userMessage = {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await axios.post(`${API}/chatbot/message`, {
        message: text,
        persona: selectedPersona,
      });

      const botMessage = {
        role: 'assistant',
        content: response.data.reply,
        persona: response.data.persona,
        timestamp: response.data.timestamp,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to send message');
      // Remove the user message on error
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const clearHistory = async () => {
    try {
      await axios.delete(`${API}/chatbot/history`);
      setMessages([]);
      toast.success('Chat history cleared');
    } catch (error) {
      toast.error('Failed to clear history');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const currentPersona = PERSONA_CONFIG[selectedPersona];

  return (
    <Layout>
      <div className="container mx-auto px-4 md:px-6 py-6 max-w-4xl h-[calc(100vh-120px)] flex flex-col">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-4"
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-barlow font-black uppercase flex items-center gap-3">
              <MessageCircle className="w-8 h-8 text-primary" />
              Fitness Chat
            </h1>
            <p className="text-muted-foreground mt-1 uppercase text-xs tracking-widest">
              Your AI fitness companion — {currentPersona.emoji} {currentPersona.name}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPersonaSelector(!showPersonaSelector)}
              className="uppercase text-xs tracking-wider"
            >
              <Settings2 className="w-4 h-4 mr-2" />
              Persona
            </Button>
            {messages.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearHistory}
                className="uppercase text-xs tracking-wider text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear
              </Button>
            )}
          </div>
        </motion.div>

        {/* Persona Selector */}
        <AnimatePresence>
          {showPersonaSelector && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-4"
            >
              <div className="bg-card border border-border p-4 space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                  Choose Your Coach Style
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(PERSONA_CONFIG).map(([key, persona]) => {
                    const Icon = persona.icon;
                    return (
                      <button
                        key={key}
                        onClick={() => handlePersonaChange(key)}
                        className={`flex items-start gap-3 p-4 rounded-sm border transition-all text-left ${
                          selectedPersona === key
                            ? `${persona.borderColor} ${persona.bgColor}`
                            : 'border-border hover:border-white/20 hover:bg-white/5'
                        }`}
                      >
                        <div className={`p-2 rounded-sm bg-gradient-to-br ${persona.color}`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className={`font-bold text-sm ${selectedPersona === key ? persona.textColor : 'text-foreground'}`}>
                            {persona.emoji} {persona.name}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">{persona.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto bg-card border border-border p-4 space-y-4 min-h-0">
          {/* Welcome message */}
          {messages.length === 0 && historyLoaded && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center h-full text-center space-y-6 py-8"
            >
              <div className={`p-4 rounded-full bg-gradient-to-br ${currentPersona.color}`}>
                <Bot className="w-10 h-10 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-barlow font-black uppercase">
                  Hey there! {currentPersona.emoji}
                </h2>
                <p className="text-muted-foreground mt-2 max-w-md">
                  I'm your {currentPersona.name.toLowerCase()}. Ask me anything about workouts, 
                  nutrition, recovery, or fitness goals!
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                {QUICK_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => sendMessage(prompt)}
                    className="px-3 py-2 text-xs border border-border rounded-sm hover:bg-white/5 hover:border-primary/50 transition-colors text-muted-foreground hover:text-foreground"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Messages */}
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className={`flex-shrink-0 w-8 h-8 rounded-sm flex items-center justify-center bg-gradient-to-br ${currentPersona.color}`}>
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              <div
                className={`max-w-[80%] p-3 rounded-sm text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-primary text-black font-medium'
                    : 'bg-muted/50 border border-border text-foreground'
                }`}
              >
                {msg.content}
              </div>
              {msg.role === 'user' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-sm flex items-center justify-center bg-primary/20">
                  <User className="w-4 h-4 text-primary" />
                </div>
              )}
            </motion.div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3 items-center"
            >
              <div className={`flex-shrink-0 w-8 h-8 rounded-sm flex items-center justify-center bg-gradient-to-br ${currentPersona.color}`}>
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-muted/50 border border-border p-3 rounded-sm">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="mt-3 flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message your ${currentPersona.name.toLowerCase()}...`}
            className="flex-1"
            disabled={loading}
            data-testid="chatbot-input"
          />
          <Button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="px-4"
            data-testid="chatbot-send"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </Layout>
  );
};
