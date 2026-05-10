import React from 'react';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import { Memory } from '../types';
import { cn } from '../lib/utils';

interface MemoryTimelineProps {
  memories: Memory[];
}

export const MemoryTimeline: React.FC<MemoryTimelineProps> = ({ memories }) => {
  const sortedMemories = [...memories].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="relative space-y-24 pb-20">
      {/* Vertical Line */}
      <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-white/10 -translate-x-1/2 hidden md:block" />

      {sortedMemories.map((memory, index) => (
        <MemoryItem 
          key={memory.id} 
          memory={memory} 
          isEven={index % 2 === 0} 
        />
      ))}
    </div>
  );
};

const MemoryItem = ({ memory, isEven }: { memory: Memory; isEven: boolean; key?: React.Key }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-100px" }}
    className={cn(
      "flex flex-col md:flex-row items-center w-full",
      isEven ? "md:flex-row-reverse" : ""
    )}
  >
    <div className="w-full md:w-1/2 px-4 md:px-12 flex justify-center">
      <motion.div 
        whileHover={{ scale: 1.02 }}
        className="w-full max-w-md aspect-[4/3] rounded-[2.5rem] overflow-hidden shadow-2xl shadow-romantic-rose/5 bg-white/5 border border-white/10"
      >
        <img 
          src={memory.imageUrl} 
          alt={memory.title} 
          className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity"
          draggable={false}
        />
      </motion.div>
    </div>

    {/* Center Circle */}
    <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center justify-center w-12 h-12 bg-romantic-bg border border-white/10 rounded-full z-10">
      <div className="w-2 h-2 bg-romantic-rose rounded-full shadow-[0_0_8px_rgba(251,113,113,0.5)]" />
    </div>

    <div className={cn(
      "w-full md:w-1/2 px-4 md:px-12 mt-8 md:mt-0 text-center md:text-left",
      isEven ? "md:text-right" : ""
    )}>
      <span className="text-[10px] uppercase tracking-[0.3em] text-romantic-rose mb-4 block font-bold">
        {format(new Date(memory.date), 'MMMM dd, yyyy')}
      </span>
      <h3 className="text-3xl md:text-4xl font-serif mb-4 leading-tight font-light">{memory.title}</h3>
      <p className="text-white/40 leading-relaxed max-w-sm mx-auto md:mx-0">
        {memory.description}
      </p>
    </div>
  </motion.div>
);
