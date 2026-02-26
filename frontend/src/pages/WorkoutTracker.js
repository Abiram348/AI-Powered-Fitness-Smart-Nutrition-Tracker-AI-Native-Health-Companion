import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Layout } from '../components/Layout';
import { Dumbbell, Plus, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const WorkoutTracker = () => {
  const [workouts, setWorkouts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [workout, setWorkout] = useState({
    exercise_name: '',
    sets: '',
    reps: '',
    weight: '',
    duration_minutes: '',
    notes: '',
  });

  useEffect(() => {
    fetchWorkouts();
  }, []);

  const fetchWorkouts = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await axios.get(`${API}/workout/log?date=${today}`);
      setWorkouts(response.data);
    } catch (error) {
      console.error('Error fetching workouts:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/workout/log`, {
        exercise_name: workout.exercise_name,
        sets: parseInt(workout.sets),
        reps: parseInt(workout.reps),
        weight: workout.weight ? parseFloat(workout.weight) : undefined,
        duration_minutes: workout.duration_minutes ? parseInt(workout.duration_minutes) : undefined,
        notes: workout.notes || undefined,
      });

      toast.success('Workout logged!');
      setShowForm(false);
      setWorkout({
        exercise_name: '',
        sets: '',
        reps: '',
        weight: '',
        duration_minutes: '',
        notes: '',
      });
      fetchWorkouts();
    } catch (error) {
      toast.error('Failed to log workout');
    }
  };

  const handleDelete = async (workoutId) => {
    try {
      await axios.delete(`${API}/workout/log/${workoutId}`);
      toast.success('Workout deleted');
      fetchWorkouts();
    } catch (error) {
      toast.error('Failed to delete workout');
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-6 py-8 space-y-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-4xl md:text-5xl font-barlow font-black uppercase">Workout Tracker</h1>
            <p className="text-muted-foreground mt-2 uppercase text-xs tracking-widest">Log Your Training Sessions</p>
          </div>
          
          <Button
            onClick={() => setShowForm(!showForm)}
            data-testid="toggle-workout-form"
            className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-6 uppercase font-bold tracking-widest"
          >
            <Plus className="mr-2 w-5 h-5" />
            Add Workout
          </Button>
        </motion.div>

        {/* Workout Form */}
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            onSubmit={handleSubmit}
            className="bg-card border border-border p-6 space-y-4"
          >
            <h2 className="text-xl font-barlow font-black uppercase">Log New Exercise</h2>
            
            <div>
              <Label className="uppercase text-xs tracking-wider">Exercise Name</Label>
              <Input
                data-testid="workout-exercise-name"
                value={workout.exercise_name}
                onChange={(e) => setWorkout({ ...workout, exercise_name: e.target.value })}
                required
                placeholder="e.g., Bench Press"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label className="uppercase text-xs tracking-wider">Sets</Label>
                <Input
                  type="number"
                  data-testid="workout-sets"
                  value={workout.sets}
                  onChange={(e) => setWorkout({ ...workout, sets: e.target.value })}
                  required
                  min="1"
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="uppercase text-xs tracking-wider">Reps</Label>
                <Input
                  type="number"
                  data-testid="workout-reps"
                  value={workout.reps}
                  onChange={(e) => setWorkout({ ...workout, reps: e.target.value })}
                  required
                  min="1"
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="uppercase text-xs tracking-wider">Weight (kg)</Label>
                <Input
                  type="number"
                  step="0.5"
                  data-testid="workout-weight"
                  value={workout.weight}
                  onChange={(e) => setWorkout({ ...workout, weight: e.target.value })}
                  placeholder="Optional"
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="uppercase text-xs tracking-wider">Duration (min)</Label>
                <Input
                  type="number"
                  data-testid="workout-duration"
                  value={workout.duration_minutes}
                  onChange={(e) => setWorkout({ ...workout, duration_minutes: e.target.value })}
                  placeholder="Optional"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="uppercase text-xs tracking-wider">Notes</Label>
              <Input
                data-testid="workout-notes"
                value={workout.notes}
                onChange={(e) => setWorkout({ ...workout, notes: e.target.value })}
                placeholder="How did it feel?"
                className="mt-1"
              />
            </div>

            <Button
              type="submit"
              data-testid="submit-workout"
              className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 uppercase font-bold tracking-widest"
            >
              Log Workout
            </Button>
          </motion.form>
        )}

        {/* Today's Workouts */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border p-6"
        >
          <h2 className="text-xl font-barlow font-black uppercase mb-4">Today's Session</h2>
          
          {workouts.length === 0 ? (
            <div className="text-center py-12">
              <Dumbbell className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No workouts logged today. Time to crush it!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {workouts.map((log) => (
                <div
                  key={log.id}
                  data-testid={`workout-log-${log.id}`}
                  className="flex items-center justify-between p-4 bg-background border border-border hover:border-primary/30 transition-colors"
                >
                  <div className="flex-1">
                    <h4 className="font-barlow font-black uppercase text-lg mb-2">{log.exercise_name}</h4>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span><strong className="text-foreground">{log.sets}</strong> sets</span>
                      <span><strong className="text-foreground">{log.reps}</strong> reps</span>
                      {log.weight && <span><strong className="text-primary">{log.weight}kg</strong></span>}
                      {log.duration_minutes && <span><strong className="text-chart-2">{log.duration_minutes}min</strong></span>}
                    </div>
                    {log.notes && <p className="text-sm text-muted-foreground mt-2 italic">{log.notes}</p>}
                  </div>
                  
                  <Button
                    onClick={() => handleDelete(log.id)}
                    data-testid={`delete-workout-${log.id}`}
                    variant="ghost"
                    size="icon"
                    className="hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              
              <div className="mt-6 p-4 bg-primary/10 border border-primary/30">
                <p className="text-center">
                  <strong className="text-2xl font-barlow font-black text-primary">{workouts.length}</strong>
                  <span className="text-sm uppercase tracking-wider ml-2">Exercises Completed</span>
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </Layout>
  );
};
