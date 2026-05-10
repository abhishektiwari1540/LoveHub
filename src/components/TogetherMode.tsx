import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Music, Mic, CheckCircle2, Plus, Play, Trash2 } from 'lucide-react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Couple, BucketItem, VoiceNote } from '../types';
import { ConnectionPulse } from './ConnectionPulse';
import { cn } from '../lib/utils';

interface TogetherModeProps {
  couple: Couple;
  userId: string;
}

export const TogetherMode: React.FC<TogetherModeProps> = ({ couple, userId }) => {
  const [bucketList, setBucketList] = useState<BucketItem[]>([]);
  const [voiceNotes, setVoiceNotes] = useState<VoiceNote[]>([]);
  const [newItem, setNewItem] = useState('');

  useEffect(() => {
    const qBucket = query(collection(db, 'couples', couple.id, 'bucketList'), orderBy('createdAt', 'desc'));
    const unsubBucket = onSnapshot(qBucket, (snap) => {
      setBucketList(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as BucketItem)));
    });

    const qVoice = query(collection(db, 'couples', couple.id, 'voiceNotes'), orderBy('createdAt', 'desc'));
    const unsubVoice = onSnapshot(qVoice, (snap) => {
      setVoiceNotes(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as VoiceNote)));
    });

    return () => {
      unsubBucket();
      unsubVoice();
    };
  }, [couple.id]);

  const addBucketItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.trim()) return;
    await addDoc(collection(db, 'couples', couple.id, 'bucketList'), {
      title: newItem.trim(),
      isCompleted: false,
      createdAt: serverTimestamp()
    });
    setNewItem('');
  };

  const toggleBucketItem = async (id: string, current: boolean) => {
    await updateDoc(doc(db, 'couples', couple.id, 'bucketList', id), {
      isCompleted: !current
    });
  };

  const deleteBucketItem = async (id: string) => {
    await deleteDoc(doc(db, 'couples', couple.id, 'bucketList', id));
  };

  return (
    <div className="space-y-16">
      {/* Interactive Hub */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-8">
           <div className="glass-card p-4 bg-black/40 border-white/5">
              <iframe 
                src={`https://open.spotify.com/embed/playlist/${couple.spotifyPlaylistId || '37i9dQZF1DX7qK8maORHcI'}?utm_source=generator&theme=0`} 
                width="100%" 
                height="352" 
                frameBorder="0" 
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                loading="lazy"
                className="rounded-[2rem]"
              />
           </div>
        </div>
        <ConnectionPulse couple={couple} userId={userId} />
      </section>

      {/* Bucket List & Voice Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Bucket List */}
        <div className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-romantic-gold/10 text-romantic-gold rounded-2xl">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-serif italic">Future Bucket List</h3>
              <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold">Dreams we'll chase together</p>
            </div>
          </div>

          <form onSubmit={addBucketItem} className="flex gap-4">
            <input 
              type="text" 
              placeholder="A new adventure..."
              className="flex-1 bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 outline-none focus:ring-1 focus:ring-romantic-gold transition-all"
              value={newItem}
              onChange={e => setNewItem(e.target.value)}
            />
            <button type="submit" className="p-4 bg-romantic-gold text-romantic-bg rounded-2xl hover-glow">
              <Plus size={24} />
            </button>
          </form>

          <div className="space-y-3">
             <AnimatePresence mode="popLayout">
               {bucketList.map(item => (
                 <motion.div 
                   key={item.id}
                   layout
                   initial={{ opacity: 0, x: -20 }}
                   animate={{ opacity: 1, x: 0 }}
                   exit={{ opacity: 0, x: 20 }}
                   className={cn(
                     "group flex items-center justify-between p-5 rounded-2xl border transition-all",
                     item.isCompleted ? "bg-romantic-gold/5 border-romantic-gold/20 opacity-60" : "bg-white/[0.02] border-white/5"
                   )}
                 >
                   <div className="flex items-center gap-4 cursor-pointer" onClick={() => toggleBucketItem(item.id, item.isCompleted)}>
                      <div className={cn(
                        "w-6 h-6 rounded-full border flex items-center justify-center transition-colors",
                        item.isCompleted ? "bg-romantic-gold border-romantic-gold text-romantic-bg" : "border-white/20"
                      )}>
                        {item.isCompleted && <Heart size={12} fill="currentColor" />}
                      </div>
                      <span className={cn("text-sm", item.isCompleted && "line-through")}>{item.title}</span>
                   </div>
                   <button 
                     onClick={() => deleteBucketItem(item.id)}
                     className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-white/20 hover:text-red-400"
                   >
                     <Trash2 size={16} />
                   </button>
                 </motion.div>
               ))}
             </AnimatePresence>
          </div>
        </div>

        {/* Voice Note Corner */}
        <div className="space-y-8">
           <div className="flex items-center gap-4">
            <div className="p-3 bg-romantic-rose/10 text-romantic-rose rounded-2xl">
              <Mic size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-serif italic">Voice Note Corner</h3>
              <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold">Whispers across the miles</p>
            </div>
          </div>

          <div className="glass-card p-12 bg-white/[0.02] border border-white/5 flex flex-col items-center justify-center text-center space-y-6">
             <div className="w-16 h-16 rounded-full bg-romantic-rose/20 flex items-center justify-center text-romantic-rose animate-pulse">
                <Mic size={32} />
             </div>
             <p className="text-white/40 text-sm italic">"Hearing your voice is the closest I get to home."</p>
             <button className="px-8 py-3 rounded-full border border-romantic-rose/30 text-romantic-rose text-xs uppercase tracking-widest font-bold hover:bg-romantic-rose/5 transition-colors">
                Share a Whisper
             </button>
          </div>

          <div className="space-y-4">
             {voiceNotes.map(note => (
                <div key={note.id} className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className="p-2 bg-white/5 rounded-full text-white/60"><Play size={16} /></div>
                      <div>
                         <div className="text-sm font-medium">{note.title}</div>
                         <div className="text-[10px] text-white/20 uppercase tracking-widest">{note.senderName} • {note.duration}</div>
                      </div>
                   </div>
                </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
};
