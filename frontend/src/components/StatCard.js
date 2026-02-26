import React from 'react';
import { motion } from 'framer-motion';

export const StatCard = ({ title, value, unit, icon: Icon, trend, className = '' }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`bg-card border border-border hover:border-primary/50 transition-colors duration-300 p-6 ${className}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-4xl font-barlow font-black text-foreground">{value}</h3>
            {unit && <span className="text-lg text-muted-foreground uppercase font-semibold">{unit}</span>}
          </div>
          {trend && (
            <p className={`text-sm mt-2 font-semibold ${
              trend.startsWith('+') ? 'text-chart-3' : 'text-destructive'
            }`}>
              {trend}
            </p>
          )}
        </div>
        {Icon && (
          <div className="w-12 h-12 bg-primary/10 flex items-center justify-center">
            <Icon className="w-6 h-6 text-primary" strokeWidth={1.5} />
          </div>
        )}
      </div>
    </motion.div>
  );
};
