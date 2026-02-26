import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Layout } from '../components/Layout';
import { Droplet, Plus } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const QUICK_AMOUNTS = [250, 500, 750, 1000];

export const WaterTracker = () => {
  const [totalWater, setTotalWater] = useState(0);
  const [customAmount, setCustomAmount] = useState('');
  const [waterGoal] = useState(3000);

  useEffect(() => {
    fetchWaterLogs();
  }, []);

  const fetchWaterLogs = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await axios.get(`${API}/water/log?date=${today}`);
      setTotalWater(response.data.total_ml);
    } catch (error) {
      console.error('Error fetching water logs:', error);
    }
  };

  const logWater = async (amount) => {
    try {
      await axios.post(`${API}/water/log`, { amount_ml: amount });
      toast.success(`Logged ${amount}ml of water`);
      fetchWaterLogs();
    } catch (error) {
      toast.error('Failed to log water');
    }
  };

  const handleCustomLog = () => {
    const amount = parseFloat(customAmount);
    if (amount > 0) {
      logWater(amount);
      setCustomAmount('');
    }
  };

  const progress = Math.min((totalWater / waterGoal) * 100, 100);

  return (
    <Layout>
      <div className="container mx-auto px-6 py-8 space-y-8 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl md:text-5xl font-barlow font-black uppercase">Water Tracker</h1>
          <p className="text-muted-foreground mt-2 uppercase text-xs tracking-widest">Stay Hydrated, Stay Strong</p>
        </motion.div>

        {/* Water Progress */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border p-8 text-center"
        >
          <div className="relative inline-block mb-6">
            <div className="w-48 h-48 rounded-full border-8 border-secondary flex items-center justify-center relative overflow-hidden">
              <div
                className="absolute bottom-0 left-0 right-0 bg-chart-2 transition-all duration-700"
                style={{ height: `${progress}%` }}
              />
              <div className="relative z-10 text-center">
                <Droplet className="w-16 h-16 text-chart-2 mx-auto mb-2" />
                <p className="text-4xl font-barlow font-black">{Math.round(totalWater / 1000)}L</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <p className="text-2xl font-barlow font-black uppercase">{Math.round(progress)}% Complete</p>
            <p className="text-muted-foreground">
              <span className="text-chart-2 font-bold">{totalWater}ml</span> / {waterGoal}ml
            </p>
            <p className="text-sm text-muted-foreground">
              {waterGoal - totalWater > 0 ? `${waterGoal - totalWater}ml remaining` : 'Goal achieved!'}
            </p>
          </div>
        </motion.div>

        {/* Quick Log Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border p-6"
        >
          <h2 className="text-xl font-barlow font-black uppercase mb-4">Quick Log</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {QUICK_AMOUNTS.map((amount) => (
              <Button
                key={amount}
                onClick={() => logWater(amount)}
                data-testid={`quick-log-${amount}ml`}
                className="h-24 flex flex-col items-center justify-center gap-2 bg-primary/10 border-2 border-primary/30 hover:bg-primary hover:text-primary-foreground transition-all"
              >
                <Droplet className="w-8 h-8" />
                <span className="text-lg font-barlow font-black">{amount}ml</span>
              </Button>
            ))}
          </div>
        </motion.div>

        {/* Custom Amount */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-border p-6"
        >
          <h2 className="text-xl font-barlow font-black uppercase mb-4">Custom Amount</h2>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label className="uppercase text-xs tracking-wider">Amount (ml)</Label>
              <Input
                type="number"
                data-testid="custom-water-input"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="Enter amount"
                className="mt-1 h-12"
              />
            </div>
            <Button
              onClick={handleCustomLog}
              data-testid="log-custom-water-button"
              disabled={!customAmount || parseFloat(customAmount) <= 0}
              className="self-end bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8 uppercase font-bold tracking-widest"
            >
              <Plus className="mr-2 w-5 h-5" />
              Log
            </Button>
          </div>
        </motion.div>

        {/* Hydration Tips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-card border border-border p-6"
        >
          <h2 className="text-xl font-barlow font-black uppercase mb-4">Hydration Tips</h2>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-3">
              <Droplet className="w-5 h-5 text-chart-2 flex-shrink-0 mt-0.5" />
              <span>Drink water before, during, and after workouts to maintain performance</span>
            </li>
            <li className="flex items-start gap-3">
              <Droplet className="w-5 h-5 text-chart-2 flex-shrink-0 mt-0.5" />
              <span>Aim for at least 3 liters per day for optimal hydration</span>
            </li>
            <li className="flex items-start gap-3">
              <Droplet className="w-5 h-5 text-chart-2 flex-shrink-0 mt-0.5" />
              <span>Increase intake during intense training or hot weather</span>
            </li>
          </ul>
        </motion.div>
      </div>
    </Layout>
  );
};
