import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Layout } from '../components/Layout';
import { ChefHat, Loader2, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const DietCoach = () => {
  const [generating, setGenerating] = useState(false);
  const [plan, setPlan] = useState(null);
  const [formData, setFormData] = useState({
    current_weight: '',
    goal_weight: '',
    goal: 'fat_loss',
    activity_level: 'moderate',
    dietary_preferences: '',
  });

  const handleGenerate = async (e) => {
    e.preventDefault();
    setGenerating(true);

    try {
      const response = await axios.post(`${API}/diet/plan`, {
        current_weight: parseFloat(formData.current_weight),
        goal_weight: parseFloat(formData.goal_weight),
        goal: formData.goal,
        activity_level: formData.activity_level,
        dietary_preferences: formData.dietary_preferences || undefined,
      });

      setPlan(response.data);
      toast.success('Diet plan generated!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to generate plan');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-6 py-8 space-y-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl md:text-5xl font-barlow font-black uppercase">AI Diet Coach</h1>
          <p className="text-muted-foreground mt-2 uppercase text-xs tracking-widest">Personalized Nutrition Plans</p>
        </motion.div>

        {/* Input Form */}
        <motion.form
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleGenerate}
          className="bg-card border border-border p-6 space-y-4"
        >
          <h2 className="text-2xl font-barlow font-black uppercase">Your Details</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="uppercase text-xs tracking-wider">Current Weight (kg)</Label>
              <Input
                type="number"
                step="0.1"
                data-testid="diet-current-weight"
                value={formData.current_weight}
                onChange={(e) => setFormData({ ...formData, current_weight: e.target.value })}
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label className="uppercase text-xs tracking-wider">Goal Weight (kg)</Label>
              <Input
                type="number"
                step="0.1"
                data-testid="diet-goal-weight"
                value={formData.goal_weight}
                onChange={(e) => setFormData({ ...formData, goal_weight: e.target.value })}
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label className="uppercase text-xs tracking-wider">Goal</Label>
              <Select value={formData.goal} onValueChange={(value) => setFormData({ ...formData, goal: value })}>
                <SelectTrigger data-testid="diet-goal-select" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fat_loss">Fat Loss</SelectItem>
                  <SelectItem value="muscle_gain">Muscle Gain</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="athlete">Athlete Mode</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="uppercase text-xs tracking-wider">Activity Level</Label>
              <Select value={formData.activity_level} onValueChange={(value) => setFormData({ ...formData, activity_level: value })}>
                <SelectTrigger data-testid="diet-activity-select" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sedentary">Sedentary</SelectItem>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="very_active">Very Active</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <Label className="uppercase text-xs tracking-wider">Dietary Preferences (Optional)</Label>
              <Input
                data-testid="diet-preferences"
                value={formData.dietary_preferences}
                onChange={(e) => setFormData({ ...formData, dietary_preferences: e.target.value })}
                placeholder="e.g., vegetarian, high protein, Indian food"
                className="mt-1"
              />
            </div>
          </div>

          <Button
            type="submit"
            data-testid="generate-diet-plan-button"
            disabled={generating}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-14 uppercase font-bold tracking-widest transform skew-x-[-10deg] hover:skew-x-0 transition-transform"
          >
            {generating ? (
              <>
                <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 w-5 h-5" />
                Generate AI Plan
              </>
            )}
          </Button>
        </motion.form>

        {/* Generated Plan */}
        {plan && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Calorie & Macros */}
            <div className="bg-card border border-primary/50 p-6">
              <div className="flex items-center gap-3 mb-6">
                <ChefHat className="w-8 h-8 text-primary" />
                <h2 className="text-2xl font-barlow font-black uppercase">Your Personalized Plan</h2>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Daily Calories</p>
                  <p className="text-4xl font-barlow font-black text-primary">{plan.daily_calories}</p>
                  <p className="text-xs text-muted-foreground mt-1">kcal</p>
                </div>

                <div className="text-center">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Protein</p>
                  <p className="text-4xl font-barlow font-black text-chart-3">{plan.macro_split.protein}</p>
                  <p className="text-xs text-muted-foreground mt-1">%</p>
                </div>

                <div className="text-center">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Carbs</p>
                  <p className="text-4xl font-barlow font-black text-chart-4">{plan.macro_split.carbs}</p>
                  <p className="text-xs text-muted-foreground mt-1">%</p>
                </div>

                <div className="text-center">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Fat</p>
                  <p className="text-4xl font-barlow font-black text-chart-2">{plan.macro_split.fat}</p>
                  <p className="text-xs text-muted-foreground mt-1">%</p>
                </div>
              </div>
            </div>

            {/* Meal Suggestions */}
            {plan.meal_suggestions && plan.meal_suggestions.length > 0 && (
              <div className="bg-card border border-border p-6">
                <h3 className="text-xl font-barlow font-black uppercase mb-4">Meal Suggestions</h3>
                <div className="space-y-3">
                  {plan.meal_suggestions.map((meal, index) => (
                    <div
                      key={index}
                      data-testid={`meal-suggestion-${index}`}
                      className="p-4 bg-background border-l-4 border-l-primary"
                    >
                      <p className="font-semibold">{meal}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Advice */}
            {plan.plan && (
              <div className="bg-card border border-border p-6">
                <h3 className="text-xl font-barlow font-black uppercase mb-4">Expert Advice</h3>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{plan.plan}</p>
              </div>
            )}
          </motion.div>
        )}

        {!plan && !generating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-card border border-border p-12 text-center"
          >
            <ChefHat className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Fill in your details above to get your personalized AI diet plan</p>
          </motion.div>
        )}
      </div>
    </Layout>
  );
};
