import React, { useEffect, useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Premium 3D Animated Coach Avatar
 * SVG-based character system with smooth animations, proper anatomy,
 * and polished visual design. Fully responsive for all screen sizes.
 */

const COACH_VISUALS = {
  marcus: {
    bodyColor: '#ef4444',
    bodyGradient: ['#ef4444', '#dc2626'],
    skinTone: '#c68642',
    skinHighlight: '#d4944f',
    skinShadow: '#a86e35',
    hairColor: '#1a1a1a',
    hairStyle: 'buzz',
    build: 'bulky',
    accessories: 'dogtags',
    eyeStyle: 'intense',
    eyeColor: '#2d1b00',
    browThickness: 3.5,
    jawWidth: 52,
    shoulderExtra: 16,
  },
  alex: {
    bodyColor: '#22c55e',
    bodyGradient: ['#22c55e', '#16a34a'],
    skinTone: '#f0c08a',
    skinHighlight: '#f8d4a8',
    skinShadow: '#d4a06a',
    hairColor: '#8B4513',
    hairStyle: 'messy',
    build: 'athletic',
    accessories: 'headband',
    eyeStyle: 'friendly',
    eyeColor: '#3b6e28',
    browThickness: 2.5,
    jawWidth: 46,
    shoulderExtra: 8,
  },
  dr_raj: {
    bodyColor: '#3b82f6',
    bodyGradient: ['#3b82f6', '#2563eb'],
    skinTone: '#a0785a',
    skinHighlight: '#b8906e',
    skinShadow: '#886445',
    hairColor: '#0a0a0a',
    hairStyle: 'neat',
    build: 'lean',
    accessories: 'glasses',
    eyeStyle: 'smart',
    eyeColor: '#1a1a1a',
    browThickness: 2,
    jawWidth: 42,
    shoulderExtra: 4,
  },
  maya: {
    bodyColor: '#a855f7',
    bodyGradient: ['#a855f7', '#9333ea'],
    skinTone: '#d4a574',
    skinHighlight: '#e4bb8c',
    skinShadow: '#b88a5c',
    hairColor: '#1a0a00',
    hairStyle: 'ponytail',
    build: 'fit_female',
    accessories: 'armband',
    eyeStyle: 'fierce',
    eyeColor: '#4a2800',
    browThickness: 2,
    jawWidth: 38,
    shoulderExtra: 0,
  },
  sophia: {
    bodyColor: '#ec4899',
    bodyGradient: ['#ec4899', '#db2777'],
    skinTone: '#f5d0b0',
    skinHighlight: '#fce0c8',
    skinShadow: '#ddb898',
    hairColor: '#4a2800',
    hairStyle: 'flowing',
    build: 'graceful_female',
    accessories: 'pendant',
    eyeStyle: 'warm',
    eyeColor: '#5a3510',
    browThickness: 1.8,
    jawWidth: 36,
    shoulderExtra: -2,
  },
};

const MOOD_ANIMATIONS = {
  idle: {
    body: { y: [0, -3, 0], rotateZ: [0, 0.5, 0, -0.5, 0] },
    leftArm: { rotate: [0, 2, 0, -1, 0] },
    rightArm: { rotate: [0, -1, 0, 2, 0] },
    head: { rotateZ: [0, 1, 0, -1, 0], y: [0, -1, 0] },
    eyes: { scaleY: [1, 1, 1, 0.1, 1] },
    duration: 4,
  },
  celebrating: {
    body: { y: [0, -12, 0, -8, 0], scale: [1, 1.03, 1], rotateZ: [0, 2, -2, 0] },
    leftArm: { rotate: [0, -50, -30, -55, 0] },
    rightArm: { rotate: [0, 50, 30, 55, 0] },
    head: { rotateZ: [0, 5, -5, 0], y: [0, -4, 0] },
    eyes: { scaleY: [1, 0.7, 1, 0.7, 1] },
    duration: 1.5,
  },
  encouraging: {
    body: { y: [0, -4, 0], rotateZ: [0, 1, 0] },
    leftArm: { rotate: [0, -10, 0] },
    rightArm: { rotate: [0, -25, -15, -25, 0] },
    head: { rotateZ: [0, -2, 2, 0], y: [0, -2, 0] },
    eyes: { scaleY: [1, 1, 1] },
    duration: 2,
  },
  thinking: {
    body: { y: [0, -1, 0], rotateZ: [2, 2, 1, 2] },
    leftArm: { rotate: [0, 0, 0] },
    rightArm: { rotate: [-35, -38, -35] },
    head: { rotateZ: [3, 4, 3], y: [0, -1, 0] },
    eyes: { scaleY: [1, 0.8, 1, 0.8, 1] },
    duration: 3,
  },
  waving: {
    body: { y: [0, -2, 0], rotateZ: [0, 1, 0] },
    leftArm: { rotate: [0, 0, 0] },
    rightArm: { rotate: [-30, -70, -30, -70, -30] },
    head: { rotateZ: [0, 3, -2, 3, 0] },
    eyes: { scaleY: [1, 1, 0.1, 1, 1] },
    duration: 1.2,
  },
  talking: {
    body: { y: [0, -2, 0, -1, 0], rotateZ: [0, 1, -1, 0] },
    leftArm: { rotate: [0, -8, 3, -6, 0] },
    rightArm: { rotate: [0, 8, -3, 6, 0] },
    head: { rotateZ: [0, 1.5, -1, 1, 0], y: [0, -1, 0, -1.5, 0] },
    eyes: { scaleY: [1, 1, 1] },
    duration: 2,
  },
  listening: {
    body: { y: [0, -1, 0], rotateZ: [0, 0.5, 0] },
    leftArm: { rotate: [0, 0, 0] },
    rightArm: { rotate: [0, 0, 0] },
    head: { rotateZ: [0, 2, 0, -1, 0], y: [0, -2, 0] },
    eyes: { scaleY: [1, 1, 0.1, 1, 1] },
    duration: 3,
  },
};

const SpeechBubble = ({ text, accentColor }) => (
  <AnimatePresence>
    {text && (
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 10 }}
        className="absolute -top-14 left-1/2 -translate-x-1/2 z-20"
      >
        <div
          className="px-3 py-1.5 rounded-xl text-white text-[10px] font-bold whitespace-nowrap shadow-lg"
          style={{ backgroundColor: accentColor, boxShadow: `0 4px 20px ${accentColor}44` }}
        >
          {text}
          <div
            className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45"
            style={{ backgroundColor: accentColor }}
          />
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

const ParticleEffect = ({ mood, accentColor }) => {
  const particles = mood === 'celebrating' ? 12 : mood === 'encouraging' ? 6 : 0;
  const particleData = useMemo(() =>
    Array.from({ length: particles }).map(() => ({
      size: Math.random() * 6 + 3,
      x: 30 + Math.random() * 40,
      y: 20 + Math.random() * 40,
      targetY: -50 - Math.random() * 40,
      targetX: (Math.random() - 0.5) * 50,
      delay: Math.random() * 0.8,
      duration: 1.2 + Math.random(),
    })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [particles]
  );

  return (
    <>
      {particleData.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: i % 3 === 0 ? accentColor : i % 3 === 1 ? '#fbbf24' : '#ffffff',
            left: `${p.x}%`,
            top: `${p.y}%`,
            filter: 'blur(0.5px)',
          }}
          animate={{
            y: [0, p.targetY],
            x: [0, p.targetX],
            opacity: [0.9, 0],
            scale: [1, 0.2],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: 'easeOut',
          }}
        />
      ))}
    </>
  );
};

/**
 * Premium SVG Coach Character — unified body group so parts never detach.
 * All limbs, head, and accessories live inside ONE animated <g>.
 */
const CoachSVG = ({ visuals, activeMood, isTalking, anim }) => {
  const isFemale = visuals.build.includes('female');
  const [blinkState, setBlinkState] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setBlinkState(true);
      setTimeout(() => setBlinkState(false), 120);
    }, 2800 + Math.random() * 2000);
    return () => clearInterval(interval);
  }, []);

  const headSize = 54;
  const neckW = isFemale ? 14 : 18;
  const shoulderW = isFemale ? 62 : 74 + visuals.shoulderExtra;
  const torsoH = isFemale ? 60 : 68;
  const hipW = isFemale ? 44 : 42;
  const armW = isFemale ? 14 : 16 + (visuals.build === 'bulky' ? 4 : 0);
  const armH = 56;
  const legW = isFemale ? 16 : 18;
  const legH = 60;

  const cx = 100;
  const headY = 28;
  const neckY = headY + headSize / 2 + 2;
  const torsoY = neckY + 12;
  const hipY = torsoY + torsoH;
  const legY = hipY;

  const mouthOpen = isTalking;
  const eyeScaleY = blinkState ? 0.08 : 1;

  const uniqueId = visuals.bodyColor.replace('#', '');

  return (
    <svg viewBox="0 0 200 260" className="w-full h-full overflow-visible">
      <defs>
        <linearGradient id={`body-grad-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={visuals.bodyGradient[0]} />
          <stop offset="100%" stopColor={visuals.bodyGradient[1]} />
        </linearGradient>
        <linearGradient id={`skin-grad-${uniqueId}`} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%" stopColor={visuals.skinHighlight} />
          <stop offset="100%" stopColor={visuals.skinTone} />
        </linearGradient>
        <filter id={`char-shadow-${uniqueId}`}>
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.25" />
        </filter>
        <filter id={`soft-glow-${uniqueId}`}>
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Ground shadow */}
      <ellipse cx={cx} cy="252" rx="40" ry="8" fill={visuals.bodyColor} opacity="0.2" filter={`url(#soft-glow-${uniqueId})`} />

      {/* ===== SINGLE unified body group — everything moves together ===== */}
      <motion.g
        animate={anim.body}
        transition={{ duration: anim.duration, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: `${cx}px ${hipY}px` }}
        filter={`url(#char-shadow-${uniqueId})`}
      >
        {/* Legs — static inside the body group, subtle sway only */}
        <rect
          x={cx - legW - 3} y={legY} width={legW} height={legH} rx={legW / 2}
          fill="#1e293b"
        />
        <rect
          x={cx + 3} y={legY} width={legW} height={legH} rx={legW / 2}
          fill="#1e293b"
        />
        <ellipse cx={cx - legW / 2 - 3} cy={legY + legH + 2} rx={legW / 2 + 3} ry={6} fill="#0f172a" />
        <ellipse cx={cx + legW / 2 + 3} cy={legY + legH + 2} rx={legW / 2 + 3} ry={6} fill="#0f172a" />

        {/* Torso */}
        <path
          d={isFemale
            ? `M${cx - shoulderW / 2} ${torsoY} Q${cx - shoulderW / 4} ${torsoY + 15} ${cx - hipW / 2} ${hipY} L${cx + hipW / 2} ${hipY} Q${cx + shoulderW / 4} ${torsoY + 15} ${cx + shoulderW / 2} ${torsoY} Q${cx} ${torsoY - 4} ${cx - shoulderW / 2} ${torsoY} Z`
            : `M${cx - shoulderW / 2} ${torsoY} L${cx - hipW / 2} ${hipY} Q${cx} ${hipY + 4} ${cx + hipW / 2} ${hipY} L${cx + shoulderW / 2} ${torsoY} Q${cx} ${torsoY - 4} ${cx - shoulderW / 2} ${torsoY} Z`}
          fill={`url(#body-grad-${uniqueId})`}
        />
        <path
          d={`M${cx - shoulderW / 4} ${torsoY + 2} Q${cx} ${torsoY + torsoH * 0.4} ${cx + shoulderW / 4} ${torsoY + 2}`}
          fill="rgba(255,255,255,0.12)"
        />
        <path
          d={`M${cx - 10} ${torsoY} Q${cx} ${torsoY + 8} ${cx + 10} ${torsoY}`}
          fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5"
        />

        {/* Torso accessories */}
        {visuals.accessories === 'dogtags' && (
          <motion.g
            animate={{ rotate: [-3, 3, -3] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ transformOrigin: `${cx}px ${torsoY}px` }}
          >
            <line x1={cx} y1={torsoY + 2} x2={cx} y2={torsoY + 18} stroke="#94a3b8" strokeWidth="1" />
            <rect x={cx - 4} y={torsoY + 16} width="8" height="12" rx="2" fill="#94a3b8" opacity="0.9" />
            <rect x={cx - 3} y={torsoY + 18} width="6" height="2" rx="0.5" fill="#64748b" />
          </motion.g>
        )}
        {visuals.accessories === 'pendant' && (
          <motion.g
            animate={{ rotate: [-2, 2, -2], scale: [1, 1.05, 1] }}
            transition={{ duration: 2.5, repeat: Infinity }}
            style={{ transformOrigin: `${cx}px ${torsoY}px` }}
          >
            <line x1={cx - 5} y1={torsoY} x2={cx} y2={torsoY + 14} stroke="#fbbf24" strokeWidth="0.8" />
            <line x1={cx + 5} y1={torsoY} x2={cx} y2={torsoY + 14} stroke="#fbbf24" strokeWidth="0.8" />
            <circle cx={cx} cy={torsoY + 16} r="4" fill="#fbbf24" />
            <circle cx={cx} cy={torsoY + 16} r="2" fill="#f59e0b" />
          </motion.g>
        )}

        {/* Left Arm */}
        <motion.g
          animate={anim.leftArm}
          transition={{ duration: anim.duration, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformOrigin: `${cx - shoulderW / 2 + 4}px ${torsoY + 4}px` }}
        >
          <rect
            x={cx - shoulderW / 2 - armW + 4} y={torsoY + 2}
            width={armW} height={armH} rx={armW / 2}
            fill={`url(#body-grad-${uniqueId})`}
          />
          <rect
            x={cx - shoulderW / 2 - armW + 6} y={torsoY + 4}
            width={armW / 3} height={armH - 8} rx={2}
            fill="rgba(255,255,255,0.1)"
          />
          <circle
            cx={cx - shoulderW / 2 - armW / 2 + 4} cy={torsoY + armH + 4}
            r={isFemale ? 7 : 8}
            fill={`url(#skin-grad-${uniqueId})`}
          />
          {visuals.accessories === 'armband' && (
            <rect
              x={cx - shoulderW / 2 - armW + 3} y={torsoY + 8}
              width={armW + 2} height={5} rx={2}
              fill="rgba(255,255,255,0.35)"
            />
          )}
        </motion.g>

        {/* Right Arm */}
        <motion.g
          animate={anim.rightArm}
          transition={{ duration: anim.duration, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformOrigin: `${cx + shoulderW / 2 - 4}px ${torsoY + 4}px` }}
        >
          <rect
            x={cx + shoulderW / 2 - 4} y={torsoY + 2}
            width={armW} height={armH} rx={armW / 2}
            fill={`url(#body-grad-${uniqueId})`}
          />
          <rect
            x={cx + shoulderW / 2 - 2} y={torsoY + 4}
            width={armW / 3} height={armH - 8} rx={2}
            fill="rgba(255,255,255,0.1)"
          />
          <circle
            cx={cx + shoulderW / 2 + armW / 2 - 4} cy={torsoY + armH + 4}
            r={isFemale ? 7 : 8}
            fill={`url(#skin-grad-${uniqueId})`}
          />
        </motion.g>

        {/* Neck */}
        <rect
          x={cx - neckW / 2} y={torsoY - 10}
          width={neckW} height={14} rx={neckW / 3}
          fill={`url(#skin-grad-${uniqueId})`}
        />

        {/* Head */}
        <motion.g
          animate={anim.head}
          transition={{ duration: anim.duration, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformOrigin: `${cx}px ${neckY}px` }}
        >
          <ellipse cx={cx} cy={headY} rx={headSize / 2} ry={headSize / 2 + 3} fill={`url(#skin-grad-${uniqueId})`} />
          <ellipse cx={cx} cy={headY + 8} rx={visuals.jawWidth / 2} ry={headSize / 2 - 4} fill={visuals.skinTone} />

          {/* Hair */}
          {visuals.hairStyle === 'buzz' && (
            <path d={`M${cx - headSize / 2 + 2} ${headY - 2} Q${cx} ${headY - headSize / 2 - 6} ${cx + headSize / 2 - 2} ${headY - 2}`} fill={visuals.hairColor} />
          )}
          {visuals.hairStyle === 'messy' && (
            <g>
              <path d={`M${cx - headSize / 2 - 2} ${headY + 2} Q${cx - 10} ${headY - headSize / 2 - 10} ${cx + headSize / 2 + 2} ${headY + 2}`} fill={visuals.hairColor} />
              <path d={`M${cx + 5} ${headY - headSize / 2 - 2} Q${cx + 15} ${headY - headSize / 2 - 12} ${cx + headSize / 2 + 4} ${headY - 6}`} fill={visuals.hairColor} />
              <circle cx={cx - 12} cy={headY - headSize / 2 + 2} r={6} fill={visuals.hairColor} />
            </g>
          )}
          {visuals.hairStyle === 'neat' && (
            <g>
              <path d={`M${cx - headSize / 2 + 1} ${headY} Q${cx - 5} ${headY - headSize / 2 - 8} ${cx + headSize / 2 - 1} ${headY}`} fill={visuals.hairColor} />
              <path d={`M${cx - headSize / 2 + 1} ${headY} L${cx - headSize / 2 - 1} ${headY + 6} Q${cx - headSize / 2} ${headY - 2} ${cx - headSize / 2 + 1} ${headY}`} fill={visuals.hairColor} />
            </g>
          )}
          {visuals.hairStyle === 'ponytail' && (
            <g>
              <path d={`M${cx - headSize / 2 - 1} ${headY + 2} Q${cx} ${headY - headSize / 2 - 8} ${cx + headSize / 2 + 1} ${headY + 2}`} fill={visuals.hairColor} />
              <motion.path
                d={`M${cx + headSize / 2 - 5} ${headY - 8} Q${cx + headSize / 2 + 14} ${headY} ${cx + headSize / 2 + 8} ${headY + 30} Q${cx + headSize / 2 + 4} ${headY + 32} ${cx + headSize / 2} ${headY + 20} Q${cx + headSize / 2 + 2} ${headY} ${cx + headSize / 2 - 5} ${headY - 8}`}
                fill={visuals.hairColor}
                animate={{ rotate: [-3, 3, -3] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{ transformOrigin: `${cx + headSize / 2 - 5}px ${headY - 8}px` }}
              />
              <circle cx={cx + headSize / 2 - 2} cy={headY - 5} r={3} fill={visuals.bodyColor} />
            </g>
          )}
          {visuals.hairStyle === 'flowing' && (
            <g>
              <path d={`M${cx - headSize / 2 - 4} ${headY + 4} Q${cx} ${headY - headSize / 2 - 12} ${cx + headSize / 2 + 4} ${headY + 4}`} fill={visuals.hairColor} />
              <motion.path
                d={`M${cx - headSize / 2 - 2} ${headY + 4} Q${cx - headSize / 2 - 6} ${headY + 20} ${cx - headSize / 2 - 4} ${headY + 36} Q${cx - headSize / 2 - 8} ${headY + 40} ${cx - headSize / 2 + 2} ${headY + 32} L${cx - headSize / 2 + 2} ${headY + 4}`}
                fill={visuals.hairColor}
                animate={{ rotate: [-2, 2, -2] }}
                transition={{ duration: 2.5, repeat: Infinity }}
                style={{ transformOrigin: `${cx - headSize / 2}px ${headY + 4}px` }}
              />
              <motion.path
                d={`M${cx + headSize / 2 + 2} ${headY + 4} Q${cx + headSize / 2 + 6} ${headY + 20} ${cx + headSize / 2 + 4} ${headY + 36} Q${cx + headSize / 2 + 8} ${headY + 40} ${cx + headSize / 2 - 2} ${headY + 32} L${cx + headSize / 2 - 2} ${headY + 4}`}
                fill={visuals.hairColor}
                animate={{ rotate: [2, -2, 2] }}
                transition={{ duration: 2.5, repeat: Infinity }}
                style={{ transformOrigin: `${cx + headSize / 2}px ${headY + 4}px` }}
              />
            </g>
          )}

          {/* Eyebrows */}
          <motion.line
            x1={cx - 14} y1={headY - 5} x2={cx - 6} y2={headY - 7}
            stroke={visuals.hairColor} strokeWidth={visuals.browThickness} strokeLinecap="round"
            animate={activeMood === 'thinking' ? { y1: [headY - 5, headY - 7, headY - 5] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.line
            x1={cx + 6} y1={headY - 7} x2={cx + 14} y2={headY - 5}
            stroke={visuals.hairColor} strokeWidth={visuals.browThickness} strokeLinecap="round"
            animate={activeMood === 'celebrating' ? { y1: [headY - 7, headY - 10, headY - 7] } : {}}
            transition={{ duration: 1.5, repeat: Infinity }}
          />

          {/* Eyes */}
          <g>
            <motion.g animate={anim.eyes} transition={{ duration: anim.duration, repeat: Infinity }}>
              <ellipse
                cx={cx - 10} cy={headY + 2}
                rx={visuals.eyeStyle === 'warm' ? 6.5 : visuals.eyeStyle === 'intense' ? 5.5 : 6}
                ry={(visuals.eyeStyle === 'warm' ? 7 : visuals.eyeStyle === 'intense' ? 6.5 : 6.5) * eyeScaleY}
                fill="white"
              />
              <circle cx={cx - 10 + (activeMood === 'thinking' ? -1.5 : 0)} cy={headY + 2} r={3.5} fill={visuals.eyeColor} />
              <circle cx={cx - 10 + (activeMood === 'thinking' ? -1.5 : 0)} cy={headY + 2} r={2} fill="#000" />
              <circle cx={cx - 9} cy={headY + 0.5} r={1.2} fill="white" />
            </motion.g>
            <motion.g animate={anim.eyes} transition={{ duration: anim.duration, repeat: Infinity }}>
              <ellipse
                cx={cx + 10} cy={headY + 2}
                rx={visuals.eyeStyle === 'warm' ? 6.5 : visuals.eyeStyle === 'intense' ? 5.5 : 6}
                ry={(visuals.eyeStyle === 'warm' ? 7 : visuals.eyeStyle === 'intense' ? 6.5 : 6.5) * eyeScaleY}
                fill="white"
              />
              <circle cx={cx + 10 + (activeMood === 'thinking' ? -1.5 : 0)} cy={headY + 2} r={3.5} fill={visuals.eyeColor} />
              <circle cx={cx + 10 + (activeMood === 'thinking' ? -1.5 : 0)} cy={headY + 2} r={2} fill="#000" />
              <circle cx={cx + 11} cy={headY + 0.5} r={1.2} fill="white" />
            </motion.g>
          </g>

          {/* Glasses */}
          {visuals.accessories === 'glasses' && (
            <g>
              <rect x={cx - 17} y={headY - 3} width={14} height={12} rx={3} fill="none" stroke="#475569" strokeWidth="1.8" />
              <rect x={cx + 3} y={headY - 3} width={14} height={12} rx={3} fill="none" stroke="#475569" strokeWidth="1.8" />
              <line x1={cx - 3} y1={headY + 3} x2={cx + 3} y2={headY + 3} stroke="#475569" strokeWidth="1.5" />
              <line x1={cx - 17} y1={headY + 1} x2={cx - headSize / 2 + 2} y2={headY - 2} stroke="#475569" strokeWidth="1.2" />
              <line x1={cx + 17} y1={headY + 1} x2={cx + headSize / 2 - 2} y2={headY - 2} stroke="#475569" strokeWidth="1.2" />
            </g>
          )}

          {/* Headband */}
          {visuals.accessories === 'headband' && (
            <rect
              x={cx - headSize / 2 + 1} y={headY - 8}
              width={headSize - 2} height={5} rx={2}
              fill={visuals.bodyColor} opacity="0.9"
            />
          )}

          {/* Nose */}
          <path
            d={`M${cx - 1} ${headY + 6} Q${cx} ${headY + 12} ${cx + 1} ${headY + 6}`}
            fill="none" stroke={visuals.skinShadow} strokeWidth="1.2" strokeLinecap="round"
          />

          {/* Mouth — constrained scale so it doesn't fly around */}
          <motion.g
            animate={
              isTalking
                ? { scaleY: [0.85, 1.15, 0.9, 1.1, 0.85], scaleX: [1, 0.95, 1.05, 0.97, 1] }
                : activeMood === 'celebrating' ? { scaleX: [1, 1.1, 1] } : {}
            }
            transition={{ duration: isTalking ? 0.35 : 1, repeat: Infinity }}
            style={{ transformOrigin: `${cx}px ${headY + 16}px` }}
          >
            {mouthOpen ? (
              <ellipse cx={cx} cy={headY + 16} rx={5} ry={3} fill="#c0392b" />
            ) : activeMood === 'celebrating' || activeMood === 'waving' ? (
              <path d={`M${cx - 7} ${headY + 14} Q${cx} ${headY + 22} ${cx + 7} ${headY + 14}`} fill="none" stroke="#c0392b" strokeWidth="2" strokeLinecap="round" />
            ) : (
              <path d={`M${cx - 5} ${headY + 15} Q${cx} ${headY + 18} ${cx + 5} ${headY + 15}`} fill="none" stroke="#c0392b" strokeWidth="1.8" strokeLinecap="round" />
            )}
          </motion.g>

          {/* Cheek blush */}
          {(activeMood === 'celebrating' || activeMood === 'encouraging') && (
            <>
              <circle cx={cx - 18} cy={headY + 8} r={5} fill="#ff6b6b" opacity="0.15" />
              <circle cx={cx + 18} cy={headY + 8} r={5} fill="#ff6b6b" opacity="0.15" />
            </>
          )}

          {/* Ears */}
          <ellipse cx={cx - headSize / 2} cy={headY + 2} rx={4} ry={6} fill={visuals.skinShadow} />
          <ellipse cx={cx + headSize / 2} cy={headY + 2} rx={4} ry={6} fill={visuals.skinShadow} />
        </motion.g>
      </motion.g>
    </svg>
  );
};

// Export for use in Profile coach-selection
export { COACH_VISUALS };

export const Coach3D = ({ coachId = 'alex', mood = 'idle', isTalking = false, energy = 1, moodBubble = '' }) => {
  const visuals = COACH_VISUALS[coachId] || COACH_VISUALS.alex;
  const activeMood = isTalking ? 'talking' : mood;
  const anim = MOOD_ANIMATIONS[activeMood] || MOOD_ANIMATIONS.idle;
  const containerRef = useRef(null);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouse = (e) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      setMouseOffset({
        x: ((e.clientX - centerX) / window.innerWidth) * 10,
        y: ((e.clientY - centerY) / window.innerHeight) * 6,
      });
    };
    window.addEventListener('mousemove', handleMouse);
    return () => window.removeEventListener('mousemove', handleMouse);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative select-none w-full max-w-[200px] mx-auto"
      style={{ aspectRatio: '200 / 270', perspective: '600px' }}
    >
      {/* Glow Platform */}
      <motion.div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full w-[50%] h-[7%]"
        style={{ background: `radial-gradient(ellipse, ${visuals.bodyColor}40, transparent 70%)` }}
        animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      />

      {/* 3D Stage */}
      <motion.div
        className="absolute inset-0"
        style={{
          transformStyle: 'preserve-3d',
          transform: `rotateY(${mouseOffset.x}deg) rotateX(${mouseOffset.y * -0.3}deg)`,
          transition: 'transform 0.15s ease-out',
        }}
      >
        <SpeechBubble text={moodBubble} accentColor={visuals.bodyColor} />
        <ParticleEffect mood={activeMood} accentColor={visuals.bodyColor} />
        <CoachSVG visuals={visuals} activeMood={activeMood} isTalking={isTalking} anim={anim} />
      </motion.div>

      {/* Energy Orbs */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex gap-1.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <motion.div
            key={i}
            className="rounded-full"
            style={{
              width: 5, height: 5,
              backgroundColor: i < energy ? visuals.bodyColor : '#374151',
              boxShadow: i < energy ? `0 0 6px ${visuals.bodyColor}66` : 'none',
            }}
            animate={i < energy ? { scale: [1, 1.4, 1], opacity: [0.8, 1, 0.8] } : {}}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.12 }}
          />
        ))}
      </div>
    </div>
  );
};
