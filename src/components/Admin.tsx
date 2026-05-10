import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db, auth, signInWithGoogle } from '../lib/firebase';
import { Memory, Letter, Couple } from '../types';
import { Plus, Trash2, Edit2, LogIn, LogOut, Loader2, Save, Palette } from 'lucide-react';
import { cn } from '../lib/utils';
import { THEMES, ThemeMood } from '../lib/themes';

interface AdminProps {
  onDataChange: () => void;
  coupleId: string;
}

export const AdminPanel: React.FC<AdminProps> = ({ onDataChange, coupleId }) => {
  const [activeTab, setActiveTab] = useState<'memories' | 'letters' | 'settings'>('memories');
  
  // Form States
  const [memoryForm, setMemoryForm] = useState({ title: '', description: '', date: '', imageUrl: '' });
  const [letterForm, setLetterForm] = useState({ title: '', content: '', unlockDate: '' });
  const [settingsForm, setSettingsForm] = useState({ 
    partner1Location: '', 
    partner2Location: '',
    spotifyPlaylistId: '',
    firstMeetingDate: '',
    startDate: '',
    relationshipTone: 'Romantic & Deep',
    dailyWhisper: '',
    themeMood: 'midnight' as ThemeMood
  });

  useEffect(() => {
    const loadSettings = async () => {
      const docSnap = await getDoc(doc(db, 'couples', coupleId));
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSettingsForm({
          partner1Location: data.partner1.location || '',
          partner2Location: data.partner2?.location || '',
          spotifyPlaylistId: data.spotifyPlaylistId || '',
          firstMeetingDate: data.firstMeetingDate?.split('T')[0] || '',
          startDate: data.startDate?.split('T')[0] || '',
          relationshipTone: data.relationshipTone || 'Romantic & Deep',
          dailyWhisper: data.dailyWhisper || '',
          themeMood: (data.themeMood as ThemeMood) || 'midnight'
        });
      }
    };
    loadSettings();
  }, [coupleId]);

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'couples', coupleId, 'memories'), {
        ...memoryForm,
        createdAt: serverTimestamp()
      });
      setMemoryForm({ title: '', description: '', date: '', imageUrl: '' });
      onDataChange();
      alert('Memory imprinted!');
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddLetter = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'couples', coupleId, 'letters'), {
        ...letterForm,
        isUnlocked: false,
        createdAt: serverTimestamp()
      });
      setLetterForm({ title: '', content: '', unlockDate: '' });
      onDataChange();
      alert('Letter sealed!');
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Basic geocoding attempt
      const getLatLng = async (cityName: string) => {
        if (!cityName) return null;
        try {
          const res = await globalThis.fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`);
          const data = await res.json();
          if (data.results && data.results[0]) {
            return { lat: data.results[0].latitude, lng: data.results[0].longitude };
          }
        } catch (e) {
          console.error('Geocoding error:', e);
        }
        return null;
      };

      const loc1 = await getLatLng(settingsForm.partner1Location);
      const loc2 = await getLatLng(settingsForm.partner2Location);

      await updateDoc(doc(db, 'couples', coupleId), {
        'partner1.location': settingsForm.partner1Location,
        'partner1.lat': loc1?.lat || 0,
        'partner1.lng': loc1?.lng || 0,
        'partner2.location': settingsForm.partner2Location,
        'partner2.lat': loc2?.lat || 0,
        'partner2.lng': loc2?.lng || 0,
        spotifyPlaylistId: settingsForm.spotifyPlaylistId,
        firstMeetingDate: settingsForm.firstMeetingDate,
        startDate: settingsForm.startDate,
        relationshipTone: settingsForm.relationshipTone,
        dailyWhisper: settingsForm.dailyWhisper,
        themeMood: settingsForm.themeMood
      });
      alert('Sanctuary settings updated. The mood has shifted.');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSanctuary = async () => {
    if (confirm("Are you certain? This will dissolve the sanctuary and erase all shared memories and letters forever. This action cannot be undone.")) {
      try {
        await deleteDoc(doc(db, 'couples', coupleId));
        auth.signOut();
      } catch (err) {
        console.error('Error dissolving sanctuary:', err);
        alert('The souls are bound too tightly. Could not dissolve at this moment.');
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-12 mb-20">
      <div className="flex justify-between items-center mb-12">
        <h2 className="text-4xl font-serif font-light">Sanctuary Curator</h2>
        <div className="flex gap-2 bg-white/5 p-1 rounded-2xl border border-white/10">
          {(['memories', 'letters', 'settings'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                activeTab === tab ? "bg-white text-romantic-bg shadow-lg" : "text-white/30 hover:text-white"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'memories' && (
        <form onSubmit={handleAddMemory} className="space-y-8 glass-card p-10 border-white/5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <InputField label="Memory Title" value={memoryForm.title} onChange={v => setMemoryForm({...memoryForm, title: v})} />
            <InputField label="Date" type="date" value={memoryForm.date} onChange={v => setMemoryForm({...memoryForm, date: v})} />
          </div>
          <InputField label="Image URL (Unsplash/Direct)" value={memoryForm.imageUrl} onChange={v => setMemoryForm({...memoryForm, imageUrl: v})} />
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-white/30 mb-3 font-bold">The Story</label>
            <textarea 
              value={memoryForm.description}
              onChange={e => setMemoryForm({...memoryForm, description: e.target.value})}
              className="w-full p-5 rounded-2xl bg-white/5 border border-white/10 text-white focus:ring-1 focus:ring-romantic-rose/30 outline-none min-h-[140px] transition-all"
              placeholder="Captured in words..."
            />
          </div>
          <button type="submit" className="w-full py-5 bg-romantic-rose text-white rounded-2xl font-bold uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 hover-glow">
            <Plus size={20} />
            Imprint Memory
          </button>
        </form>
      )}

      {activeTab === 'letters' && (
        <form onSubmit={handleAddLetter} className="space-y-8 glass-card p-10 border-white/5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <InputField label="Letter Subject" value={letterForm.title} onChange={v => setLetterForm({...letterForm, title: v})} />
            <InputField label="Unlock Date" type="date" value={letterForm.unlockDate} onChange={v => setLetterForm({...letterForm, unlockDate: v})} />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-white/30 mb-3 font-bold">The Message</label>
            <textarea 
              value={letterForm.content}
              onChange={e => setLetterForm({...letterForm, content: e.target.value})}
              className="w-full p-5 rounded-2xl bg-white/5 border border-white/10 text-white focus:ring-1 focus:ring-romantic-rose/30 outline-none min-h-[400px] font-serif italic text-lg transition-all"
              placeholder="Write from the heart..."
            />
          </div>
          <button type="submit" className="w-full py-5 bg-romantic-rose text-white rounded-2xl font-bold uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 hover-glow">
            <Save size={20} />
            Seal Letter
          </button>
        </form>
      )}

      {activeTab === 'settings' && (
        <form onSubmit={handleUpdateSettings} className="space-y-8 glass-card p-10 border-white/5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <InputField label="Partner 1 Location (City)" value={settingsForm.partner1Location} onChange={v => setSettingsForm({...settingsForm, partner1Location: v})} />
             <InputField label="Partner 2 Location (City)" value={settingsForm.partner2Location} onChange={v => setSettingsForm({...settingsForm, partner2Location: v})} />
             <InputField label="Meeting Date" type="date" value={settingsForm.firstMeetingDate} onChange={v => setSettingsForm({...settingsForm, firstMeetingDate: v})} />
             <InputField label="Soulbound Date" type="date" value={settingsForm.startDate} onChange={v => setSettingsForm({...settingsForm, startDate: v})} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <InputField label="Relationship Tone" value={settingsForm.relationshipTone} onChange={v => setSettingsForm({...settingsForm, relationshipTone: v})} />
             <InputField label="Spotify Playlist ID" value={settingsForm.spotifyPlaylistId} onChange={v => setSettingsForm({...settingsForm, spotifyPlaylistId: v})} />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-white/30 mb-3 font-bold">Today's Whisper</label>
            <textarea 
              value={settingsForm.dailyWhisper}
              onChange={e => setSettingsForm({...settingsForm, dailyWhisper: e.target.value})}
              className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white focus:ring-1 focus:ring-romantic-rose/30 outline-none min-h-[100px]"
              placeholder="What do you want to say today?"
            />
          </div>
          
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-white/30 mb-3 font-bold flex items-center gap-2">
              <Palette size={12} />
              Sanctuary Mood (Theme)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {(Object.values(THEMES)).map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => setSettingsForm({ ...settingsForm, themeMood: theme.id })}
                  className={cn(
                    "p-4 rounded-2xl border transition-all text-center flex flex-col items-center gap-2",
                    settingsForm.themeMood === theme.id 
                      ? "border-white bg-white/10" 
                      : "border-white/5 bg-black/20 hover:border-white/20"
                  )}
                >
                  <div className={cn("w-6 h-6 rounded-full bg-gradient-to-br border border-white/10", theme.gradient)} />
                  <span className="text-[9px] uppercase tracking-tighter font-bold">{theme.name}</span>
                </button>
              ))}
            </div>
          </div>
          
          <button type="submit" className="w-full py-5 bg-romantic-rose text-white rounded-2xl font-bold uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 hover-glow">
            <Save size={20} />
            Sync Sanctuary Settings
          </button>

          <div className="pt-12 border-t border-white/5">
            <div className="bg-red-500/5 border border-red-500/20 p-8 rounded-[2rem] space-y-4">
              <h4 className="text-red-400 text-xs font-bold uppercase tracking-widest">Dissolve Sanctuary</h4>
              <p className="text-white/30 text-[10px] leading-relaxed uppercase tracking-tighter">
                Dissolving the sanctuary will disconnect both partners and permanently delete all shared data.
              </p>
              <button 
                type="button" 
                onClick={handleDeleteSanctuary}
                className="w-full py-4 bg-transparent border border-red-500/30 text-red-400 rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-red-500 hover:text-white transition-all"
              >
                Permanently Dissolve Bridge
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="mt-12 flex justify-center">
        <button onClick={() => auth.signOut()} className="text-[10px] uppercase tracking-[0.2em] text-white/20 hover:text-romantic-rose font-bold">Depart Sanctuary</button>
      </div>
    </div>
  );
};

const InputField = ({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) => (
  <div>
    <label className="block text-[10px] uppercase tracking-[0.2em] text-white/30 mb-3 font-bold">{label}</label>
    <input 
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white focus:ring-1 focus:ring-romantic-rose/30 outline-none transition-all"
      required
    />
  </div>
);
