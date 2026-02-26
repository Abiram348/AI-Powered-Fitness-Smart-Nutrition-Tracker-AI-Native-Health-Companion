import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Layout } from '../components/Layout';
import { User, Calculator, Save } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [calcData, setCalcData] = useState({
    weight: '',
    height: '',
    age: '',
    gender: 'male',
    activity_level: 'moderate',
  });
  const [calcResults, setCalcResults] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${API}/profile`);
      setProfile(response.data);
      setFormData(response.data);
      setCalcData({
        weight: response.data.current_weight || '',
        height: response.data.height || '',
        age: response.data.age || '',
        gender: 'male',
        activity_level: response.data.activity_level || 'moderate',
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API}/profile`, {
        name: formData.name,
        age: formData.age ? parseInt(formData.age) : undefined,
        height: formData.height ? parseFloat(formData.height) : undefined,
        current_weight: formData.current_weight ? parseFloat(formData.current_weight) : undefined,
        goal_weight: formData.goal_weight ? parseFloat(formData.goal_weight) : undefined,
        activity_level: formData.activity_level,
        goal: formData.goal,
      });
      toast.success('Profile updated!');
      setEditing(false);
      fetchProfile();
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const calculateAll = async () => {
    try {
      const [bmiRes, bmrRes, tdeeRes] = await Promise.all([
        axios.post(`${API}/calculator/bmi`, {
          weight: parseFloat(calcData.weight),
          height: parseFloat(calcData.height),
        }),
        axios.post(`${API}/calculator/bmr`, {
          weight: parseFloat(calcData.weight),
          height: parseFloat(calcData.height),
          age: parseInt(calcData.age),
          gender: calcData.gender,
        }),
        axios.post(`${API}/calculator/tdee`, {
          weight: parseFloat(calcData.weight),
          height: parseFloat(calcData.height),
          age: parseInt(calcData.age),
          gender: calcData.gender,
          activity_level: calcData.activity_level,
        }),
      ]);

      setCalcResults({
        bmi: bmiRes.data.bmi,
        bmi_category: bmiRes.data.category,
        bmr: bmrRes.data.bmr,
        tdee: tdeeRes.data.tdee,
      });
      toast.success('Calculations complete!');
    } catch (error) {
      toast.error('Calculation failed. Please fill all fields.');
    }
  };

  if (!profile) {
    return (
      <Layout>
        <div className="container mx-auto px-6 py-8">
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-6 py-8 space-y-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl md:text-5xl font-barlow font-black uppercase">Profile</h1>
          <p className="text-muted-foreground mt-2 uppercase text-xs tracking-widest">Manage Your Account</p>
        </motion.div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-card border border-border">
            <TabsTrigger data-testid="profile-tab" value="profile" className="uppercase font-bold tracking-wider">
              <User className="w-4 h-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger data-testid="calculators-tab" value="calculators" className="uppercase font-bold tracking-wider">
              <Calculator className="w-4 h-4 mr-2" />
              Calculators
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-card border border-border p-6"
            >
              {!editing ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-barlow font-black uppercase">Your Information</h2>
                    <Button
                      onClick={() => setEditing(true)}
                      data-testid="edit-profile-button"
                      className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6 uppercase font-bold tracking-widest text-xs"
                    >
                      Edit Profile
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Name</p>
                      <p className="text-lg font-semibold">{profile.name}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Email</p>
                      <p className="text-lg font-semibold">{profile.email}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Age</p>
                      <p className="text-lg font-semibold">{profile.age || 'Not set'}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Height</p>
                      <p className="text-lg font-semibold">{profile.height ? `${profile.height} cm` : 'Not set'}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Current Weight</p>
                      <p className="text-lg font-semibold">{profile.current_weight ? `${profile.current_weight} kg` : 'Not set'}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Goal Weight</p>
                      <p className="text-lg font-semibold">{profile.goal_weight ? `${profile.goal_weight} kg` : 'Not set'}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Activity Level</p>
                      <p className="text-lg font-semibold">{profile.activity_level || 'Not set'}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Goal</p>
                      <p className="text-lg font-semibold">{profile.goal || 'Not set'}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <h2 className="text-2xl font-barlow font-black uppercase mb-4">Edit Profile</h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="uppercase text-xs tracking-wider">Name</Label>
                      <Input
                        data-testid="profile-name-input"
                        value={formData.name || ''}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label className="uppercase text-xs tracking-wider">Age</Label>
                      <Input
                        type="number"
                        data-testid="profile-age-input"
                        value={formData.age || ''}
                        onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label className="uppercase text-xs tracking-wider">Height (cm)</Label>
                      <Input
                        type="number"
                        data-testid="profile-height-input"
                        value={formData.height || ''}
                        onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label className="uppercase text-xs tracking-wider">Current Weight (kg)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        data-testid="profile-weight-input"
                        value={formData.current_weight || ''}
                        onChange={(e) => setFormData({ ...formData, current_weight: e.target.value })}
                        className="mt-1"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Label className="uppercase text-xs tracking-wider">Goal Weight (kg)</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          type="number"
                          step="0.1"
                          data-testid="profile-goal-weight-input"
                          value={formData.goal_weight || ''}
                          onChange={(e) => setFormData({ ...formData, goal_weight: e.target.value })}
                          placeholder="Set manually or use BMI"
                        />
                        <Button
                          type="button"
                          onClick={() => {
                            if (formData.height && formData.current_weight) {
                              const heightM = parseFloat(formData.height) / 100;
                              const idealWeight = 22 * (heightM * heightM);
                              setFormData({ ...formData, goal_weight: (Math.round(idealWeight * 10) / 10).toString() });
                              toast.success(`Goal set to ${Math.round(idealWeight * 10) / 10}kg (healthy BMI)`);
                            } else {
                              toast.error('Please enter height and current weight first');
                            }
                          }}
                          data-testid="set-bmi-goal-button"
                          className="bg-primary text-primary-foreground hover:bg-primary/90 whitespace-nowrap px-4 text-xs uppercase font-bold tracking-wider"
                        >
                          BMI Goal
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        BMI-based goal calculates healthy weight (BMI 22) for your height
                      </p>
                    </div>

                    <div>
                      <Label className="uppercase text-xs tracking-wider">Activity Level</Label>
                      <Select
                        value={formData.activity_level || 'moderate'}
                        onValueChange={(value) => setFormData({ ...formData, activity_level: value })}
                      >
                        <SelectTrigger data-testid="profile-activity-select" className="mt-1">
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

                    <div>
                      <Label className="uppercase text-xs tracking-wider">Goal</Label>
                      <Select
                        value={formData.goal || 'maintenance'}
                        onValueChange={(value) => setFormData({ ...formData, goal: value })}
                      >
                        <SelectTrigger data-testid="profile-goal-select" className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fat_loss">Fat Loss</SelectItem>
                          <SelectItem value="muscle_gain">Muscle Gain</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                          <SelectItem value="athlete">Athlete</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button
                      type="submit"
                      data-testid="save-profile-button"
                      className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8 uppercase font-bold tracking-widest"
                    >
                      <Save className="mr-2 w-5 h-5" />
                      Save Changes
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        setEditing(false);
                        setFormData(profile);
                      }}
                      variant="outline"
                      className="h-12 px-8 uppercase font-bold tracking-widest"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </motion.div>
          </TabsContent>

          <TabsContent value="calculators" className="mt-6 space-y-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-card border border-border p-6"
            >
              <h2 className="text-2xl font-barlow font-black uppercase mb-4">Fitness Calculators</h2>
              <p className="text-muted-foreground mb-6">Calculate your BMI, BMR, and TDEE</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <Label className="uppercase text-xs tracking-wider">Weight (kg)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    data-testid="calc-weight"
                    value={calcData.weight}
                    onChange={(e) => setCalcData({ ...calcData, weight: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="uppercase text-xs tracking-wider">Height (cm)</Label>
                  <Input
                    type="number"
                    data-testid="calc-height"
                    value={calcData.height}
                    onChange={(e) => setCalcData({ ...calcData, height: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="uppercase text-xs tracking-wider">Age</Label>
                  <Input
                    type="number"
                    data-testid="calc-age"
                    value={calcData.age}
                    onChange={(e) => setCalcData({ ...calcData, age: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="uppercase text-xs tracking-wider">Gender</Label>
                  <Select value={calcData.gender} onValueChange={(value) => setCalcData({ ...calcData, gender: value })}>
                    <SelectTrigger data-testid="calc-gender" className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <Label className="uppercase text-xs tracking-wider">Activity Level</Label>
                  <Select value={calcData.activity_level} onValueChange={(value) => setCalcData({ ...calcData, activity_level: value })}>
                    <SelectTrigger data-testid="calc-activity" className="mt-1">
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
              </div>

              <Button
                onClick={calculateAll}
                data-testid="calculate-button"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-12 uppercase font-bold tracking-widest"
              >
                <Calculator className="mr-2 w-5 h-5" />
                Calculate All
              </Button>
            </motion.div>

            {calcResults && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-primary/50 p-6"
              >
                <h3 className="text-xl font-barlow font-black uppercase mb-6">Your Results</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-background border border-border">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">BMI</p>
                    <p className="text-4xl font-barlow font-black text-primary">{calcResults.bmi}</p>
                    <p className="text-sm text-muted-foreground mt-1">{calcResults.bmi_category}</p>
                  </div>

                  <div className="text-center p-4 bg-background border border-border">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">BMR</p>
                    <p className="text-4xl font-barlow font-black text-chart-3">{Math.round(calcResults.bmr)}</p>
                    <p className="text-sm text-muted-foreground mt-1">kcal/day</p>
                  </div>

                  <div className="text-center p-4 bg-background border border-border">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">TDEE</p>
                    <p className="text-4xl font-barlow font-black text-chart-2">{Math.round(calcResults.tdee)}</p>
                    <p className="text-sm text-muted-foreground mt-1">kcal/day</p>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-background border-l-4 border-l-primary">
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">TDEE</strong> is your Total Daily Energy Expenditure. This is the number of calories you need to maintain your current weight.
                  </p>
                </div>
              </motion.div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};
