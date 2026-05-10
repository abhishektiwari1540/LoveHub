import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, MailOpen, Calendar } from 'lucide-react';
import { format, isAfter } from 'date-fns';
import { Letter } from '../types';
import { cn } from '../lib/utils';

interface LetterCardProps {
  letter: Letter;
  onOpen: (letter: Letter) => void;
}

export const LetterCard: React.FC<LetterCardProps> = ({ letter, onOpen }) => {
  const isAvailable = isAfter(new Date(), new Date(letter.unlockDate));

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className={cn(
        "relative p-8 rounded-[2.5rem] cursor-pointer transition-all duration-500 overflow-hidden",
        isAvailable 
          ? "bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] hover:border-romantic-rose/30" 
          : "bg-black/40 border border-dashed border-white/5 grayscale opacity-50"
      )}
      onClick={() => isAvailable && onOpen(letter)}
    >
      <div className="flex flex-col h-full gap-6">
        <div className="flex justify-between items-center">
          <div className={cn(
            "p-3 rounded-2xl",
            isAvailable ? "bg-romantic-rose/10 text-romantic-rose" : "bg-white/5 text-white/20"
          )}>
            {isAvailable ? <MailOpen size={20} /> : <Lock size={20} />}
          </div>
          <div className="flex items-center gap-1 text-[9px] uppercase tracking-widest font-bold text-white/30">
            <Calendar size={12} className="opacity-50" />
            {format(new Date(letter.unlockDate), 'MMM dd, yyyy')}
          </div>
        </div>
        
        <div>
          <h4 className="font-serif text-2xl font-light mb-2">{letter.title}</h4>
          <p className="text-xs text-white/40 uppercase tracking-tighter leading-relaxed">
            {isAvailable ? "This sanctuary is open for you." : `Locked until ${format(new Date(letter.unlockDate), 'MMMM dd')}`}
          </p>
        </div>

        {!isAvailable && (
          <div className="mt-auto pt-4">
             <div className="h-[2px] w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '30%' }}
                  className="h-full bg-romantic-gold animate-pulse"
                />
             </div>
          </div>
        )}
      </div>
      
      {isAvailable && (
        <motion.div 
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          className="absolute inset-0 bg-romantic-red/5 flex items-center justify-center backdrop-blur-[2px]"
        >
          <span className="text-romantic-red font-medium text-sm">Open Sanctuary</span>
        </motion.div>
      )}
    </motion.div>
  );
};
