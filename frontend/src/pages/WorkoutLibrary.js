import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Layout } from '../components/Layout';
import { PlaySquare, Clock, Zap, Filter } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const WorkoutLibrary = () => {
  const [videos, setVideos] = useState([]);
  const [filteredVideos, setFilteredVideos] = useState([]);
  const [muscleFilter, setMuscleFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');

  useEffect(() => {
    fetchVideos();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [videos, muscleFilter, difficultyFilter]);

  const fetchVideos = async () => {
    try {
      const response = await axios.get(`${API}/workout/library`);
      setVideos(response.data);
      setFilteredVideos(response.data);
    } catch (error) {
      console.error('Error fetching workout library:', error);
    }
  };

  const applyFilters = () => {
    let filtered = videos;
    
    if (muscleFilter !== 'all') {
      filtered = filtered.filter(v => v.muscle_group === muscleFilter);
    }
    
    if (difficultyFilter !== 'all') {
      filtered = filtered.filter(v => v.difficulty === difficultyFilter);
    }
    
    setFilteredVideos(filtered);
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return 'text-chart-3 border-chart-3';
      case 'intermediate': return 'text-chart-4 border-chart-4';
      case 'advanced': return 'text-destructive border-destructive';
      default: return 'text-muted-foreground border-muted-foreground';
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-6 py-8 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl md:text-5xl font-barlow font-black uppercase">Workout Library</h1>
          <p className="text-muted-foreground mt-2 uppercase text-xs tracking-widest">Professional Training Programs</p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col md:flex-row gap-4 bg-card border border-border p-4"
        >
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-primary" />
            <span className="uppercase text-xs tracking-wider font-bold">Filters:</span>
          </div>
          
          <Select value={muscleFilter} onValueChange={setMuscleFilter}>
            <SelectTrigger data-testid="muscle-group-filter" className="w-full md:w-48">
              <SelectValue placeholder="Muscle Group" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Muscle Groups</SelectItem>
              <SelectItem value="full_body">Full Body</SelectItem>
              <SelectItem value="chest">Chest</SelectItem>
              <SelectItem value="back">Back</SelectItem>
              <SelectItem value="legs">Legs</SelectItem>
              <SelectItem value="abs">Abs</SelectItem>
              <SelectItem value="mobility">Mobility</SelectItem>
            </SelectContent>
          </Select>

          <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
            <SelectTrigger data-testid="difficulty-filter" className="w-full md:w-48">
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>

          <div className="text-sm text-muted-foreground flex items-center">
            <span className="font-bold text-primary">{filteredVideos.length}</span>
            <span className="ml-1">workouts found</span>
          </div>
        </motion.div>

        {/* Video Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredVideos.map((video, index) => (
            <motion.div
              key={video.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              data-testid={`workout-video-${video.id}`}
              className="bg-card border border-border hover:border-primary/50 transition-colors overflow-hidden group"
            >
              {/* Thumbnail */}
              <div className="relative h-48 overflow-hidden bg-secondary">
                <img
                  src={video.thumbnail_url}
                  alt={video.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors flex items-center justify-center">
                  <PlaySquare className="w-16 h-16 text-primary" strokeWidth={1.5} />
                </div>
                
                {/* Duration Badge */}
                <div className="absolute top-3 right-3 bg-black/80 px-3 py-1 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold uppercase">{video.duration_minutes} min</span>
                </div>
              </div>

              {/* Content */}
              <div className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-barlow font-black uppercase text-lg leading-tight">{video.title}</h3>
                  <span className={`px-2 py-1 text-xs uppercase font-bold tracking-wider border ${getDifficultyColor(video.difficulty)}`}>
                    {video.difficulty}
                  </span>
                </div>
                
                <p className="text-sm text-muted-foreground">{video.description}</p>
                
                <div className="flex items-center gap-4 text-xs uppercase tracking-wider text-muted-foreground pt-2 border-t border-border">
                  <span className="flex items-center gap-1">
                    <Zap className="w-4 h-4 text-primary" />
                    {video.muscle_group.replace('_', ' ')}
                  </span>
                  <span>{video.equipment}</span>
                </div>

                <Button
                  onClick={() => window.open(video.video_url, '_blank')}
                  data-testid={`watch-video-${video.id}`}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-10 uppercase font-bold tracking-widest text-xs"
                >
                  <PlaySquare className="mr-2 w-4 h-4" />
                  Watch Now
                </Button>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {filteredVideos.length === 0 && (
          <div className="text-center py-12">
            <PlaySquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No workouts match your filters. Try adjusting them.</p>
          </div>
        )}
      </div>
    </Layout>
  );
};
