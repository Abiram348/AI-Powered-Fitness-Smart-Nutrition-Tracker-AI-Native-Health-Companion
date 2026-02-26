import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Layout } from '../components/Layout';
import { Camera, Upload, Loader2, Trash2, Plus } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const FoodTracker = () => {
  const [analyzing, setAnalyzing] = useState(false);
  const [foodLogs, setFoodLogs] = useState([]);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualFood, setManualFood] = useState({
    food_name: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    fiber: '',
    sugar: '',
    meal_type: 'breakfast',
  });
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchFoodLogs();
  }, []);

  const fetchFoodLogs = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await axios.get(`${API}/food/log?date=${today}`);
      setFoodLogs(response.data);
    } catch (error) {
      console.error('Error fetching food logs:', error);
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setAnalyzing(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API}/food/analyze`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const analysis = response.data;
      toast.success(`Food detected: ${analysis.food_name}`);

      const mealType = getCurrentMealType();
      await axios.post(`${API}/food/log`, {
        food_name: analysis.food_name,
        calories: analysis.calories,
        protein: analysis.protein,
        carbs: analysis.carbs,
        fat: analysis.fat,
        fiber: analysis.fiber,
        sugar: analysis.sugar,
        meal_type: mealType,
      });

      toast.success('Food logged successfully!');
      fetchFoodLogs();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Analysis failed');
    } finally {
      setAnalyzing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleManualEntry = async () => {
    try {
      await axios.post(`${API}/food/log`, {
        ...manualFood,
        calories: parseFloat(manualFood.calories),
        protein: parseFloat(manualFood.protein),
        carbs: parseFloat(manualFood.carbs),
        fat: parseFloat(manualFood.fat),
        fiber: parseFloat(manualFood.fiber) || 0,
        sugar: parseFloat(manualFood.sugar) || 0,
      });

      toast.success('Food logged successfully!');
      setShowManualEntry(false);
      setManualFood({
        food_name: '',
        calories: '',
        protein: '',
        carbs: '',
        fat: '',
        fiber: '',
        sugar: '',
        meal_type: 'breakfast',
      });
      fetchFoodLogs();
    } catch (error) {
      toast.error('Failed to log food');
    }
  };

  const handleDelete = async (logId) => {
    try {
      await axios.delete(`${API}/food/log/${logId}`);
      toast.success('Food log deleted');
      fetchFoodLogs();
    } catch (error) {
      toast.error('Failed to delete log');
    }
  };

  const getCurrentMealType = () => {
    const hour = new Date().getHours();
    if (hour < 11) return 'breakfast';
    if (hour < 16) return 'lunch';
    if (hour < 20) return 'dinner';
    return 'snack';
  };

  const totalCalories = foodLogs.reduce((sum, log) => sum + log.calories, 0);
  const totalProtein = foodLogs.reduce((sum, log) => sum + log.protein, 0);
  const totalCarbs = foodLogs.reduce((sum, log) => sum + log.carbs, 0);
  const totalFat = foodLogs.reduce((sum, log) => sum + log.fat, 0);

  return (
    <Layout>
      <div className="container mx-auto px-6 py-8 space-y-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl md:text-5xl font-barlow font-black uppercase">Food Tracker</h1>
          <p className="text-muted-foreground mt-2 uppercase text-xs tracking-widest">AI-Powered Nutrition Tracking</p>
        </motion.div>

        {/* Daily Summary */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border p-6"
        >
          <h2 className="text-xl font-barlow font-black uppercase mb-4">Today's Totals</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Calories</p>
              <p className="text-3xl font-barlow font-black text-primary">{Math.round(totalCalories)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Protein</p>
              <p className="text-3xl font-barlow font-black text-chart-3">{Math.round(totalProtein)}g</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Carbs</p>
              <p className="text-3xl font-barlow font-black text-chart-4">{Math.round(totalCarbs)}g</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Fat</p>
              <p className="text-3xl font-barlow font-black text-chart-2">{Math.round(totalFat)}g</p>
            </div>
          </div>
        </motion.div>

        {/* Scan Food Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-primary/50 p-8 text-center"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImageUpload}
            className="hidden"
            data-testid="food-image-input"
          />
          
          {analyzing ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <p className="text-lg uppercase tracking-wider font-bold">Analyzing Food...</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <Camera className="w-16 h-16 text-primary mx-auto mb-4" />
                <h3 className="text-2xl font-barlow font-black uppercase mb-2">Scan Your Food</h3>
                <p className="text-muted-foreground">AI will analyze and log nutritional information</p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  data-testid="upload-food-image-button"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 h-14 px-8 uppercase font-bold tracking-widest"
                >
                  <Camera className="mr-2 w-5 h-5" />
                  Take Photo
                </Button>
                
                <Button
                  onClick={() => setShowManualEntry(!showManualEntry)}
                  data-testid="toggle-manual-entry-button"
                  variant="outline"
                  className="h-14 px-8 uppercase font-bold tracking-widest border-primary/50 hover:bg-primary/10"
                >
                  <Plus className="mr-2 w-5 h-5" />
                  Manual Entry
                </Button>
              </div>
            </div>
          )}
        </motion.div>

        {/* Manual Entry Form */}
        {showManualEntry && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-card border border-border p-6"
          >
            <h3 className="text-xl font-barlow font-black uppercase mb-4">Manual Food Entry</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label className="uppercase text-xs tracking-wider">Food Name</Label>
                <Input
                  data-testid="manual-food-name-input"
                  value={manualFood.food_name}
                  onChange={(e) => setManualFood({ ...manualFood, food_name: e.target.value })}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label className="uppercase text-xs tracking-wider">Calories</Label>
                <Input
                  type="number"
                  data-testid="manual-calories-input"
                  value={manualFood.calories}
                  onChange={(e) => setManualFood({ ...manualFood, calories: e.target.value })}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label className="uppercase text-xs tracking-wider">Protein (g)</Label>
                <Input
                  type="number"
                  data-testid="manual-protein-input"
                  value={manualFood.protein}
                  onChange={(e) => setManualFood({ ...manualFood, protein: e.target.value })}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label className="uppercase text-xs tracking-wider">Carbs (g)</Label>
                <Input
                  type="number"
                  data-testid="manual-carbs-input"
                  value={manualFood.carbs}
                  onChange={(e) => setManualFood({ ...manualFood, carbs: e.target.value })}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label className="uppercase text-xs tracking-wider">Fat (g)</Label>
                <Input
                  type="number"
                  data-testid="manual-fat-input"
                  value={manualFood.fat}
                  onChange={(e) => setManualFood({ ...manualFood, fat: e.target.value })}
                  className="mt-1"
                />
              </div>
              
              <div className="md:col-span-2">
                <Label className="uppercase text-xs tracking-wider">Meal Type</Label>
                <Select
                  value={manualFood.meal_type}
                  onValueChange={(value) => setManualFood({ ...manualFood, meal_type: value })}
                >
                  <SelectTrigger data-testid="manual-meal-type-select" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="breakfast">Breakfast</SelectItem>
                    <SelectItem value="lunch">Lunch</SelectItem>
                    <SelectItem value="dinner">Dinner</SelectItem>
                    <SelectItem value="snack">Snack</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button
              onClick={handleManualEntry}
              data-testid="submit-manual-entry-button"
              className="mt-6 bg-primary text-primary-foreground hover:bg-primary/90 h-12 uppercase font-bold tracking-widest"
            >
              Log Food
            </Button>
          </motion.div>
        )}

        {/* Food Logs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-border p-6"
        >
          <h2 className="text-xl font-barlow font-black uppercase mb-4">Today's Meals</h2>
          
          {foodLogs.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No food logged today. Start by scanning a meal!</p>
          ) : (
            <div className="space-y-3">
              {foodLogs.map((log) => (
                <div
                  key={log.id}
                  data-testid={`food-log-${log.id}`}
                  className="flex items-center justify-between p-4 bg-background border border-border hover:border-primary/30 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-bold text-foreground">{log.food_name}</h4>
                      <span className="text-xs uppercase tracking-wider px-2 py-1 bg-primary/10 text-primary border border-primary/30">
                        {log.meal_type}
                      </span>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <span><strong className="text-primary">{Math.round(log.calories)}</strong> cal</span>
                      <span><strong className="text-chart-3">{Math.round(log.protein)}g</strong> protein</span>
                      <span><strong className="text-chart-4">{Math.round(log.carbs)}g</strong> carbs</span>
                      <span><strong className="text-chart-2">{Math.round(log.fat)}g</strong> fat</span>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => handleDelete(log.id)}
                    data-testid={`delete-food-log-${log.id}`}
                    variant="ghost"
                    size="icon"
                    className="hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </Layout>
  );
};
