import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Layout } from '../components/Layout';
import { TrendingUp, TrendingDown, Activity, Target, Flame, Dumbbell } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Area,
  AreaChart,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { StatCard } from '../components/StatCard';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const MACRO_COLORS = ['#f97316', '#10b981', '#3b82f6'];

export const Analytics = () => {
  const [analytics, setAnalytics] = useState({
    weight_trend: [],
    daily_nutrition: {},
    total_workouts: 0,
    avg_daily_calories: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(`${API}/analytics/progress?days=30`);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const weightData = analytics.weight_trend.map(log => ({
    date: new Date(log.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    weight: log.weight,
  }));

  const nutritionEntries = Object.entries(analytics.daily_nutrition || {})
    .sort(([a], [b]) => new Date(a) - new Date(b));

  const nutritionData = nutritionEntries.slice(-14).map(([date, data]) => ({
    date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    calories: data.calories,
    protein: data.protein,
    fat: data.fat,
  }));

  const macroTotals = nutritionEntries.reduce(
    (acc, [, day]) => ({
      protein: acc.protein + (day.protein || 0),
      carbs: acc.carbs + (day.carbs || 0),
      fat: acc.fat + (day.fat || 0),
    }),
    { protein: 0, carbs: 0, fat: 0 }
  );

  const macroChartData = [
    { name: 'Protein', value: Math.round(macroTotals.protein) },
    { name: 'Carbs', value: Math.round(macroTotals.carbs) },
    { name: 'Fat', value: Math.round(macroTotals.fat) },
  ].filter((item) => item.value > 0);

  const weightChange = analytics.weight_trend.length >= 2
    ? analytics.weight_trend[analytics.weight_trend.length - 1].weight - analytics.weight_trend[0].weight
    : 0;

  const daysTracked = Object.keys(analytics.daily_nutrition || {}).length;
  const visualHighlights = [
    {
      title: 'Body Metrics Trend',
      subtitle: `${weightData.length} weight check-ins logged`,
      image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&auto=format&fit=crop',
      accent: 'from-primary/60 to-transparent',
      icon: TrendingUp,
    },
    {
      title: 'Nutrition Discipline',
      subtitle: `${Math.round(analytics.avg_daily_calories || 0)} avg kcal / day`,
      image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1200&auto=format&fit=crop',
      accent: 'from-chart-3/60 to-transparent',
      icon: Flame,
    },
    {
      title: 'Workout Consistency',
      subtitle: `${analytics.total_workouts || 0} sessions in the last 30 days`,
      image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1200&auto=format&fit=crop',
      accent: 'from-chart-2/60 to-transparent',
      icon: Dumbbell,
    },
  ];

  return (
    <Layout>
      <div className="page-container space-y-6 sm:space-y-8 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="page-title">Progress Analytics</h1>
          <p className="page-subtitle">Track Your Transformation</p>
        </motion.div>

        {/* Analytics Hero */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="overflow-hidden rounded-2xl border border-border card-base p-0"
        >
          <div className="grid lg:grid-cols-3">
            <div className="lg:col-span-2 p-5 sm:p-7 relative bg-gradient-to-br from-card via-card to-secondary/20">
              <p className="text-[10px] sm:text-xs uppercase tracking-[0.22em] text-primary font-bold mb-3">Performance Snapshot</p>
              <h2 className="text-2xl sm:text-3xl font-barlow font-black uppercase leading-tight text-foreground max-w-2xl">
                {daysTracked} tracked days, {analytics.total_workouts || 0} workouts, and a clear progress story.
              </h2>
              <p className="text-sm text-muted-foreground mt-3 max-w-2xl">
                Your analytics now combines progress curves, nutrition behavior, and visual momentum in one place.
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                <span className="px-3 py-1 rounded-full bg-primary/15 text-primary text-[10px] uppercase tracking-widest font-bold">30-Day Window</span>
                <span className="px-3 py-1 rounded-full bg-chart-3/15 text-chart-3 text-[10px] uppercase tracking-widest font-bold">Macro Insights</span>
                <span className="px-3 py-1 rounded-full bg-chart-2/15 text-chart-2 text-[10px] uppercase tracking-widest font-bold">Visual Trends</span>
              </div>
            </div>
            <div className="relative min-h-[220px]">
              <img
                src="https://images.unsplash.com/photo-1571019613914-85f342c55f16?w=1200&auto=format&fit=crop"
                alt="Fitness analytics visual"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/35 to-transparent" />
            </div>
          </div>
        </motion.div>

        {/* Overview Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <StatCard
            title="Weight Change"
            value={Math.abs(weightChange).toFixed(1)}
            unit="kg"
            icon={weightChange < 0 ? TrendingDown : TrendingUp}
            trend={weightChange < 0 ? 'Lost' : 'Gained'}
            className="border-l-4 border-l-primary"
          />

          <StatCard
            title="Total Workouts"
            value={analytics.total_workouts}
            unit="sessions"
            icon={Activity}
            className="border-l-4 border-l-chart-2"
          />

          <StatCard
            title="Avg Daily Calories"
            value={Math.round(analytics.avg_daily_calories)}
            unit="kcal"
            icon={Target}
            className="border-l-4 border-l-chart-3"
          />

          <StatCard
            title="Days Tracked"
            value={Object.keys(analytics.daily_nutrition || {}).length}
            unit="days"
            className="border-l-4 border-l-chart-4"
          />
        </motion.div>

        {/* Visual Highlights */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {visualHighlights.map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="relative overflow-hidden rounded-xl border border-border min-h-[190px]">
                <img
                  src={item.image}
                  alt={item.title}
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${item.accent} via-black/35 to-black/20`} />
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.08 }}
                  className="relative p-4 sm:p-5 h-full flex flex-col justify-end"
                >
                  <div className="w-9 h-9 rounded-lg bg-black/35 border border-white/20 flex items-center justify-center mb-3">
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-white font-barlow font-black uppercase text-sm sm:text-base">{item.title}</p>
                  <p className="text-white/80 text-xs mt-1">{item.subtitle}</p>
                </motion.div>
              </div>
            );
          })}
        </motion.div>

        {/* Weight Trend Chart */}
        {weightData.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="card-hover"
          >
            <h2 className="text-xl sm:text-2xl font-barlow font-black uppercase mb-4 sm:mb-6">Weight Progress Curve</h2>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={weightData}>
                <defs>
                  <linearGradient id="weightFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f97316" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#f97316" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis
                  dataKey="date"
                  stroke="#a1a1aa"
                  style={{ fontSize: '12px', fontFamily: 'Manrope' }}
                />
                <YAxis
                  stroke="#a1a1aa"
                  style={{ fontSize: '12px', fontFamily: 'Manrope' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181b',
                    border: '1px solid #27272a',
                    borderRadius: '4px',
                    color: '#fafafa',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="weight"
                  stroke="#f97316"
                  fill="url(#weightFill)"
                  strokeWidth={2.5}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#f97316"
                  strokeWidth={0}
                  dot={{ fill: '#f97316', strokeWidth: 2, r: 4 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Nutrition Trend Chart */}
        {nutritionData.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="card-hover"
          >
            <h2 className="text-xl sm:text-2xl font-barlow font-black uppercase mb-4 sm:mb-6">Nutrition Pulse</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={nutritionData.slice(-7)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis
                  dataKey="date"
                  stroke="#a1a1aa"
                  style={{ fontSize: '12px', fontFamily: 'Manrope' }}
                />
                <YAxis
                  stroke="#a1a1aa"
                  style={{ fontSize: '12px', fontFamily: 'Manrope' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181b',
                    border: '1px solid #27272a',
                    borderRadius: '4px',
                    color: '#fafafa',
                  }}
                />
                <Bar dataKey="calories" fill="#f97316" radius={[4, 4, 0, 0]} />
                <Bar dataKey="protein" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="fat" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-primary" />
                <span className="text-sm uppercase tracking-wider">Calories</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-chart-3" />
                <span className="text-sm uppercase tracking-wider">Protein (g)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-chart-2" />
                <span className="text-sm uppercase tracking-wider">Fat (g)</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Macro Composition */}
        {macroChartData.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.34 }}
            className="card-hover"
          >
            <h2 className="text-xl sm:text-2xl font-barlow font-black uppercase mb-4 sm:mb-6">Macro Composition</h2>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={macroChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {macroChartData.map((entry, index) => (
                    <Cell key={entry.name} fill={MACRO_COLORS[index % MACRO_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181b',
                    border: '1px solid #27272a',
                    borderRadius: '4px',
                    color: '#fafafa',
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {loading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading analytics...</p>
          </div>
        )}

        {!loading && weightData.length === 0 && nutritionData.length === 0 && (
          <div className="text-center py-12 card-base overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=900&auto=format&fit=crop"
              alt="Start tracking analytics"
              className="w-full h-44 object-cover rounded-lg mb-5 opacity-70"
            />
            <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-2">No data yet. Start logging to see your progress!</p>
          </div>
        )}
      </div>
    </Layout>
  );
};
