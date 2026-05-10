import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { intervalToDuration, type Duration } from 'date-fns';

interface CountdownProps {
  targetDate: Date;
  title: string;
  onComplete?: () => void;
}

export const Countdown: React.FC<CountdownProps> = ({ targetDate, title, onComplete }) => {
  const [timeLeft, setTimeLeft] = useState<Duration | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      if (now >= targetDate) {
        clearInterval(timer);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        onComplete?.();
      } else {
        setTimeLeft(intervalToDuration({ start: now, end: targetDate }));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, onComplete]);

  if (!timeLeft) return null;

  return (
    <div className="flex flex-col items-center">
      <h3 className="text-sm uppercase tracking-widest text-romantic-rose/60 mb-2">{title}</h3>
      <div className="flex gap-4">
        <TimeUnit value={timeLeft.days || 0} label="Days" />
        <TimeUnit value={timeLeft.hours || 0} label="Hours" />
        <TimeUnit value={timeLeft.minutes || 0} label="Mins" />
        <TimeUnit value={timeLeft.seconds || 0} label="Secs" />
      </div>
    </div>
  );
};

const TimeUnit = ({ value, label }: { value: number; label: string }) => (
  <div className="flex flex-col items-center">
    <motion.span 
      key={value}
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="text-4xl md:text-6xl font-serif font-light text-white"
    >
      {value.toString().padStart(2, '0')}
    </motion.span>
    <span className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold mt-1">{label}</span>
  </div>
);
