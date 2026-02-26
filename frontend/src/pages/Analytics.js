import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Layout } from '../components/Layout';
import { TrendingUp, TrendingDown, Activity, Target } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { StatCard } from '../components/StatCard';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

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

  const nutritionData = Object.entries(analytics.daily_nutrition || {}).slice(-7).map(([date, data]) => ({
    date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    calories: data.calories,
    protein: data.protein,
  }));

  const weightChange = analytics.weight_trend.length >= 2
    ? analytics.weight_trend[analytics.weight_trend.length - 1].weight - analytics.weight_trend[0].weight
    : 0;

  return (
    <Layout>
      <div className="container mx-auto px-6 py-8 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl md:text-5xl font-barlow font-black uppercase">Progress Analytics</h1>
          <p className="text-muted-foreground mt-2 uppercase text-xs tracking-widest">Track Your Transformation</p>
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

        {/* Weight Trend Chart */}
        {weightData.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-card border border-border p-6"
          >
            <h2 className="text-2xl font-barlow font-black uppercase mb-6">Weight Progress</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weightData}>
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
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#f97316"
                  strokeWidth={3}
                  dot={{ fill: '#f97316', strokeWidth: 2, r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Nutrition Trend Chart */}
        {nutritionData.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-card border border-border p-6"
          >
            <h2 className="text-2xl font-barlow font-black uppercase mb-6">7-Day Nutrition</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={nutritionData}>
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
            </div>
          </motion.div>
        )}

        {loading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading analytics...</p>
          </div>
        )}

        {!loading && weightData.length === 0 && nutritionData.length === 0 && (
          <div className="text-center py-12 bg-card border border-border p-8">
            <Activity className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">No data yet. Start logging to see your progress!</p>
          </div>
        )}
      </div>
    </Layout>
  );
};
