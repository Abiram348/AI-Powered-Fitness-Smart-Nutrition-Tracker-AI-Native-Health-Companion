import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Layout } from '../components/Layout';
import { StatCard } from '../components/StatCard';
import { Flame, Droplet, Dumbbell, TrendingDown, Camera, Plus } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

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

  useEffect(() => {
    fetchDailyData();
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

  return (
    <Layout>
      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <h1 className="text-4xl md:text-5xl font-barlow font-black uppercase text-foreground">
              Command Center
            </h1>
            <p className="text-muted-foreground mt-2 uppercase text-xs tracking-widest">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          
          <Button
            onClick={() => navigate('/food')}
            data-testid="scan-food-button"
            className="bg-primary text-primary-foreground hover:bg-primary/90 h-14 px-8 uppercase font-bold tracking-widest transform skew-x-[-10deg] hover:skew-x-0 transition-transform"
          >
            <Camera className="mr-2 w-5 h-5" />
            Scan Food
          </Button>
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
          className="bg-card border border-border p-6"
        >
          <h2 className="text-2xl font-barlow font-black uppercase mb-6">Macro Breakdown</h2>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Protein</span>
                <span className="font-bold text-chart-3">{stats.protein}g</span>
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
            className="bg-card border border-border p-6"
          >
            <h2 className="text-2xl font-barlow font-black uppercase mb-4">AI Health Insights</h2>
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
            className="h-24 flex flex-col items-center justify-center gap-2 bg-card border-border hover:border-primary/50 hover:bg-card/80"
          >
            <Camera className="w-6 h-6 text-primary" />
            <span className="text-xs uppercase font-bold tracking-wider">Log Food</span>
          </Button>

          <Button
            onClick={() => navigate('/water')}
            data-testid="quick-log-water"
            variant="outline"
            className="h-24 flex flex-col items-center justify-center gap-2 bg-card border-border hover:border-primary/50 hover:bg-card/80"
          >
            <Droplet className="w-6 h-6 text-chart-2" />
            <span className="text-xs uppercase font-bold tracking-wider">Log Water</span>
          </Button>

          <Button
            onClick={() => navigate('/workout')}
            data-testid="quick-log-workout"
            variant="outline"
            className="h-24 flex flex-col items-center justify-center gap-2 bg-card border-border hover:border-primary/50 hover:bg-card/80"
          >
            <Dumbbell className="w-6 h-6 text-chart-4" />
            <span className="text-xs uppercase font-bold tracking-wider">Log Workout</span>
          </Button>

          <Button
            onClick={() => navigate('/analytics')}
            data-testid="quick-view-analytics"
            variant="outline"
            className="h-24 flex flex-col items-center justify-center gap-2 bg-card border-border hover:border-primary/50 hover:bg-card/80"
          >
            <TrendingDown className="w-6 h-6 text-chart-3" />
            <span className="text-xs uppercase font-bold tracking-wider">View Progress</span>
          </Button>
        </motion.div>
      </div>
    </Layout>
  );
};
