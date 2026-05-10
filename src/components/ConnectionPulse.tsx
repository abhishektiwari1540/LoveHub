import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Fingerprint } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Couple } from '../types';
import { cn } from '../lib/utils';

interface ConnectionPulseProps {
  couple: Couple;
  userId: string;
}

export const ConnectionPulse: React.FC<ConnectionPulseProps> = ({ couple, userId }) => {
  const isP1 = couple.partner1.uid === userId;
  const partnerTouching = isP1 ? couple.interaction?.p2Touching : couple.interaction?.p1Touching;
  const selfTouching = isP1 ? couple.interaction?.p1Touching : couple.interaction?.p2Touching;
  const bothTouching = couple.interaction?.p1Touching && couple.interaction?.p2Touching;

  const [localTouching, setLocalTouching] = useState(false);

  const updateInteraction = useCallback(async (touching: boolean) => {
    const field = isP1 ? 'interaction.p1Touching' : 'interaction.p2Touching';
    await updateDoc(doc(db, 'couples', couple.id), {
      [field]: touching
    });
  }, [couple.id, isP1]);

  const handleStart = () => {
    setLocalTouching(true);
    updateInteraction(true);
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  };

  const handleEnd = () => {
    setLocalTouching(false);
    updateInteraction(false);
  };

  useEffect(() => {
    if (bothTouching && 'vibrate' in navigator) {
      navigator.vibrate([100, 50, 100, 50, 200]);
    }
  }, [bothTouching]);

  return (
    <div className="flex flex-col items-center justify-center p-8 glass-card bg-white/[0.02] relative overflow-hidden group">
      <AnimatePresence>
        {partnerTouching && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1.2 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 bg-romantic-rose/5 blur-3xl -z-10 animate-pulse"
          />
        )}
        {bothTouching && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.2 }}
            className="absolute inset-0 bg-romantic-gold/20 -z-10"
          />
        )}
      </AnimatePresence>

      <div className="text-center space-y-4 mb-8">
        <h3 className="text-lg font-serif italic text-white/80">Presence Pulse</h3>
        <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold">
          {partnerTouching ? "They are touching the heart..." : "Touch to reach out"}
        </p>
      </div>

      <motion.button
        onMouseDown={handleStart}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleStart}
        onTouchEnd={handleEnd}
        whileTap={{ scale: 0.9 }}
        className={cn(
          "w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 relative",
          localTouching ? "bg-romantic-rose scale-110 shadow-[0_0_50px_rgba(153,27,27,0.5)]" : "bg-white/5 border border-white/10"
        )}
      >
        <AnimatePresence mode="wait">
          {bothTouching ? (
            <motion.div
              key="both"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              <Heart className="text-white fill-white animate-bounce" size={48} />
            </motion.div>
          ) : (
            <motion.div
              key="single"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={cn("transition-colors", localTouching ? "text-white" : "text-white/20")}
            >
              <Fingerprint size={48} />
            </motion.div>
          )}
        </AnimatePresence>

        {bothTouching && (
          <motion.div 
            className="absolute inset-0 rounded-full border-4 border-romantic-gold animate-ping"
            animate={{ scale: [1, 2], opacity: [1, 0] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        )}
      </motion.button>

      {bothTouching && (
        <motion.p 
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mt-8 text-romantic-gold font-serif italic text-xl"
        >
          Souls Synchronized
        </motion.p>
      )}
    </div>
  );
};
