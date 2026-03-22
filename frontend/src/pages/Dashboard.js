import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout } from '../components/Layout';
import { StatCard } from '../components/StatCard';
import { Coach3D } from '../components/Coach3D';
import {
  Flame, Droplet, Dumbbell, TrendingDown, Camera, Plus,
  MessageCircle, Send, Loader2, X, Sparkles, Trash2,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const COACHES = {
  marcus: { name: 'Coach Marcus', gender: 'male', accentColor: '#ef4444', emoji: '🎖️', gradient: 'from-red-500 to-orange-600' },
  alex: { name: 'Coach Alex', gender: 'male', accentColor: '#22c55e', emoji: '😎', gradient: 'from-green-500 to-emerald-600' },
  dr_raj: { name: 'Dr. Raj', gender: 'male', accentColor: '#3b82f6', emoji: '🧬', gradient: 'from-blue-500 to-cyan-600' },
  maya: { name: 'Coach Maya', gender: 'female', accentColor: '#a855f7', emoji: '🔥', gradient: 'from-purple-500 to-violet-600' },
  sophia: { name: 'Dr. Sophia', gender: 'female', accentColor: '#ec4899', emoji: '🌸', gradient: 'from-pink-500 to-rose-600' },
};

const QUICK_PROMPTS = [
  "What should I eat now?",
  "Log 500ml water for me",
  "Quick 15-min workout",
  "Log my lunch: chicken rice",
  "How's my progress?",
  "Log 30 push-ups",
];

/* ============ CHAT POPUP ============ */
const ChatPopup = ({ isOpen, onClose, selectedCoach, stats, refreshDashboard }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const coach = COACHES[selectedCoach] || COACHES.alex;

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);
  useEffect(() => { if (isOpen) setTimeout(() => inputRef.current?.focus(), 300); }, [isOpen]);

  // Load history when popup opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      axios.get(`${API}/chatbot/history?limit=20`).then(res => {
        if (res.data.messages?.length > 0) setMessages(res.data.messages);
      }).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  /* Try to detect if the bot's reply contains a log action (food/water/workout) */
  const tryAutoLog = async (reply, userMsg) => {
    const lower = (userMsg + ' ' + reply).toLowerCase();

    // Water log detection: "log X ml water" or "logged Xml"
    const waterMatch = lower.match(/log(?:ged)?\s+(\d+)\s*(?:ml)?\s*(?:of\s+)?water/);
    if (waterMatch) {
      try {
        await axios.post(`${API}/water/log`, { amount_ml: parseFloat(waterMatch[1]) });
        toast.success(`💧 Logged ${waterMatch[1]}ml water!`);
        refreshDashboard();
      } catch { /* silent */ }
      return;
    }

    // Workout log detection: "log X reps of exercise" or "logged X push-ups"
    const workoutMatch = lower.match(/log(?:ged)?\s+(\d+)\s+(?:reps?\s+(?:of\s+)?)?([a-z\s-]+?)(?:\s+(?:for|done|completed)|\.|!|$)/);
    if (workoutMatch && !lower.includes('calor') && !lower.includes('food')) {
      try {
        await axios.post(`${API}/workout/log`, {
          exercise_name: workoutMatch[2].trim(),
          sets: 1,
          reps: parseInt(workoutMatch[1]),
        });
        toast.success(`💪 Logged ${workoutMatch[1]} ${workoutMatch[2].trim()}!`);
        refreshDashboard();
      } catch { /* silent */ }
      return;
    }

    // Food log detection from bot reply: "I've logged..." or similar
    const foodMatch = reply.match(/logged[:\s]+([^,]+),?\s*(?:~?\s*)?(\d+)\s*(?:kcal|calories)/i);
    if (foodMatch) {
      try {
        await axios.post(`${API}/food/log`, {
          food_name: foodMatch[1].trim(),
          calories: parseFloat(foodMatch[2]),
          protein: 0, carbs: 0, fat: 0,
          meal_type: 'snack',
        });
        toast.success(`🍽️ Logged ${foodMatch[1].trim()}!`);
        refreshDashboard();
      } catch { /* silent */ }
    }
  };

  const sendMessage = async (messageText) => {
    const text = messageText || input.trim();
    if (!text || loading) return;

    const userMessage = { role: 'user', content: text, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Build dashboard context so the AI knows current stats
      const dashCtx = `TODAY'S DASHBOARD: Calories ${stats.calories}/${stats.calorieGoal}, Protein ${stats.protein}g, Carbs ${stats.carbs}g, Fat ${stats.fat}g, Water ${stats.water}ml/${stats.waterGoal}ml, Workouts ${stats.workouts} sessions.`;

      const response = await axios.post(`${API}/chatbot/message`, {
        message: `[DASHBOARD CONTEXT: ${dashCtx}]\n\nUser says: ${text}`,
        persona: selectedCoach,
      });

      const botMessage = {
        id: Date.now(),
        role: 'assistant',
        content: response.data.reply,
        persona: response.data.persona,
        timestamp: response.data.timestamp,
      };
      setMessages(prev => [...prev, botMessage]);
      tryAutoLog(response.data.reply, text);
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = async () => {
    try {
      await axios.delete(`${API}/chatbot/history`);
      setMessages([]);
      toast.success('Chat cleared');
    } catch { toast.error('Failed to clear'); }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-2 sm:p-4"
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

        {/* Chat Panel */}
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg h-[85vh] sm:h-[75vh] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          style={{ boxShadow: `0 0 60px ${coach.accentColor}20` }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between p-4 border-b border-border"
            style={{ background: `linear-gradient(135deg, ${coach.accentColor}15, transparent)` }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white text-lg shadow-lg"
                style={{ background: `linear-gradient(135deg, ${coach.accentColor}, ${coach.accentColor}bb)` }}
              >
                {coach.emoji}
              </div>
              <div>
                <h3 className="font-barlow font-black uppercase text-sm">{coach.name}</h3>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                  Can log food, water & workouts
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {messages.length > 0 && (
                <Button variant="ghost" size="icon" onClick={clearHistory} className="w-8 h-8 text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={onClose} className="w-8 h-8">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-4">
                <div style={{ transform: 'scale(0.55)', transformOrigin: 'center', height: 140 }}>
                  <Coach3D coachId={selectedCoach} mood="waving" energy={3} />
                </div>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Ask me anything! I can also <strong>log food, water & workouts</strong> for you. Try: "Log 500ml water"
                </p>
                <div className="flex flex-wrap gap-1.5 justify-center max-w-sm">
                  {QUICK_PROMPTS.map((q, i) => (
                    <button key={i} onClick={() => sendMessage(q)}
                      className="px-2.5 py-1.5 text-[10px] border border-border rounded-lg hover:border-primary/50 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Sparkles className="w-2.5 h-2.5 inline mr-1 opacity-50" />{q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs shadow"
                    style={{ background: `linear-gradient(135deg, ${coach.accentColor}, ${coach.accentColor}bb)` }}>
                    {coach.emoji}
                  </div>
                )}
                <div className={`max-w-[80%] p-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-primary text-black font-medium rounded-tr-sm'
                    : 'bg-muted/50 border border-border rounded-tl-sm'
                }`}>
                  <span className="whitespace-pre-wrap">{msg.content}</span>
                </div>
              </motion.div>
            ))}

            {loading && (
              <div className="flex gap-2 items-center">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs shadow"
                  style={{ background: `linear-gradient(135deg, ${coach.accentColor}, ${coach.accentColor}bb)` }}>
                  {coach.emoji}
                </div>
                <div className="bg-muted/50 border border-border p-2.5 rounded-2xl rounded-tl-sm flex gap-1">
                  {[0, 0.15, 0.3].map((d, i) => (
                    <motion.span key={i} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: coach.accentColor }}
                      animate={{ y: [0, -6, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: d }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-border flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder={`Message ${coach.name}...`}
              className="rounded-full text-sm"
              disabled={loading}
            />
            <Button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="w-10 h-10 rounded-full shadow-lg flex-shrink-0"
              style={{ background: input.trim() ? `linear-gradient(135deg, ${coach.accentColor}, ${coach.accentColor}cc)` : undefined }}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

/* ============ DASHBOARD ============ */
export const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    calories: 0,
    calorieGoal: 2500,
    protein: 0,
    carbs: 0,
    fat: 0,
    water: 0,
    waterGoal: 3000,
    workouts: 0,
  });
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCoach, setSelectedCoach] = useState('alex');
  const [coachHovered, setCoachHovered] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    fetchDailyData();
    // Load selected coach
    axios.get(`${API}/chatbot/persona`).then(r => setSelectedCoach(r.data.persona)).catch(() => {});
  }, []);

  const fetchDailyData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const [foodRes, waterRes, workoutRes, insightsRes] = await Promise.all([
        axios.get(`${API}/food/log?date=${today}`),
        axios.get(`${API}/water/log?date=${today}`),
        axios.get(`${API}/workout/log?date=${today}`),
        axios.get(`${API}/analytics/insights`),
      ]);

      const foodLogs = foodRes.data;
      const totalCalories = foodLogs.reduce((sum, log) => sum + log.calories, 0);
      const totalProtein = foodLogs.reduce((sum, log) => sum + log.protein, 0);
      const totalCarbs = foodLogs.reduce((sum, log) => sum + log.carbs, 0);
      const totalFat = foodLogs.reduce((sum, log) => sum + log.fat, 0);

      setStats({
        calories: Math.round(totalCalories),
        calorieGoal: 2500,
        protein: Math.round(totalProtein),
        carbs: Math.round(totalCarbs),
        fat: Math.round(totalFat),
        water: Math.round(waterRes.data.total_ml),
        waterGoal: 3000,
        workouts: workoutRes.data.length,
      });

      setInsights(insightsRes.data.insights || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calorieProgress = (stats.calories / stats.calorieGoal) * 100;
  const waterProgress = (stats.water / stats.waterGoal) * 100;
  const coach = COACHES[selectedCoach] || COACHES.alex;

  return (
    <Layout>
      <div className="page-container space-y-6 sm:space-y-8 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="page-title">
              Command Center
            </h1>
            <p className="page-subtitle">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          
          <Button
            onClick={() => navigate('/food')}
            data-testid="scan-food-button"
            className="bg-gradient-to-r from-primary to-orange-600 text-primary-foreground hover:opacity-90 h-12 sm:h-14 px-6 sm:px-8 uppercase font-bold tracking-widest rounded-lg shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30 w-full sm:w-auto"
          >
            <Camera className="mr-2 w-5 h-5" />
            Scan Food
          </Button>
        </motion.div>

        {/* Coach Avatar — floating, click to chat */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, type: 'spring' }}
          className="relative flex flex-col sm:flex-row items-center gap-4 card-hover cursor-pointer overflow-hidden"
          style={{
            background: `radial-gradient(ellipse at 20% 80%, ${coach.accentColor}12, transparent 60%)`,
          }}
          onClick={() => setChatOpen(true)}
          onMouseEnter={() => setCoachHovered(true)}
          onMouseLeave={() => setCoachHovered(false)}
        >
          <div className="flex-shrink-0" style={{ width: 110, height: 150, transform: 'scale(0.75)', transformOrigin: 'center' }}>
            <Coach3D
              coachId={selectedCoach}
              mood={coachHovered ? 'celebrating' : 'waving'}
              energy={coachHovered ? 5 : 3}
              moodBubble={coachHovered ? '💬 Chat with me!' : ''}
            />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <p className="font-barlow font-black uppercase text-base sm:text-lg flex items-center gap-2 justify-center sm:justify-start">
              {coach.emoji} {coach.name}
              <span className="text-[10px] font-normal text-muted-foreground tracking-widest">YOUR COACH</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {coachHovered ? 'Click to open chat — I can log food, water & workouts for you!' : 'Hover over me to interact, click to chat! I can help track your day.'}
            </p>
            <div className="flex items-center gap-2 mt-2 justify-center sm:justify-start">
              <motion.div
                animate={coachHovered ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.6, repeat: Infinity }}
                className={`px-3 py-1 rounded-full text-[10px] font-bold text-white bg-gradient-to-r ${coach.gradient}`}
              >
                <MessageCircle className="w-3 h-3 inline mr-1" />
                Open Chat
              </motion.div>
              <span className="text-[10px] text-muted-foreground">or visit Profile to change coach</span>
            </div>
          </div>
        </motion.div>

        {/* Main Stats Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <StatCard
            title="Calories"
            value={stats.calories}
            unit={`/ ${stats.calorieGoal}`}
            icon={Flame}
            trend={stats.calories < stats.calorieGoal ? `${stats.calorieGoal - stats.calories} remaining` : 'Goal reached!'}
            className="border-l-4 border-l-primary"
          />

          <StatCard
            title="Water Intake"
            value={Math.round(stats.water / 1000)}
            unit="L"
            icon={Droplet}
            trend={`${Math.round(waterProgress)}%`}
            className="border-l-4 border-l-chart-2"
          />

          <StatCard
            title="Protein"
            value={stats.protein}
            unit="g"
            trend={stats.protein > 80 ? 'On track' : 'Need more'}
            className="border-l-4 border-l-chart-3"
          />

          <StatCard
            title="Workouts Today"
            value={stats.workouts}
            unit="sessions"
            icon={Dumbbell}
            className="border-l-4 border-l-chart-4"
          />
        </motion.div>

        {/* Macro Breakdown */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="card-hover"
        >
          <h2 className="text-xl sm:text-2xl font-barlow font-black uppercase mb-4 sm:mb-6">Macro Breakdown</h2>
          <div className="grid grid-cols-3 gap-3 sm:gap-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground">Protein</span>
                <span className="font-bold text-chart-3 text-sm sm:text-base">{stats.protein}g</span>
              </div>
              <div className="h-3 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-chart-3"
                  style={{ width: `${Math.min((stats.protein / 150) * 100, 100)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Carbs</span>
                <span className="font-bold text-chart-4">{stats.carbs}g</span>
              </div>
              <div className="h-3 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-chart-4"
                  style={{ width: `${Math.min((stats.carbs / 250) * 100, 100)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Fat</span>
                <span className="font-bold text-primary">{stats.fat}g</span>
              </div>
              <div className="h-3 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary"
                  style={{ width: `${Math.min((stats.fat / 80) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* AI Insights */}
        {insights.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="card-hover"
          >
            <h2 className="text-xl sm:text-2xl font-barlow font-black uppercase mb-4">AI Health Insights</h2>
            <div className="space-y-3">
              {insights.map((insight, index) => (
                <div
                  key={index}
                  data-testid={`insight-${index}`}
                  className={`p-4 border-l-4 ${
                    insight.type === 'success'
                      ? 'border-l-chart-3 bg-chart-3/10'
                      : 'border-l-chart-4 bg-chart-4/10'
                  }`}
                >
                  <p className="text-sm">{insight.message}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <Button
            onClick={() => navigate('/food')}
            data-testid="quick-log-food"
            variant="outline"
            className="h-20 sm:h-24 flex flex-col items-center justify-center gap-1.5 sm:gap-2 glass-card rounded-lg border-border hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all"
          >
            <Camera className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            <span className="text-[10px] sm:text-xs uppercase font-bold tracking-wider">Log Food</span>
          </Button>

          <Button
            onClick={() => navigate('/water')}
            data-testid="quick-log-water"
            variant="outline"
            className="h-20 sm:h-24 flex flex-col items-center justify-center gap-1.5 sm:gap-2 glass-card rounded-lg border-border hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all"
          >
            <Droplet className="w-5 h-5 sm:w-6 sm:h-6 text-chart-2" />
            <span className="text-[10px] sm:text-xs uppercase font-bold tracking-wider">Log Water</span>
          </Button>

          <Button
            onClick={() => navigate('/workout')}
            data-testid="quick-log-workout"
            variant="outline"
            className="h-20 sm:h-24 flex flex-col items-center justify-center gap-1.5 sm:gap-2 glass-card rounded-lg border-border hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all"
          >
            <Dumbbell className="w-5 h-5 sm:w-6 sm:h-6 text-chart-4" />
            <span className="text-[10px] sm:text-xs uppercase font-bold tracking-wider">Log Workout</span>
          </Button>

          <Button
            onClick={() => navigate('/analytics')}
            data-testid="quick-view-analytics"
            variant="outline"
            className="h-20 sm:h-24 flex flex-col items-center justify-center gap-1.5 sm:gap-2 glass-card rounded-lg border-border hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all"
          >
            <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6 text-chart-3" />
            <span className="text-[10px] sm:text-xs uppercase font-bold tracking-wider">View Progress</span>
          </Button>
        </motion.div>

        {/* Chat Popup */}
        <ChatPopup
          isOpen={chatOpen}
          onClose={() => setChatOpen(false)}
          selectedCoach={selectedCoach}
          stats={stats}
          refreshDashboard={fetchDailyData}
        />
      </div>
    </Layout>
  );
};
