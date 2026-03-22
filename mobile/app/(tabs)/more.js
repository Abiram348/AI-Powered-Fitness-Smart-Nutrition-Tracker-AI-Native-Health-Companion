import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, RefreshControl, Dimensions, Modal, Linking, ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../src/context/AuthContext';
import {
  analyticsAPI, dietAPI, profileAPI, calculatorAPI,
} from '../../src/services/api';
import { Card, GradientButton, SectionHeader, TextInput, Badge, EmptyState } from '../../src/components/UI';
import { Colors, Spacing, FontSize, BorderRadius, Shadows } from '../../src/constants/theme';

const { width } = Dimensions.get('window');

export default function MoreScreen() {
  const { user, logout, refreshProfile } = useAuth();
  const [activeSection, setActiveSection] = useState(null); // 'analytics', 'diet', 'profile', 'calculator'

  const sections = [
    { id: 'analytics', icon: 'analytics', color: Colors.accentPink, title: 'Analytics', subtitle: 'View your progress' },
    { id: 'diet', icon: 'restaurant', color: Colors.accentGreen, title: 'Diet Coach', subtitle: 'AI meal planning' },
    { id: 'profile', icon: 'person', color: Colors.primary, title: 'Profile', subtitle: 'Manage your info' },
    { id: 'calculator', icon: 'calculator', color: Colors.accentOrange, title: 'Calculator', subtitle: 'BMI, BMR, TDEE' },
  ];

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive', onPress: async () => {
          await logout();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.screenTitle}>More</Text>

        {/* User Card */}
        <Card style={styles.userCard}>
          <LinearGradient colors={Colors.gradients.primary} style={styles.avatar}>
            <Text style={styles.avatarText}>{(user?.name || 'U').charAt(0).toUpperCase()}</Text>
          </LinearGradient>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || 'User'}</Text>
            <Text style={styles.userEmail}>{user?.email || ''}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
        </Card>

        {/* Menu Grid */}
        <View style={styles.menuGrid}>
          {sections.map((s) => (
            <TouchableOpacity
              key={s.id}
              style={styles.menuItem}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveSection(s.id); }}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIcon, { backgroundColor: s.color + '18' }]}>
                <Ionicons name={s.icon} size={26} color={s.color} />
              </View>
              <Text style={styles.menuTitle}>{s.title}</Text>
              <Text style={styles.menuSubtitle}>{s.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={20} color={Colors.error} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>FitTrack AI v1.0.0</Text>
      </ScrollView>

      {/* Analytics Modal */}
      <Modal visible={activeSection === 'analytics'} animationType="slide" presentationStyle="pageSheet">
        <AnalyticsSection onClose={() => setActiveSection(null)} />
      </Modal>

      {/* Diet Coach Modal */}
      <Modal visible={activeSection === 'diet'} animationType="slide" presentationStyle="pageSheet">
        <DietCoachSection onClose={() => setActiveSection(null)} />
      </Modal>

      {/* Profile Modal */}
      <Modal visible={activeSection === 'profile'} animationType="slide" presentationStyle="pageSheet">
        <ProfileSection onClose={() => setActiveSection(null)} user={user} refreshProfile={refreshProfile} />
      </Modal>

      {/* Calculator Modal */}
      <Modal visible={activeSection === 'calculator'} animationType="slide" presentationStyle="pageSheet">
        <CalculatorSection onClose={() => setActiveSection(null)} />
      </Modal>
    </SafeAreaView>
  );
}

// ==================== ANALYTICS SECTION ====================
function AnalyticsSection({ onClose }) {
  const [data, setData] = useState(null);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  const nutritionEntries = Object.entries(data?.daily_nutrition || {}).slice(-7);
  const maxCalories = Math.max(
    1,
    ...nutritionEntries.map(([, values]) => Number(values?.calories || 0))
  );

  const visualCards = data ? [
    {
      title: 'Workout Momentum',
      subtitle: `${data.total_workouts || 0} sessions in 30 days`,
      image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1200&auto=format&fit=crop',
    },
    {
      title: 'Nutrition Rhythm',
      subtitle: `${Math.round(data.avg_daily_calories || 0)} avg kcal/day`,
      image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1200&auto=format&fit=crop',
    },
    {
      title: 'Body Transformation',
      subtitle: `${data.weight_trend?.length || 0} weight entries tracked`,
      image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&auto=format&fit=crop',
    },
  ] : [];

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const [progressRes, insightsRes] = await Promise.allSettled([
        analyticsAPI.getProgress(30),
        analyticsAPI.getInsights(),
      ]);
      if (progressRes.status === 'fulfilled') setData(progressRes.value.data);
      if (insightsRes.status === 'fulfilled') setInsights(insightsRes.value.data?.insights || []);
    } catch (e) {
      console.log('Analytics error:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ModalHeader title="Analytics" onClose={onClose} />
      <ScrollView contentContainerStyle={styles.modalBody}>
        {loading ? (
          <EmptyState icon="hourglass-outline" title="Loading analytics..." />
        ) : !data ? (
          <EmptyState icon="analytics-outline" title="No data yet" subtitle="Start logging to see your progress" />
        ) : (
          <>
            {/* Picture Highlights */}
            <SectionHeader title="Progress Pictures" />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.visualCardsRow}
              style={{ marginBottom: Spacing.lg }}
            >
              {visualCards.map((card, index) => (
                <ImageBackground
                  key={card.title}
                  source={{ uri: card.image }}
                  style={[styles.visualCard, index === visualCards.length - 1 && { marginRight: 0 }]}
                  imageStyle={styles.visualCardImage}
                >
                  <LinearGradient colors={['transparent', 'rgba(0,0,0,0.78)']} style={styles.visualCardOverlay}>
                    <Text style={styles.visualCardTitle}>{card.title}</Text>
                    <Text style={styles.visualCardSubtitle}>{card.subtitle}</Text>
                  </LinearGradient>
                </ImageBackground>
              ))}
            </ScrollView>

            <View style={styles.analyticsGrid}>
              <Card style={styles.analyticCard}>
                <Ionicons name="barbell" size={24} color={Colors.accentOrange} />
                <Text style={styles.analyticValue}>{data.total_workouts || 0}</Text>
                <Text style={styles.analyticLabel}>Workouts (30d)</Text>
              </Card>
              <Card style={styles.analyticCard}>
                <Ionicons name="flame" size={24} color={Colors.accentRed} />
                <Text style={styles.analyticValue}>{Math.round(data.avg_daily_calories || 0)}</Text>
                <Text style={styles.analyticLabel}>Avg Calories/Day</Text>
              </Card>
            </View>

            {/* 7-Day Calorie Graph */}
            {nutritionEntries.length > 0 && (
              <>
                <SectionHeader title="7-Day Calorie Graph" />
                <Card style={styles.miniGraphCard}>
                  <View style={styles.miniGraphRow}>
                    {nutritionEntries.map(([date, values]) => {
                      const calories = Number(values?.calories || 0);
                      const ratio = Math.max(0.06, calories / maxCalories);
                      const label = new Date(date).toLocaleDateString('en-US', { day: 'numeric' });
                      return (
                        <View key={date} style={styles.miniGraphCol}>
                          <View style={styles.miniGraphTrack}>
                            <View style={[styles.miniGraphBar, { height: `${Math.round(ratio * 100)}%` }]} />
                          </View>
                          <Text style={styles.miniGraphLabel}>{label}</Text>
                          <Text style={styles.miniGraphValue}>{Math.round(calories)}</Text>
                        </View>
                      );
                    })}
                  </View>
                </Card>
              </>
            )}

            {/* Weight Trend */}
            {data.weight_trend?.length > 0 && (
              <>
                <SectionHeader title="Weight Trend" />
                {data.weight_trend.map((w, i) => (
                  <Card key={i} style={[styles.trendCard, { marginBottom: Spacing.sm }]}>
                    <View style={styles.trendRow}>
                      <Text style={styles.trendDate}>{w.timestamp?.substring(0, 10)}</Text>
                      <Text style={styles.trendValue}>{w.weight} kg</Text>
                    </View>
                  </Card>
                ))}
              </>
            )}

            {/* Insights */}
            {insights.length > 0 && (
              <>
                <SectionHeader title="AI Insights" />
                {insights.map((ins, i) => (
                  <Card key={i} style={[styles.insightCard, { marginBottom: Spacing.md }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
                      <Ionicons
                        name={ins.type === 'success' ? 'checkmark-circle' : 'alert-circle'}
                        size={20}
                        color={ins.type === 'success' ? Colors.success : Colors.warning}
                      />
                      <Text style={styles.insightText}>{ins.message}</Text>
                    </View>
                  </Card>
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ==================== DIET COACH SECTION ====================
function DietCoachSection({ onClose }) {
  const [form, setForm] = useState({
    goal: 'weight_loss',
    current_weight: '',
    goal_weight: '',
    activity_level: 'moderate',
    dietary_preferences: '',
  });
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);

  const goals = ['weight_loss', 'muscle_gain', 'maintenance', 'endurance'];
  const activities = ['sedentary', 'light', 'moderate', 'active', 'very_active'];
  const mealRecipes = Array.isArray(plan?.meal_recipes) ? plan.meal_recipes : [];
  const mealSuggestions = Array.isArray(plan?.meal_suggestions) ? plan.meal_suggestions : [];

  const generatePlan = async () => {
    if (!form.current_weight || !form.goal_weight) {
      Alert.alert('Error', 'Please enter current and goal weight');
      return;
    }
    setLoading(true);
    try {
      const res = await dietAPI.generatePlan({
        ...form,
        current_weight: parseFloat(form.current_weight),
        goal_weight: parseFloat(form.goal_weight),
      });
      setPlan(res.data);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      Alert.alert('Error', 'Failed to generate diet plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const openRecipeVideo = async (url) => {
    if (!url) return;
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Alert.alert('Unable to open video', 'This video link is not supported on your device.');
        return;
      }
      await Linking.openURL(url);
    } catch (e) {
      Alert.alert('Error', 'Failed to open video link. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ModalHeader title="AI Diet Coach" onClose={onClose} />
      <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
        {!plan ? (
          <>
            <Text style={styles.sectionDesc}>Get a personalized diet plan powered by AI</Text>

            <Text style={styles.chipLabel}>Goal</Text>
            <View style={styles.chipRow}>
              {goals.map((g) => (
                <TouchableOpacity key={g} style={[styles.chip, form.goal === g && styles.chipActive]} onPress={() => setForm(p => ({ ...p, goal: g }))}>
                  <Text style={[styles.chipText, form.goal === g && styles.chipTextActive]}>{g.replace('_', ' ')}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.formRow}>
              <View style={{ flex: 1 }}>
                <TextInput label="Current Weight (kg)" placeholder="70" value={form.current_weight} onChangeText={(v) => setForm(p => ({ ...p, current_weight: v }))} keyboardType="numeric" />
              </View>
              <View style={{ flex: 1 }}>
                <TextInput label="Goal Weight (kg)" placeholder="65" value={form.goal_weight} onChangeText={(v) => setForm(p => ({ ...p, goal_weight: v }))} keyboardType="numeric" />
              </View>
            </View>

            <Text style={styles.chipLabel}>Activity Level</Text>
            <View style={styles.chipRow}>
              {activities.map((a) => (
                <TouchableOpacity key={a} style={[styles.chip, form.activity_level === a && styles.chipActive]} onPress={() => setForm(p => ({ ...p, activity_level: a }))}>
                  <Text style={[styles.chipText, form.activity_level === a && styles.chipTextActive]}>{a.replace('_', ' ')}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput label="Dietary Preferences (optional)" placeholder="e.g., vegetarian, keto, no dairy" value={form.dietary_preferences} onChangeText={(v) => setForm(p => ({ ...p, dietary_preferences: v }))} />

            <GradientButton title="Generate AI Plan" onPress={generatePlan} loading={loading} icon="sparkles" style={{ marginTop: Spacing.xl }} />
          </>
        ) : (
          <>
            <Card style={styles.planCard}>
              <View style={styles.planHeader}>
                <Ionicons name="sparkles" size={24} color={Colors.primary} />
                <Text style={styles.planTitle}>Your AI Diet Plan</Text>
              </View>
              <View style={styles.macroRow}>
                <View style={styles.macroItem}>
                  <Text style={[styles.macroValue, { color: Colors.accentOrange }]}>{plan.daily_calories}</Text>
                  <Text style={styles.macroLabel}>Calories/Day</Text>
                </View>
                <View style={styles.macroItem}>
                  <Text style={[styles.macroValue, { color: Colors.accentGreen }]}>{plan.macro_split?.protein || 30}%</Text>
                  <Text style={styles.macroLabel}>Protein</Text>
                </View>
                <View style={styles.macroItem}>
                  <Text style={[styles.macroValue, { color: Colors.accent }]}>{plan.macro_split?.carbs || 40}%</Text>
                  <Text style={styles.macroLabel}>Carbs</Text>
                </View>
                <View style={styles.macroItem}>
                  <Text style={[styles.macroValue, { color: Colors.accentPink }]}>{plan.macro_split?.fat || 30}%</Text>
                  <Text style={styles.macroLabel}>Fat</Text>
                </View>
              </View>
            </Card>

            {mealRecipes.length > 0 && (
              <>
                <SectionHeader title="Meal Suggestions + Cooking Steps" />
                {mealRecipes.map((recipe, i) => {
                  const videoUrl = recipe?.video_url || recipe?.video_search_url;
                  return (
                    <Card key={i} style={[styles.recipeCard, { marginBottom: Spacing.md }]}> 
                      <View style={styles.recipeHeaderRow}>
                        <View style={styles.mealNumber}>
                          <Text style={styles.mealNumberText}>{i + 1}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.recipeTitle}>{recipe.meal_name}</Text>
                          {!!recipe.short_description && (
                            <Text style={styles.recipeDesc}>{recipe.short_description}</Text>
                          )}
                        </View>
                      </View>

                      {(recipe.prep_time_minutes || recipe.calories_estimate) && (
                        <View style={styles.recipeMetaRow}>
                          {recipe.prep_time_minutes ? (
                            <Text style={styles.recipeMetaPill}>Prep {recipe.prep_time_minutes} min</Text>
                          ) : null}
                          {recipe.calories_estimate ? (
                            <Text style={styles.recipeMetaPill}>~{recipe.calories_estimate} kcal</Text>
                          ) : null}
                        </View>
                      )}

                      {Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0 && (
                        <View style={styles.recipeSection}>
                          <Text style={styles.recipeSectionTitle}>Ingredients</Text>
                          {recipe.ingredients.map((ingredient, ingredientIndex) => (
                            <Text key={ingredientIndex} style={styles.recipeBullet}>- {ingredient}</Text>
                          ))}
                        </View>
                      )}

                      {Array.isArray(recipe.steps) && recipe.steps.length > 0 && (
                        <View style={styles.recipeSection}>
                          <Text style={styles.recipeSectionTitle}>Step-by-step</Text>
                          {recipe.steps.map((step, stepIndex) => (
                            <Text key={stepIndex} style={styles.recipeStep}>{stepIndex + 1}. {step}</Text>
                          ))}
                        </View>
                      )}

                      {videoUrl ? (
                        <TouchableOpacity
                          style={styles.recipeVideoBtn}
                          onPress={() => openRecipeVideo(videoUrl)}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="play-circle-outline" size={18} color={Colors.primary} />
                          <Text style={styles.recipeVideoText}>Watch preparation video</Text>
                          <Ionicons name="open-outline" size={14} color={Colors.textTertiary} />
                        </TouchableOpacity>
                      ) : null}
                    </Card>
                  );
                })}
              </>
            )}

            {mealRecipes.length === 0 && mealSuggestions.length > 0 && (
              <>
                <SectionHeader title="Meal Suggestions" />
                {mealSuggestions.map((meal, i) => (
                  <Card key={i} style={[styles.mealCard, { marginBottom: Spacing.sm }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
                      <View style={styles.mealNumber}>
                        <Text style={styles.mealNumberText}>{i + 1}</Text>
                      </View>
                      <Text style={styles.mealText}>{meal}</Text>
                    </View>
                  </Card>
                ))}
              </>
            )}

            {plan.plan && (
              <>
                <SectionHeader title="Advice" />
                <Card><Text style={styles.adviceText}>{plan.plan}</Text></Card>
              </>
            )}

            <GradientButton title="Generate New Plan" onPress={() => setPlan(null)} gradient={Colors.gradients.accent} style={{ marginTop: Spacing.xxl }} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ==================== PROFILE SECTION ====================
function ProfileSection({ onClose, user, refreshProfile }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    age: user?.age?.toString() || '',
    height: user?.height?.toString() || '',
    current_weight: user?.current_weight?.toString() || '',
    goal_weight: user?.goal_weight?.toString() || '',
    activity_level: user?.activity_level || 'moderate',
    goal: user?.goal || 'maintenance',
  });
  const [saving, setSaving] = useState(false);

  const saveProfile = async () => {
    setSaving(true);
    try {
      const data = {};
      if (form.name) data.name = form.name;
      if (form.age) data.age = parseInt(form.age);
      if (form.height) data.height = parseFloat(form.height);
      if (form.current_weight) data.current_weight = parseFloat(form.current_weight);
      if (form.goal_weight) data.goal_weight = parseFloat(form.goal_weight);
      if (form.activity_level) data.activity_level = form.activity_level;
      if (form.goal) data.goal = form.goal;

      await profileAPI.update(data);
      await refreshProfile();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setEditing(false);
    } catch (e) {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ModalHeader title="Profile" onClose={onClose} />
      <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
        {/* Avatar */}
        <View style={styles.profileAvatarSection}>
          <LinearGradient colors={Colors.gradients.primary} style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>{(user?.name || 'U').charAt(0).toUpperCase()}</Text>
          </LinearGradient>
          <Text style={styles.profileName}>{user?.name || 'User'}</Text>
          <Text style={styles.profileEmail}>{user?.email || ''}</Text>
        </View>

        {editing ? (
          <>
            <TextInput label="Name" value={form.name} onChangeText={(v) => setForm(p => ({ ...p, name: v }))} />
            <View style={styles.formRow}>
              <View style={{ flex: 1 }}>
                <TextInput label="Age" value={form.age} onChangeText={(v) => setForm(p => ({ ...p, age: v }))} keyboardType="numeric" />
              </View>
              <View style={{ flex: 1 }}>
                <TextInput label="Height (cm)" value={form.height} onChangeText={(v) => setForm(p => ({ ...p, height: v }))} keyboardType="numeric" />
              </View>
            </View>
            <View style={styles.formRow}>
              <View style={{ flex: 1 }}>
                <TextInput label="Current Weight (kg)" value={form.current_weight} onChangeText={(v) => setForm(p => ({ ...p, current_weight: v }))} keyboardType="numeric" />
              </View>
              <View style={{ flex: 1 }}>
                <TextInput label="Goal Weight (kg)" value={form.goal_weight} onChangeText={(v) => setForm(p => ({ ...p, goal_weight: v }))} keyboardType="numeric" />
              </View>
            </View>
            <GradientButton title="Save Changes" onPress={saveProfile} loading={saving} icon="checkmark-circle-outline" style={{ marginTop: Spacing.xl }} />
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditing(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Card style={styles.profileDetailCard}>
              <ProfileRow icon="calendar" label="Age" value={user?.age ? `${user.age} years` : 'Not set'} />
              <ProfileRow icon="resize" label="Height" value={user?.height ? `${user.height} cm` : 'Not set'} />
              <ProfileRow icon="scale" label="Current Weight" value={user?.current_weight ? `${user.current_weight} kg` : 'Not set'} />
              <ProfileRow icon="flag" label="Goal Weight" value={user?.goal_weight ? `${user.goal_weight} kg` : 'Not set'} />
              <ProfileRow icon="speedometer" label="Activity" value={user?.activity_level || 'Not set'} last />
            </Card>
            <GradientButton title="Edit Profile" onPress={() => setEditing(true)} icon="create-outline" style={{ marginTop: Spacing.xl }} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ProfileRow({ icon, label, value, last }) {
  return (
    <View style={[styles.profileRow, !last && styles.profileRowBorder]}>
      <View style={styles.profileRowLeft}>
        <Ionicons name={icon} size={18} color={Colors.textTertiary} />
        <Text style={styles.profileRowLabel}>{label}</Text>
      </View>
      <Text style={styles.profileRowValue}>{value}</Text>
    </View>
  );
}

// ==================== CALCULATOR SECTION ====================
function CalculatorSection({ onClose }) {
  const [form, setForm] = useState({ weight: '', height: '', age: '', gender: 'male', activity_level: 'moderate' });
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const calculate = async () => {
    if (!form.weight || !form.height) {
      Alert.alert('Error', 'Please enter weight and height');
      return;
    }
    setLoading(true);
    try {
      const data = {
        weight: parseFloat(form.weight),
        height: parseFloat(form.height),
        age: form.age ? parseInt(form.age) : undefined,
        gender: form.gender,
        activity_level: form.activity_level,
      };
      const [bmiRes, bmrRes, tdeeRes] = await Promise.allSettled([
        calculatorAPI.bmi(data),
        form.age ? calculatorAPI.bmr(data) : Promise.reject('no age'),
        form.age ? calculatorAPI.tdee(data) : Promise.reject('no age'),
      ]);
      setResults({
        bmi: bmiRes.status === 'fulfilled' ? bmiRes.value.data : null,
        bmr: bmrRes.status === 'fulfilled' ? bmrRes.value.data : null,
        tdee: tdeeRes.status === 'fulfilled' ? tdeeRes.value.data : null,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      Alert.alert('Error', 'Calculation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ModalHeader title="Health Calculator" onClose={onClose} />
      <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
        <View style={styles.formRow}>
          <View style={{ flex: 1 }}>
            <TextInput label="Weight (kg)" placeholder="70" value={form.weight} onChangeText={(v) => setForm(p => ({ ...p, weight: v }))} keyboardType="numeric" />
          </View>
          <View style={{ flex: 1 }}>
            <TextInput label="Height (cm)" placeholder="175" value={form.height} onChangeText={(v) => setForm(p => ({ ...p, height: v }))} keyboardType="numeric" />
          </View>
        </View>
        <View style={styles.formRow}>
          <View style={{ flex: 1 }}>
            <TextInput label="Age" placeholder="25" value={form.age} onChangeText={(v) => setForm(p => ({ ...p, age: v }))} keyboardType="numeric" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.chipLabel}>Gender</Text>
            <View style={[styles.chipRow, { marginTop: 0 }]}>
              {['male', 'female'].map((g) => (
                <TouchableOpacity key={g} style={[styles.chip, form.gender === g && styles.chipActive]} onPress={() => setForm(p => ({ ...p, gender: g }))}>
                  <Text style={[styles.chipText, form.gender === g && styles.chipTextActive]}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <GradientButton title="Calculate" onPress={calculate} loading={loading} icon="calculator-outline" style={{ marginTop: Spacing.lg }} />

        {results && (
          <View style={{ marginTop: Spacing.xxl }}>
            {results.bmi && (
              <Card style={[styles.resultCard, { marginBottom: Spacing.md }]}>
                <Text style={styles.resultLabel}>BMI</Text>
                <Text style={styles.resultValue}>{results.bmi.bmi}</Text>
                <Badge text={results.bmi.category} color={
                  results.bmi.category === 'Normal' ? Colors.accentGreen 
                  : results.bmi.category === 'Overweight' ? Colors.accentOrange 
                  : Colors.accentRed
                } />
              </Card>
            )}
            {results.bmr && (
              <Card style={[styles.resultCard, { marginBottom: Spacing.md }]}>
                <Text style={styles.resultLabel}>BMR</Text>
                <Text style={styles.resultValue}>{results.bmr.bmr} kcal/day</Text>
              </Card>
            )}
            {results.tdee && (
              <Card style={styles.resultCard}>
                <Text style={styles.resultLabel}>TDEE</Text>
                <Text style={styles.resultValue}>{results.tdee.tdee} kcal/day</Text>
              </Card>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ==================== SHARED COMPONENTS ====================
function ModalHeader({ title, onClose }) {
  return (
    <View style={styles.modalHeader}>
      <Text style={styles.modalHeaderTitle}>{title}</Text>
      <TouchableOpacity onPress={onClose}>
        <Ionicons name="close-circle" size={28} color={Colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );
}

// ==================== STYLES ====================
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1 },
  content: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xxxl },
  screenTitle: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.text, marginTop: Spacing.md, marginBottom: Spacing.xxl },

  userCard: { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, marginBottom: Spacing.xxl },
  avatar: { width: 48, height: 48, borderRadius: BorderRadius.full, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: FontSize.xl, fontWeight: '700', color: '#fff' },
  userInfo: { flex: 1, marginLeft: Spacing.lg },
  userName: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
  userEmail: { fontSize: FontSize.sm, color: Colors.textTertiary },

  menuGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginBottom: Spacing.xxl },
  menuItem: {
    width: (width - Spacing.xl * 2 - Spacing.md) / 2,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  menuIcon: { width: 48, height: 48, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
  menuTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
  menuSubtitle: { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: 2 },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    paddingVertical: Spacing.lg, borderRadius: BorderRadius.lg,
    backgroundColor: Colors.error + '10', borderWidth: 1, borderColor: Colors.error + '30',
  },
  logoutText: { fontSize: FontSize.md, fontWeight: '600', color: Colors.error },
  version: { textAlign: 'center', color: Colors.textTertiary, fontSize: FontSize.xs, marginTop: Spacing.xxl },

  // Modal shared
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  modalHeaderTitle: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.text },
  modalBody: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, paddingBottom: Spacing.xxxl * 2 },
  formRow: { flexDirection: 'row', gap: Spacing.md },
  sectionDesc: { fontSize: FontSize.md, color: Colors.textSecondary, marginBottom: Spacing.xxl, lineHeight: 22 },

  // Chips
  chipLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '500', marginBottom: Spacing.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },
  chip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, backgroundColor: Colors.surfaceLight, borderWidth: 1, borderColor: Colors.border },
  chipActive: { backgroundColor: Colors.primary + '20', borderColor: Colors.primary },
  chipText: { fontSize: FontSize.sm, color: Colors.textSecondary, textTransform: 'capitalize' },
  chipTextActive: { color: Colors.primary, fontWeight: '600' },

  // Analytics
  analyticsGrid: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.lg },
  analyticCard: { flex: 1, alignItems: 'center', paddingVertical: Spacing.xl, gap: 6 },
  analyticValue: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.text },
  analyticLabel: { fontSize: FontSize.xs, color: Colors.textTertiary },
  visualCardsRow: { paddingRight: Spacing.sm },
  visualCard: {
    width: width * 0.75,
    height: 170,
    marginRight: Spacing.md,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  visualCardImage: { borderRadius: BorderRadius.lg },
  visualCardOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  visualCardTitle: { fontSize: FontSize.lg, color: '#fff', fontWeight: '700' },
  visualCardSubtitle: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  miniGraphCard: { paddingVertical: Spacing.lg, marginBottom: Spacing.lg },
  miniGraphRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    minHeight: 170,
  },
  miniGraphCol: { flex: 1, alignItems: 'center' },
  miniGraphTrack: {
    width: '100%',
    maxWidth: 22,
    height: 108,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  miniGraphBar: {
    width: '100%',
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
  },
  miniGraphLabel: { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: Spacing.sm },
  miniGraphValue: { fontSize: 10, color: Colors.textSecondary, marginTop: 2 },
  trendCard: { paddingVertical: Spacing.md },
  trendRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  trendDate: { fontSize: FontSize.sm, color: Colors.textSecondary },
  trendValue: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
  insightCard: { padding: Spacing.lg },
  insightText: { flex: 1, fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },

  // Diet
  planCard: { padding: Spacing.xl, marginBottom: Spacing.lg },
  planHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xl },
  planTitle: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.text },
  macroRow: { flexDirection: 'row', justifyContent: 'space-around' },
  macroItem: { alignItems: 'center' },
  macroValue: { fontSize: FontSize.xl, fontWeight: '800' },
  macroLabel: { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: 4 },
  mealCard: { paddingVertical: Spacing.md },
  mealNumber: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.primary + '20', alignItems: 'center', justifyContent: 'center' },
  mealNumberText: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.primary },
  mealText: { flex: 1, fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
  recipeCard: { padding: Spacing.lg },
  recipeHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  recipeTitle: { fontSize: FontSize.md, color: Colors.text, fontWeight: '700' },
  recipeDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2, lineHeight: 20 },
  recipeMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.sm },
  recipeMetaPill: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
  },
  recipeSection: { marginTop: Spacing.md },
  recipeSectionTitle: { fontSize: FontSize.xs, color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  recipeBullet: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20, marginBottom: 2 },
  recipeStep: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20, marginBottom: 4 },
  recipeVideoBtn: {
    marginTop: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary + '12',
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  recipeVideoText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '600' },
  adviceText: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 22 },

  // Profile
  profileAvatarSection: { alignItems: 'center', marginBottom: Spacing.xxl },
  profileAvatar: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
  profileAvatarText: { fontSize: FontSize.xxxl, fontWeight: '700', color: '#fff' },
  profileName: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.text },
  profileEmail: { fontSize: FontSize.sm, color: Colors.textTertiary, marginTop: 2 },
  profileDetailCard: { padding: 0, overflow: 'hidden' },
  profileRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.lg },
  profileRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  profileRowLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  profileRowLabel: { fontSize: FontSize.md, color: Colors.textSecondary },
  profileRowValue: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text, textTransform: 'capitalize' },
  cancelBtn: { alignItems: 'center', marginTop: Spacing.lg },
  cancelText: { fontSize: FontSize.md, color: Colors.textSecondary },

  // Calculator
  resultCard: { alignItems: 'center', paddingVertical: Spacing.xl, gap: 4 },
  resultLabel: { fontSize: FontSize.sm, color: Colors.textTertiary, fontWeight: '500' },
  resultValue: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.text },
});
