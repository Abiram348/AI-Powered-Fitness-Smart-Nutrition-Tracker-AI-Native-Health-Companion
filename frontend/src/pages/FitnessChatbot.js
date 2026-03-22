import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout } from '../components/Layout';
import { Coach3D } from '../components/Coach3D';
import {
  MessageCircle, Send, Loader2, Trash2, Bot, User,
  Mic, MicOff, Volume2, VolumeX, ArrowLeft, Sparkles, Settings,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// ======== COACH DATA (mirrors backend) ========
const COACHES = {
  marcus: {
    name: 'Coach Marcus',
    gender: 'male',
    tagline: 'Military-style discipline. Zero excuses.',
    accentColor: '#ef4444',
    gradient: 'from-red-500 to-orange-600',
    emoji: '🎖️',
    greeting: "Drop and give me 20, recruit! Ready to get serious?",
  },
  alex: {
    name: 'Coach Alex',
    gender: 'male',
    tagline: 'Your chill bro who keeps it real.',
    accentColor: '#22c55e',
    gradient: 'from-green-500 to-emerald-600',
    emoji: '😎',
    greeting: "Hey! What's up? Ready to crush some goals together? 💪",
  },
  dr_raj: {
    name: 'Dr. Raj',
    gender: 'male',
    tagline: 'Evidence-based. Data-driven. Science first.',
    accentColor: '#3b82f6',
    gradient: 'from-blue-500 to-cyan-600',
    emoji: '🧬',
    greeting: "Welcome! Let's optimize your fitness with science-backed strategies.",
  },
  maya: {
    name: 'Coach Maya',
    gender: 'female',
    tagline: 'Empowering strength through positivity.',
    accentColor: '#a855f7',
    gradient: 'from-purple-500 to-violet-600',
    emoji: '🔥',
    greeting: "You are UNSTOPPABLE! Let's unlock your full potential! 🔥",
  },
  sophia: {
    name: 'Dr. Sophia',
    gender: 'female',
    tagline: 'Holistic wellness. Mind, body & soul.',
    accentColor: '#ec4899',
    gradient: 'from-pink-500 to-rose-600',
    emoji: '🌸',
    greeting: "Welcome to your safe space. Let's nurture your mind and body together.",
  },
};

const QUICK_PROMPTS = [
  "What should I eat before a workout?",
  "Give me a quick 15-min workout",
  "I'm feeling tired today...",
  "How can I stay motivated?",
  "Best exercises for weight loss",
  "Help me with my meal plan",
];

// ======== SPEECH HOOK ========
const useSpeechRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let text = '';
        for (let i = 0; i < event.results.length; i++) {
          text += event.results[i][0].transcript;
        }
        setTranscript(text);
      };

      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  }, []);

  const startListening = useCallback(() => {
    if (recognitionRef.current) {
      setTranscript('');
      recognitionRef.current.start();
      setIsListening(true);
    } else {
      toast.error('Speech recognition not supported in this browser');
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  return { isListening, transcript, startListening, stopListening, supported: !!recognitionRef.current };
};

const useSpeechSynthesis = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  const speak = useCallback((text, coachGender) => {
    if (!voiceEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();

    // Try to match a voice to the coach gender
    const preferredVoice = voices.find(v => {
      const name = v.name.toLowerCase();
      if (coachGender === 'female') {
        return name.includes('samantha') || name.includes('victoria') || name.includes('karen') ||
               name.includes('female') || name.includes('zira') || name.includes('susan');
      }
      return name.includes('daniel') || name.includes('alex') || name.includes('david') ||
             name.includes('male') || name.includes('james') || name.includes('mark');
    });

    if (preferredVoice) utterance.voice = preferredVoice;
    utterance.rate = 1.0;
    utterance.pitch = coachGender === 'female' ? 1.1 : 0.9;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [voiceEnabled]);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  return { isSpeaking, voiceEnabled, setVoiceEnabled, speak, stop };
};

// Coach selection has moved to Profile page

// ======== CHARACTER TYPING EFFECT ========
const TypewriterText = ({ text, speed = 15, onComplete }) => {
  const [displayed, setDisplayed] = useState('');
  const indexRef = useRef(0);

  useEffect(() => {
    setDisplayed('');
    indexRef.current = 0;
    const interval = setInterval(() => {
      if (indexRef.current < text.length) {
        setDisplayed(text.slice(0, indexRef.current + 1));
        indexRef.current++;
      } else {
        clearInterval(interval);
        if (onComplete) onComplete();
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed, onComplete]);

  return <span>{displayed}<span className="animate-pulse">|</span></span>;
};

// ======== SENTIMENT INDICATOR ========
const SentimentIndicator = ({ sentiment }) => {
  const config = {
    positive: { emoji: '😊', label: 'Positive', color: '#22c55e' },
    negative: { emoji: '😟', label: 'Needs Support', color: '#ef4444' },
    curious: { emoji: '🤔', label: 'Curious', color: '#3b82f6' },
    greeting: { emoji: '👋', label: 'Greeting', color: '#f59e0b' },
    neutral: { emoji: '😐', label: 'Neutral', color: '#6b7280' },
  };
  const s = config[sentiment] || config.neutral;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
      style={{ backgroundColor: `${s.color}20`, color: s.color }}
    >
      {s.emoji} {s.label}
    </motion.div>
  );
};

// ======== MAIN CHATBOT ========
export const FitnessChatbot = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [coachMood, setCoachMood] = useState('idle');
  const [coachEnergy, setCoachEnergy] = useState(1);
  const [moodBubble, setMoodBubble] = useState('');
  const [isTalking, setIsTalking] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [typingMessageId, setTypingMessageId] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const { isListening, transcript, startListening, stopListening } = useSpeechRecognition();
  const { isSpeaking, voiceEnabled, setVoiceEnabled, speak, stop: stopSpeech } = useSpeechSynthesis();

  // Populate voices
  useEffect(() => {
    window.speechSynthesis?.getVoices();
    window.speechSynthesis?.addEventListener('voiceschanged', () => {});
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Update input from speech
  useEffect(() => {
    if (transcript) setInput(transcript);
  }, [transcript]);

  // Auto-send when speech stops
  useEffect(() => {
    if (!isListening && transcript) {
      const timer = setTimeout(() => {
        if (transcript.trim()) {
          sendMessage(transcript.trim());
        }
      }, 500);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isListening, transcript]);

  // Load coach preference and history
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [personaRes, historyRes] = await Promise.all([
          axios.get(`${API}/chatbot/persona`),
          axios.get(`${API}/chatbot/history?limit=50`),
        ]);
        setSelectedCoach(personaRes.data.persona);
        if (historyRes.data.messages?.length > 0) {
          setMessages(historyRes.data.messages);
        }
      } catch (err) {
        // No saved coach — set default
        setSelectedCoach('alex');
      } finally {
        setHistoryLoaded(true);
      }
    };
    loadInitialData();
  }, []);

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
    setCoachMood('thinking');
    setMoodBubble('Hmm...');

    try {
      const response = await axios.post(`${API}/chatbot/message`, {
        message: text,
        persona: selectedCoach,
      });

      const { reply, user_sentiment, reply_sentiment, coach_name } = response.data;

      // Update coach mood based on reply sentiment
      setCoachMood(reply_sentiment?.mood || 'idle');
      setCoachEnergy(reply_sentiment?.energy || 1);
      setIsTalking(true);

      const moodBubbles = {
        celebrating: '🎉 Yes!',
        encouraging: '💪 You got this!',
        thinking: '🧠 Interesting...',
        waving: '👋 Hey!',
      };
      setMoodBubble(moodBubbles[reply_sentiment?.mood] || '');

      const botMessage = {
        id: Date.now(),
        role: 'assistant',
        content: reply,
        persona: response.data.persona,
        coach_name: coach_name,
        timestamp: response.data.timestamp,
        user_sentiment: user_sentiment?.sentiment,
        reply_sentiment: reply_sentiment?.sentiment,
      };

      setMessages((prev) => [...prev, botMessage]);
      setTypingMessageId(botMessage.id);

      // Speak response
      if (voiceEnabled && COACHES[selectedCoach]) {
        speak(reply, COACHES[selectedCoach].gender);
      }

      // Clear talking state after a delay proportional to text length
      setTimeout(() => {
        setIsTalking(false);
        setMoodBubble('');
        setCoachMood('idle');
      }, Math.min(reply.length * 40, 8000));

    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to send message');
      setMessages((prev) => prev.slice(0, -1));
      setCoachMood('encouraging');
      setMoodBubble('Oops!');
      setTimeout(() => { setCoachMood('idle'); setMoodBubble(''); }, 2000);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const clearHistory = async () => {
    try {
      await axios.delete(`${API}/chatbot/history`);
      setMessages([]);
      stopSpeech();
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

  // No coach screen — just use the chat
  if (!selectedCoach && !historyLoaded) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64 text-muted-foreground">Loading chat...</div>
      </Layout>
    );
  }

  const coach = COACHES[selectedCoach] || COACHES.alex;

  return (
    <Layout>
      <div className="container mx-auto px-4 md:px-6 py-4 max-w-6xl h-[calc(100vh-100px)] flex flex-col">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-3"
        >
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="mr-1"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg"
              style={{ background: `linear-gradient(135deg, ${coach.accentColor}, ${coach.accentColor}bb)` }}
            >
              {coach.emoji}
            </div>
            <div>
              <h1 className="text-xl font-barlow font-black uppercase flex items-center gap-2">
                {coach.name}
                {isSpeaking && (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                  >
                    <Volume2 className="w-4 h-4 text-primary" />
                  </motion.div>
                )}
              </h1>
              <p className="text-xs text-muted-foreground uppercase tracking-widest">
                {coach.tagline}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => { setVoiceEnabled(!voiceEnabled); if (isSpeaking) stopSpeech(); }}
              className={`w-9 h-9 ${voiceEnabled ? 'text-primary' : 'text-muted-foreground'}`}
              title={voiceEnabled ? 'Disable voice' : 'Enable voice'}
            >
              {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/profile')}
              className="uppercase text-xs tracking-wider"
            >
              <Settings className="w-3 h-3 mr-1" />
              Change Coach
            </Button>
            {messages.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearHistory}
                className="uppercase text-xs tracking-wider text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </motion.div>

        {/* Main Area — Coach + Chat side by side on desktop */}
        <div className="flex-1 flex gap-4 min-h-0 overflow-hidden">
          {/* 3D Coach Panel (hidden on small screens) */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="hidden lg:flex flex-col items-center justify-center w-64 bg-card border border-border rounded-lg p-4"
            style={{
              background: `radial-gradient(circle at 50% 80%, ${coach.accentColor}08, transparent 70%)`,
            }}
          >
            <Coach3D
              coachId={selectedCoach}
              mood={coachMood}
              isTalking={isTalking}
              energy={coachEnergy}
              moodBubble={moodBubble}
            />
            <div className="mt-4 text-center">
              <p className="text-sm font-bold">{coach.name}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {coachMood === 'thinking' ? '🤔 Thinking...' :
                 coachMood === 'celebrating' ? '🎉 Celebrating!' :
                 coachMood === 'encouraging' ? '💪 Encouraging!' :
                 coachMood === 'waving' ? '👋 Hello!' :
                 isTalking ? '💬 Speaking...' : '😊 Ready'}
              </p>
            </div>

            {/* Live Sentiment Display */}
            {messages.length > 0 && messages[messages.length - 1].user_sentiment && (
              <div className="mt-3">
                <SentimentIndicator sentiment={messages[messages.length - 1].user_sentiment} />
              </div>
            )}
          </motion.div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto bg-card border border-border rounded-lg p-4 space-y-4 min-h-0">
              {/* Welcome */}
              {messages.length === 0 && historyLoaded && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center h-full text-center space-y-6 py-8"
                >
                  {/* Mobile: show small coach */}
                  <div className="lg:hidden" style={{ transform: 'scale(0.7)', transformOrigin: 'center', height: 200 }}>
                    <Coach3D coachId={selectedCoach} mood="waving" energy={3} />
                  </div>

                  <div className="hidden lg:block">
                    <div
                      className="p-4 rounded-full mx-auto"
                      style={{
                        background: `linear-gradient(135deg, ${coach.accentColor}, ${coach.accentColor}88)`,
                        width: 72, height: 72,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <Bot className="w-8 h-8 text-white" />
                    </div>
                  </div>

                  <div>
                    <h2 className="text-2xl font-barlow font-black uppercase">
                      {coach.greeting}
                    </h2>
                    <p className="text-muted-foreground mt-2 max-w-md mx-auto text-sm">
                      Ask me anything about workouts, nutrition, recovery, or fitness goals.
                      You can type or use your voice! 🎤
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                    {QUICK_PROMPTS.map((prompt, idx) => (
                      <motion.button
                        key={idx}
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => sendMessage(prompt)}
                        className="px-3 py-2 text-xs border border-border rounded-lg hover:border-primary/50 transition-colors text-muted-foreground hover:text-foreground"
                      >
                        <Sparkles className="w-3 h-3 inline mr-1 opacity-50" />
                        {prompt}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Messages */}
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10, x: msg.role === 'user' ? 20 : -20 }}
                  animate={{ opacity: 1, y: 0, x: 0 }}
                  transition={{ delay: 0.05 }}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <motion.div
                      className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-white text-sm shadow-md"
                      style={{ background: `linear-gradient(135deg, ${coach.accentColor}, ${coach.accentColor}bb)` }}
                      animate={isTalking && idx === messages.length - 1 ? { scale: [1, 1.1, 1] } : {}}
                      transition={{ duration: 0.5, repeat: Infinity }}
                    >
                      {coach.emoji}
                    </motion.div>
                  )}
                  <div className="max-w-[75%]">
                    <div
                      className={`p-3 rounded-2xl text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-primary text-black font-medium rounded-tr-sm'
                          : 'bg-muted/50 border border-border text-foreground rounded-tl-sm'
                      }`}
                    >
                      {msg.role === 'assistant' && typingMessageId === msg.id ? (
                        <TypewriterText
                          text={msg.content}
                          speed={12}
                          onComplete={() => setTypingMessageId(null)}
                        />
                      ) : (
                        <span className="whitespace-pre-wrap">{msg.content}</span>
                      )}
                    </div>
                    {/* Sentiment tag */}
                    {msg.role === 'user' && msg.user_sentiment && (
                      <div className="mt-1 flex justify-end">
                        <SentimentIndicator sentiment={msg.user_sentiment} />
                      </div>
                    )}
                  </div>
                  {msg.role === 'user' && (
                    <div className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center bg-primary/20 shadow-md">
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
                  <motion.div
                    className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-white text-sm shadow-md"
                    style={{ background: `linear-gradient(135deg, ${coach.accentColor}, ${coach.accentColor}bb)` }}
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity }}
                  >
                    {coach.emoji}
                  </motion.div>
                  <div className="bg-muted/50 border border-border p-3 rounded-2xl rounded-tl-sm">
                    <div className="flex gap-1.5">
                      <motion.span className="w-2 h-2 rounded-full" style={{ backgroundColor: coach.accentColor }}
                        animate={{ y: [0, -8, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} />
                      <motion.span className="w-2 h-2 rounded-full" style={{ backgroundColor: coach.accentColor }}
                        animate={{ y: [0, -8, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }} />
                      <motion.span className="w-2 h-2 rounded-full" style={{ backgroundColor: coach.accentColor }}
                        animate={{ y: [0, -8, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }} />
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground animate-pulse">
                    {coach.name} is thinking...
                  </span>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="mt-3 flex gap-2 items-center">
              {/* Mic Button */}
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  variant={isListening ? 'default' : 'outline'}
                  size="icon"
                  onClick={isListening ? stopListening : startListening}
                  className={`w-10 h-10 rounded-full ${isListening ? 'animate-pulse shadow-lg' : ''}`}
                  style={isListening ? { backgroundColor: coach.accentColor } : {}}
                  title={isListening ? 'Stop listening' : 'Start voice input'}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </Button>
              </motion.div>

              <div className="relative flex-1">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    isListening
                      ? '🎤 Listening... speak now'
                      : `Message ${coach.name}...`
                  }
                  className="pr-12 rounded-full"
                  disabled={loading}
                  data-testid="chatbot-input"
                />
                {isListening && (
                  <motion.div
                    className="absolute right-14 top-1/2 -translate-y-1/2"
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: coach.accentColor }} />
                  </motion.div>
                )}
              </div>

              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || loading}
                  className="w-10 h-10 rounded-full shadow-lg"
                  style={{
                    background: input.trim() ? `linear-gradient(135deg, ${coach.accentColor}, ${coach.accentColor}cc)` : undefined,
                  }}
                  data-testid="chatbot-send"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </motion.div>
            </div>

            {/* Voice status */}
            <AnimatePresence>
              {isListening && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2 flex items-center justify-center gap-2 text-xs"
                  style={{ color: coach.accentColor }}
                >
                  <motion.div
                    className="flex gap-0.5"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    {[...Array(5)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="w-1 rounded-full"
                        style={{ backgroundColor: coach.accentColor }}
                        animate={{ height: [8, 20, 8] }}
                        transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                      />
                    ))}
                  </motion.div>
                  <span className="font-medium">Listening... tap mic to stop</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </Layout>
  );
};
