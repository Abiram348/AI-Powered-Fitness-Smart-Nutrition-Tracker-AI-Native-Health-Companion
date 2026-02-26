import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from './components/ui/sonner';
import { Landing } from './pages/Landing';
import { Dashboard } from './pages/Dashboard';
import { FoodTracker } from './pages/FoodTracker';
import { WaterTracker } from './pages/WaterTracker';
import { WorkoutTracker } from './pages/WorkoutTracker';
import { WorkoutLibrary } from './pages/WorkoutLibrary';
import { Analytics } from './pages/Analytics';
import { DietCoach } from './pages/DietCoach';
import { Profile } from './pages/Profile';
import '@/App.css';

const PrivateRoute = ({ children }) => {
  const { token, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }
  
  return token ? children : <Navigate to="/" />;
};

function AppContent() {
  return (
    <>
      <Toaster position="top-right" richColors />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/food"
          element={
            <PrivateRoute>
              <FoodTracker />
            </PrivateRoute>
          }
        />
        <Route
          path="/water"
          element={
            <PrivateRoute>
              <WaterTracker />
            </PrivateRoute>
          }
        />
        <Route
          path="/workout"
          element={
            <PrivateRoute>
              <WorkoutTracker />
            </PrivateRoute>
          }
        />
        <Route
          path="/library"
          element={
            <PrivateRoute>
              <WorkoutLibrary />
            </PrivateRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <PrivateRoute>
              <Analytics />
            </PrivateRoute>
          }
        />
        <Route
          path="/diet-coach"
          element={
            <PrivateRoute>
              <DietCoach />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />
      </Routes>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
