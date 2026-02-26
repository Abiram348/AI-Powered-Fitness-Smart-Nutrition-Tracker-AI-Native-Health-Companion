import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, Target, Zap, TrendingUp, ChevronRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const Landing = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    age: '',
    height: '',
    current_weight: '',
    goal_weight: '',
    goal: 'fat_loss',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const payload = isLogin
        ? { email: formData.email, password: formData.password }
        : {
            email: formData.email,
            password: formData.password,
            name: formData.name,
            age: parseInt(formData.age) || undefined,
            height: parseFloat(formData.height) || undefined,
            current_weight: parseFloat(formData.current_weight) || undefined,
            goal_weight: parseFloat(formData.goal_weight) || undefined,
            goal: formData.goal,
          };

      const response = await axios.post(`${API}${endpoint}`, payload);
      const { token, user_id, name } = response.data;

      login(token, { id: user_id, name, email: formData.email });
      toast.success(`Welcome ${name}!`);
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  if (showAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-card border border-border p-8"
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl font-barlow font-black text-primary uppercase mb-2">
              {isLogin ? 'Welcome Back' : 'Start Your Journey'}
            </h2>
            <p className="text-muted-foreground text-sm">
              {isLogin ? 'Login to continue your fitness journey' : 'Create your account and transform'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <Label htmlFor="name" className="uppercase text-xs tracking-wider">Full Name</Label>
                <Input
                  id="name"
                  data-testid="register-name-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required={!isLogin}
                  className="mt-1 bg-input/50 border-input focus:border-primary focus:ring-1 focus:ring-primary/50 h-12 text-base"
                />
              </div>
            )}

            <div>
              <Label htmlFor="email" className="uppercase text-xs tracking-wider">Email</Label>
              <Input
                id="email"
                type="email"
                data-testid="auth-email-input"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="mt-1 bg-input/50 border-input focus:border-primary focus:ring-1 focus:ring-primary/50 h-12 text-base"
              />
            </div>

            <div>
              <Label htmlFor="password" className="uppercase text-xs tracking-wider">Password</Label>
              <Input
                id="password"
                type="password"
                data-testid="auth-password-input"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                className="mt-1 bg-input/50 border-input focus:border-primary focus:ring-1 focus:ring-primary/50 h-12 text-base"
              />
            </div>

            {!isLogin && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="age" className="uppercase text-xs tracking-wider">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    data-testid="register-age-input"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    className="mt-1 bg-input/50 border-input h-12 text-base"
                  />
                </div>
                <div>
                  <Label htmlFor="height" className="uppercase text-xs tracking-wider">Height (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    data-testid="register-height-input"
                    value={formData.height}
                    onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                    className="mt-1 bg-input/50 border-input h-12 text-base"
                  />
                </div>
                <div>
                  <Label htmlFor="current_weight" className="uppercase text-xs tracking-wider">Weight (kg)</Label>
                  <Input
                    id="current_weight"
                    type="number"
                    step="0.1"
                    data-testid="register-weight-input"
                    value={formData.current_weight}
                    onChange={(e) => setFormData({ ...formData, current_weight: e.target.value })}
                    className="mt-1 bg-input/50 border-input h-12 text-base"
                  />
                </div>
                <div>
                  <Label htmlFor="goal_weight" className="uppercase text-xs tracking-wider">Goal (kg)</Label>
                  <Input
                    id="goal_weight"
                    type="number"
                    step="0.1"
                    data-testid="register-goal-weight-input"
                    value={formData.goal_weight}
                    onChange={(e) => setFormData({ ...formData, goal_weight: e.target.value })}
                    className="mt-1 bg-input/50 border-input h-12 text-base"
                  />
                </div>
              </div>
            )}

            <Button
              type="submit"
              data-testid="auth-submit-button"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-12 uppercase font-bold tracking-widest text-sm transform skew-x-[-10deg] hover:skew-x-0 transition-transform"
            >
              {loading ? 'Processing...' : isLogin ? 'Login' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              data-testid="toggle-auth-mode"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Login'}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1758875569215-6f4743bcbe97?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NTN8MHwxfHNlYXJjaHw0fHxhdGhsZXRlJTIwd29ya291dCUyMGd5bSUyMGludGVuc2l0eXxlbnwwfHx8fDE3NzIxMDIxNTF8MA&ixlib=rb-4.1.0&q=85)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-black/70" />
        </div>

        <div className="relative z-10 container mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-barlow font-black text-foreground uppercase tracking-tight mb-6">
              AI-Powered
              <span className="block text-primary mt-2">Fitness Revolution</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 font-manrope">
              Track food with AI vision. Get personalized diet plans. Achieve your fitness goals with precision.
            </p>
            <Button
              onClick={() => setShowAuth(true)}
              data-testid="get-started-button"
              className="bg-primary text-primary-foreground hover:bg-primary/90 h-14 px-12 uppercase font-bold tracking-widest text-base transform skew-x-[-10deg] hover:skew-x-0 transition-transform"
            >
              Start Your Journey
              <ChevronRight className="ml-2 w-5 h-5" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-card border-y border-border">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="grid md:grid-cols-3 gap-8"
          >
            <div className="p-8 bg-background border border-border hover:border-primary/50 transition-colors">
              <div className="w-16 h-16 bg-primary/10 flex items-center justify-center mb-6">
                <Target className="w-8 h-8 text-primary" strokeWidth={1.5} />
              </div>
              <h3 className="text-2xl font-barlow font-black uppercase mb-4">AI Food Recognition</h3>
              <p className="text-muted-foreground">Snap a photo, get instant nutritional breakdown. No manual logging needed.</p>
            </div>

            <div className="p-8 bg-background border border-border hover:border-primary/50 transition-colors">
              <div className="w-16 h-16 bg-primary/10 flex items-center justify-center mb-6">
                <Zap className="w-8 h-8 text-primary" strokeWidth={1.5} />
              </div>
              <h3 className="text-2xl font-barlow font-black uppercase mb-4">Smart Diet Coach</h3>
              <p className="text-muted-foreground">Personalized meal plans that adapt to your progress and goals.</p>
            </div>

            <div className="p-8 bg-background border border-border hover:border-primary/50 transition-colors">
              <div className="w-16 h-16 bg-primary/10 flex items-center justify-center mb-6">
                <TrendingUp className="w-8 h-8 text-primary" strokeWidth={1.5} />
              </div>
              <h3 className="text-2xl font-barlow font-black uppercase mb-4">Progress Analytics</h3>
              <p className="text-muted-foreground">Track every metric. Visualize your transformation journey.</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl sm:text-5xl font-barlow font-black uppercase mb-6">Ready to Transform?</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              Join thousands who are achieving their fitness goals with AI-powered precision.
            </p>
            <Button
              onClick={() => setShowAuth(true)}
              data-testid="cta-get-started-button"
              className="bg-primary text-primary-foreground hover:bg-primary/90 h-14 px-12 uppercase font-bold tracking-widest text-base transform skew-x-[-10deg] hover:skew-x-0 transition-transform"
            >
              Get Started Free
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
};
