import React from 'react';
import { motion } from 'motion/react';
import { LogIn, Heart } from 'lucide-react';
import { signInWithGoogle } from '../lib/firebase';

export const AuthView: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center space-y-12">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="space-y-4"
      >
        <div className="w-20 h-20 rounded-full bg-romantic-rose/10 flex items-center justify-center mx-auto mb-6">
          <Heart className="w-10 h-10 text-romantic-rose fill-romantic-rose/20" />
        </div>
        <h1 className="text-5xl md:text-7xl font-serif font-light">Soul<span className="italic text-romantic-rose">bound</span></h1>
        <p className="text-white/40 tracking-widest uppercase text-[10px] font-bold">Your private LDR sanctuary</p>
      </motion.div>

      <div className="max-w-md bg-white/[0.03] backdrop-blur-md p-10 rounded-[2.5rem] border border-white/10 space-y-8">
        <div className="space-y-2">
          <h2 className="text-2xl font-serif">Enter the Sanctuary</h2>
          <p className="text-white/40 text-sm">Two hearts, one shared digital space. Sign in to reconnect.</p>
        </div>
        
        <button 
          onClick={signInWithGoogle}
          className="w-full py-5 bg-white text-romantic-bg rounded-2xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-white/90 transition-all shadow-xl shadow-white/5"
        >
          <LogIn size={20} />
          Continue with Google
        </button>
      </div>

      <div className="text-[10px] uppercase tracking-[0.3em] text-white/20">
        Secured by End-to-End Soul Encryption
      </div>
    </div>
  );
};
