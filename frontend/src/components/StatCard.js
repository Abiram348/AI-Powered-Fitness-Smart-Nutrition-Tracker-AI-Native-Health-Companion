import React from 'react';
import { motion } from 'framer-motion';

export const StatCard = ({ title, value, unit, icon: Icon, trend, className = '' }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      className={`glass-card rounded-lg hover:border-primary/20 transition-all duration-300 p-5 sm:p-6 ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">{title}</p>
          <div className="flex items-baseline gap-1.5 sm:gap-2">
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-barlow font-black text-foreground">{value}</h3>
            {unit && <span className="text-xs sm:text-sm text-muted-foreground uppercase font-semibold truncate">{unit}</span>}
          </div>
          {trend && (
            <p className={`text-xs sm:text-sm mt-2 font-semibold ${
              trend.startsWith('+') ? 'text-chart-3' : trend.includes('remaining') ? 'text-chart-4' : 'text-muted-foreground'
            }`}>
              {trend}
            </p>
          )}
        </div>
        {Icon && (
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 ml-3">
            <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" strokeWidth={1.5} />
          </div>
        )}
      </div>
    </motion.div>
  );
};
