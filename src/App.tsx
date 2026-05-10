import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, onSnapshot, query, orderBy, getDoc, doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from './lib/firebase';
import { View, Memory, Letter, Couple } from './types';
import { THEMES } from './lib/themes';
import { Countdown } from './components/Countdown';
import { MemoryTimeline } from './components/MemoryTimeline';
import { LetterCard } from './components/LetterCard';
import { TogetherMode } from './components/TogetherMode';
import { AdminPanel } from './components/Admin';
import { WeatherWidget } from './components/WeatherWidget';
import { AuthView } from './components/AuthView';
import { Heart, Calendar, BookHeart, Users, Settings as SettingsIcon, Menu, X, ArrowRight, Share2, Copy, Check } from 'lucide-react';
import { cn } from './lib/utils';
import confetti from 'canvas-confetti';

const getCulturalHint = (city: string) => {
  const hints: Record<string, string> = {
    'Jaipur': 'Land of Royalty & Pink Walls',
    'Uttarakhand': 'Devbhoomi - Land of the Gods',
    'London': 'Mist & Historic Lanes',
    'New York': 'The City That Never Sleeps',
    'Delhi': 'Heart of History & Spice',
    'Paris': 'City of Lights & Love'
  };
  return hints[city] || 'A unique soul from a beautiful land';
};

const getNextAnniversary = (startDate: string) => {
  const start = new Date(startDate);
  const now = new Date();
  const anniversary = new Date(now.getFullYear(), start.getMonth(), start.getDate());
  if (anniversary < now) {
    anniversary.setFullYear(now.getFullYear() + 1);
  }
  return anniversary;
};

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [couple, setCouple] = useState<Couple | null>(null);
  const [activeView, setActiveView] = useState<View>(View.Auth);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [letters, setLetters] = useState<Letter[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState<Letter | null>(null);
  const [copied, setCopied] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const lastStatusRef = useRef<string | null>(null);
  const lastPartner2Ref = useRef<any>(null);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    return auth.onAuthStateChanged(async (u) => {
      setUser(u);
      if (u) {
        // Simple scan for couples - in a real app would be by Uid
        // For this demo, we'll try to retrieve the couple from localStorage if it exists,
        // or the user can enter a code. 
        const savedCode = localStorage.getItem('soulbound_couple_code');
        if (savedCode) {
          joinSanctuary(savedCode);
        }
      } else {
        setActiveView(View.Auth);
      }
    });
  }, []);

  useEffect(() => {
    if (!couple?.id) {
      lastStatusRef.current = null;
      lastPartner2Ref.current = null;
      return;
    }

    setActiveView(View.Home);

    // Initialize refs if they are null
    if (lastStatusRef.current === null) lastStatusRef.current = couple.status;
    if (lastPartner2Ref.current === null) lastPartner2Ref.current = couple.partner2;

    // Listen to the couple document itself for real-time status updates
    const unsubCouple = onSnapshot(doc(db, 'couples', couple.id), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as Couple;
        
        // Notify Partner 1 when Partner 2 joins
        if (!lastPartner2Ref.current && data.partner2) {
           triggerConfetti();
           setNotification(`${data.partner2.name} has entered the sanctuary!`);
        }

        // Notify Partner 2 when they successfully bridge (status change)
        if (lastStatusRef.current === 'pairing' && data.status === 'active') {
          triggerConfetti();
          setNotification("The bridge is complete. Welcome home.");
        }

        lastPartner2Ref.current = data.partner2;
        lastStatusRef.current = data.status;
        setCouple({ id: snap.id, ...data } as Couple);
      } else {
        // If document deleted, reset locally
        setCouple(null);
        localStorage.removeItem('soulbound_couple_code');
      }
    });
    
    const qMemories = query(collection(db, 'couples', couple.id, 'memories'), orderBy('date', 'desc'));
    const unsubMemories = onSnapshot(qMemories, (snap) => {
      setMemories(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Memory)));
    });

    const qLetters = query(collection(db, 'couples', couple.id, 'letters'), orderBy('unlockDate', 'asc'));
    const unsubLetters = onSnapshot(qLetters, (snap) => {
      setLetters(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Letter)));
    });

    return () => {
      unsubCouple();
      unsubMemories();
      unsubLetters();
    };
  }, [couple?.id]);

  const handleFirestoreError = (error: any, operation: string, path: string) => {
    console.error(`Firestore Error [${operation}] at ${path}:`, error);
    const errorInfo = {
      error: error.message || String(error),
      operation,
      path,
      auth: auth.currentUser ? { uid: auth.currentUser.uid, email: auth.currentUser.email } : 'Not Signed In'
    };
    throw new Error(JSON.stringify(errorInfo));
  };

  const createSanctuary = async () => {
    if (!user) return;
    const pairCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newCouple: Couple = {
      id: pairCode,
      partner1: {
        uid: user.uid,
        name: user.displayName || 'Partner 1',
        location: 'My City',
        lat: 0,
        lng: 0,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      startDate: new Date().toISOString(),
      firstMeetingDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
      birthdayPartner2: '2026-05-22',
      status: 'pairing',
      lastActivity: serverTimestamp()
    };
    
    try {
      await setDoc(doc(db, 'couples', pairCode), newCouple);
      setCouple(newCouple);
      localStorage.setItem('soulbound_couple_code', pairCode);
    } catch (err) {
      handleFirestoreError(err, 'create', `couples/${pairCode}`);
    }
  };

  const joinSanctuary = async (code: string) => {
    if (!user || !code) return;
    const cleanCode = code.trim().toUpperCase();
    const docPath = `couples/${cleanCode}`;
    
    try {
      const docRef = doc(db, 'couples', cleanCode);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        alert("This sanctuary code doesn't exist yet. Check with your love for the correct code!");
        return;
      }

      const data = docSnap.data() as Couple;
      
      if (data.status === 'pairing' && data.partner1.uid !== user.uid) {
        const updatedData: Partial<Couple> = {
          partner2: {
            uid: user.uid,
            name: user.displayName || 'Partner 2',
            location: 'Waiting...',
            lat: 0, 
            lng: 0,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
          },
          status: 'active'
        };
        await updateDoc(docRef, updatedData);
        setCouple({ ...data, ...updatedData } as Couple);
        localStorage.setItem('soulbound_couple_code', cleanCode);
        triggerConfetti();
        setNotification(`Sanctuary bridged! You are now connected with ${data.partner1.name}`);
      } 
      else if (data.partner1.uid === user.uid || data.partner2?.uid === user.uid) {
        setCouple(data);
        localStorage.setItem('soulbound_couple_code', cleanCode);
      } else {
        alert("This sanctuary is already full. Two souls are already bound here.");
      }
    } catch (err: any) {
      if (err.code === 'permission-denied' || err.message?.includes('permissions')) {
        alert("Permission denied. We've updated the rules, please try refreshing the page if this persists.");
      } else {
        console.error(err);
        alert("Something went wrong while bridging the connection.");
      }
    }
  };

  const triggerConfetti = () => {
    const count = 200;
    const defaults = { origin: { y: 0.7 }, zIndex: 1000 };

    const fire = (particleRatio: number, opts: any) => {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    };

    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2, { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });
  };

  if (!user) return <AuthView />;

  if (!couple) {
    return (
      <div className="min-h-screen midnight-gradient text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full space-y-12 text-center">
          <div className="space-y-4">
            <h1 className="text-5xl font-serif italic">The Bridge</h1>
            <p className="text-white/40 max-w-xs mx-auto italic">Two souls, separate by miles, bounded by one intentional sanctuary. How shall we begin?</p>
          </div>
          
          <div className="glass-card p-10 space-y-8 bg-white/5 border-white/10">
            <div className="space-y-6">
              <button 
                onClick={createSanctuary}
                className="w-full py-6 bg-romantic-rose text-white rounded-2xl font-bold uppercase tracking-[0.2em] text-[10px] hover-glow transition-all"
              >
                Initiate Our Sanctuary
              </button>
              <div className="flex items-center gap-4 text-white/20">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-[9px] font-bold tracking-widest">OR FIND YOUR LOVE</span>
                <div className="h-px flex-1 bg-white/10" />
              </div>
              <div className="space-y-3">
                <input 
                  type="text" 
                  placeholder="Enter The Soul-Code"
                  className="w-full p-6 rounded-2xl bg-black/40 border border-white/10 outline-none focus:ring-1 focus:ring-romantic-rose text-center uppercase tracking-[0.3em] font-mono text-2xl text-romantic-gold"
                  id="pair-code-input"
                  onKeyDown={e => { if (e.key === 'Enter') joinSanctuary((e.target as HTMLInputElement).value) }}
                />
                <button 
                  onClick={() => joinSanctuary((document.getElementById('pair-code-input') as HTMLInputElement).value)}
                  className="w-full py-6 bg-white/5 text-white/80 border border-white/10 rounded-2xl font-bold uppercase tracking-[0.2em] text-[10px] hover:bg-white/10 transition-all"
                >
                  Join The One You Love
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentTheme = THEMES[couple.themeMood || 'midnight'];
  
  return (
    <div className={cn("min-h-screen bg-gradient-to-br text-romantic-text relative overflow-hidden transition-colors duration-1000", currentTheme.gradient)}>
      {/* Notifications - Top level so it shows on all screens (Pairing or Home) */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] bg-white text-romantic-bg px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-romantic-rose/20"
          >
            <div className="p-2 bg-romantic-rose/10 rounded-full text-romantic-rose">
              <Heart size={16} fill="currentColor" />
            </div>
            <span className="text-sm font-medium tracking-tight whitespace-nowrap">{notification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {couple.status === 'pairing' ? (
        <div className={cn("min-h-screen bg-gradient-to-br flex items-center justify-center p-6 text-center transition-colors duration-1000", currentTheme.gradient)}>
          <div className="max-w-md space-y-8">
             <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }} className="w-32 h-32 border-2 border-dashed border-romantic-rose/30 rounded-full mx-auto flex items-center justify-center">
                <Heart className="text-romantic-rose animate-pulse" size={40} />
             </motion.div>
             <h2 className="text-4xl font-serif italic">Sanctuary Sealed</h2>
             <p className="text-white/40">Share this code with your partner to bridge the gap.</p>
             <div 
               className="p-8 bg-black/40 border border-white/10 rounded-[2.5rem] flex items-center justify-between group cursor-pointer"
               onClick={() => {
                 navigator.clipboard.writeText(couple.id);
                 setCopied(true);
                 setTimeout(() => setCopied(false), 2000);
               }}
             >
                <span className="text-4xl font-mono tracking-[0.2em] font-bold text-romantic-gold">{couple.id}</span>
                <div className="p-3 bg-white/5 rounded-2xl text-white/40 group-hover:text-white transition-colors">
                  {copied ? <Check className="text-green-500" /> : <Copy />}
                </div>
             </div>
             <button onClick={() => {
               setCouple(null);
               localStorage.removeItem('soulbound_couple_code');
             }} className="text-[10px] uppercase tracking-widest text-white/10 font-bold hover:text-white/40">Cancel and Reset</button>
          </div>
        </div>
      ) : (
        <>
          {/* Immersive Background Blobs */}
          <div className={cn("absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none transition-colors duration-1000", currentTheme.blob1)} />
          <div className={cn("absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full blur-[120px] pointer-events-none transition-colors duration-1000", currentTheme.blob2)} />

          {/* Navigation */}
          <nav className="fixed top-0 left-0 right-0 z-50 px-8 h-20 flex justify-between items-center bg-romantic-bg/50 backdrop-blur-xl border-b border-romantic-border">
            <div className="flex items-center gap-4 cursor-pointer" onClick={() => setActiveView(View.Home)}>
              <div className="w-10 h-10 rounded-full border border-romantic-rose flex items-center justify-center text-romantic-rose font-serif text-xl italic">
                {couple.partner1.name[0]}
              </div>
              <div className="h-px w-6 bg-white/20 hidden md:block"></div>
              <div className="w-10 h-10 rounded-full border border-romantic-gold flex items-center justify-center text-romantic-gold font-serif text-xl italic hidden md:flex">
                {couple.partner2?.name[0] || '?'}
              </div>
              <span className="font-serif text-xl font-bold tracking-tight ml-2">Soulbound</span>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex gap-10 items-center text-[10px] uppercase tracking-[0.2em] font-semibold">
              <NavLink active={activeView === View.Home} onClick={() => setActiveView(View.Home)} label="Home" />
              <NavLink active={activeView === View.Timeline} onClick={() => setActiveView(View.Timeline)} label="Timeline" />
              <NavLink active={activeView === View.Letters} onClick={() => setActiveView(View.Letters)} label="Letters" />
              <NavLink active={activeView === View.Together} onClick={() => setActiveView(View.Together)} label="Presence" />
              <button 
                onClick={() => setActiveView(View.Admin)}
                className={cn(
                  "p-2 rounded-full transition-all border border-transparent",
                  activeView === View.Admin ? "border-romantic-rose text-romantic-rose" : "text-white/40 hover:text-white"
                )}
              >
                <SettingsIcon size={18} />
              </button>
            </div>

            {/* Mobile Toggle */}
            <button className="md:hidden text-romantic-rose" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </nav>

          {/* Mobile Menu */}
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="fixed inset-0 z-40 bg-romantic-bg flex flex-col items-center justify-center gap-8 md:hidden p-8"
              >
                <MobileNavLink onClick={() => { setActiveView(View.Home); setIsMenuOpen(false); }} label="Home" />
                <MobileNavLink onClick={() => { setActiveView(View.Timeline); setIsMenuOpen(false); }} label="Timeline" />
                <MobileNavLink onClick={() => { setActiveView(View.Letters); setIsMenuOpen(false); }} label="Letters" />
                <MobileNavLink onClick={() => { setActiveView(View.Together); setIsMenuOpen(false); }} label="Presence" />
                <button onClick={() => { setActiveView(View.Admin); setIsMenuOpen(false); }} className="text-romantic-rose/40 uppercase tracking-widest text-xs font-bold mt-4">Settings</button>
              </motion.div>
            )}
          </AnimatePresence>

          <main className="pt-32 pb-40 px-6 max-w-7xl mx-auto relative z-10">
        <AnimatePresence mode="wait">
          {activeView === View.Home && (
            <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-24">
              <section className="text-center space-y-8">
                <div className="flex flex-col gap-4 items-center">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="px-6 py-2 rounded-full border border-romantic-rose/20 bg-romantic-rose/5 text-[9px] uppercase tracking-[0.4em] text-romantic-rose font-bold"
                  >
                    {couple.relationshipTone || 'Romantic & Deep'}
                  </motion.div>
                  <span className="text-[10px] uppercase tracking-[0.4em] text-romantic-gold font-bold">Bridging {couple.partner1.name} & {couple.partner2?.name}</span>
                  <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-6xl md:text-9xl font-serif leading-[1.1]">
                    Soul<span className="italic text-romantic-rose">bound</span>
                  </motion.h1>
                </div>
                
                <div className="flex flex-col items-center gap-6 mt-6">
                   <div className="flex flex-wrap justify-center gap-4">
                      <HeartStatus 
                        isPartner1={true}
                        status={couple.partner1.heartStatus}
                        name={user.uid === couple.partner1.uid ? 'You' : couple.partner1.name}
                        onUpdate={user.uid === couple.partner1.uid ? async (s) => {
                           await updateDoc(doc(db, 'couples', couple.id), { 'partner1.heartStatus': s });
                        } : undefined}
                      />
                      {couple.partner2 && (
                        <HeartStatus 
                          isPartner1={false}
                          status={couple.partner2.heartStatus}
                          name={user.uid === couple.partner2.uid ? 'You' : couple.partner2.name}
                          onUpdate={user.uid === couple.partner2.uid ? async (s) => {
                             await updateDoc(doc(db, 'couples', couple.id), { 'partner2.heartStatus': s });
                          } : undefined}
                        />
                      )}
                   </div>
                </div>

                <p className="text-white/40 max-w-lg mx-auto md:text-lg font-light leading-relaxed mt-4">
                  Miles may separate our bodies, but our sanctuary remains forever connected.
                </p>

                {/* Relationship Age */}
                <div className="flex flex-col items-center gap-2 pt-4">
                   <span className="text-[9px] uppercase tracking-[0.3em] text-white/20 font-bold">Bonding for</span>
                   <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-serif italic text-romantic-gold">
                        {Math.floor((new Date().getTime() - new Date(couple.startDate).getTime()) / (1000 * 60 * 60 * 24))}
                      </span>
                      <span className="text-xl font-serif text-white/40">Incredible Days</span>
                   </div>
                </div>

                <div className="flex flex-wrap justify-center gap-8 pt-4">
                   <WeatherWidget city={couple.partner1.location} lat={couple.partner1.lat} lng={couple.partner1.lng} />
                   <div className="hidden lg:flex flex-col items-center justify-center px-12 border-x border-white/10">
                      <span className="text-[9px] uppercase font-bold text-white/20 tracking-[0.3em] mb-1">Bridge Of</span>
                      <span className="text-3xl font-serif font-light italic">Sanctuary</span>
                      <span className="text-[9px] uppercase font-bold text-white/20 tracking-[0.3em] mt-1">Live Connection</span>
                   </div>
                   <WeatherWidget city={couple.partner2?.location || 'Sanctuary'} lat={couple.partner2?.lat} lng={couple.partner2?.lng} />
                </div>
              </section>

              <section className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:px-12">
                <div className="glass-card p-10 flex flex-col items-center justify-center space-y-8 relative overflow-hidden bg-gradient-to-br from-white/[0.05] to-transparent hover-glow">
                  <Countdown 
                    targetDate={getNextAnniversary(couple.startDate)} 
                    title="Our Soulbound Anniversary" 
                    onComplete={() => triggerConfetti()}
                  />
                </div>

                <div className="glass-card p-10 flex flex-col items-center justify-center space-y-8 bg-gradient-to-br from-white/[0.02] to-transparent hover-glow border-white/5">
                  <Countdown 
                    targetDate={new Date(couple.birthdayPartner2)} 
                    title="A Celebration of You" 
                  />
                </div>

                <div className="glass-card p-10 flex flex-col items-center justify-center space-y-8 bg-gradient-to-br from-white/[0.02] to-transparent hover-glow border-white/5">
                  <Countdown 
                    targetDate={getNextAnniversary(couple.firstMeetingDate)} 
                    title="First Touch Anniversary" 
                  />
                </div>
              </section>

              {/* Thought of the Day / Daily Whisper */}
              <section className="max-w-2xl mx-auto py-16 text-center space-y-10">
                <div className="w-12 h-px bg-romantic-rose/30 mx-auto" />
                <div className="space-y-4">
                  <span className="text-[10px] uppercase tracking-[0.5em] text-romantic-rose font-bold block">Today's Whisper</span>
                  <p className="text-3xl md:text-4xl font-serif italic text-white/90 leading-snug">
                    {couple.dailyWhisper || "Thinking of you always..."}
                  </p>
                </div>
                
                {/* Cultural Bridge */}
                <div className="glass-card p-8 bg-white/[0.02] border-white/5 max-w-md mx-auto space-y-4">
                   <div className="flex items-center justify-between text-[9px] uppercase tracking-widest font-bold text-white/20">
                      <span>Cultural Bridge</span>
                      <span className="text-romantic-gold">Shared Roots</span>
                   </div>
                   <div className="flex gap-6 items-center justify-center">
                      <div className="text-center space-y-1">
                         <div className="text-xs font-bold">{couple.partner1.location}</div>
                         <div className="text-[10px] text-white/30 italic">{getCulturalHint(couple.partner1.location)}</div>
                      </div>
                      <div className="h-px flex-1 bg-white/10" />
                      <div className="text-center space-y-1">
                         <div className="text-xs font-bold">{couple.partner2?.location}</div>
                         <div className="text-[10px] text-white/30 italic">{getCulturalHint(couple.partner2?.location || '')}</div>
                      </div>
                   </div>
                   <p className="text-[10px] text-white/40 leading-relaxed italic pt-2">
                      Two cultures, one heart. Whether it's the mountains or the deserts, our love bridges every festival and tradition.
                   </p>
                </div>
              </section>
            </motion.div>
          )}

          {activeView === View.Timeline && <MemoryTimeline memories={memories} />}
          {activeView === View.Letters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {letters.map(letter => <LetterCard key={letter.id} letter={letter} onOpen={setSelectedLetter} />)}
            </div>
          )}
          {activeView === View.Together && <TogetherMode couple={couple} userId={user.uid} />}
          {activeView === View.Admin && <AdminPanel onDataChange={() => {}} coupleId={couple.id} />}
        </AnimatePresence>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 h-16 border-t border-white/10 flex items-center justify-between px-8 text-[10px] uppercase tracking-[0.2em] text-white/20 bg-romantic-bg/80 backdrop-blur-md z-40">
        <div className="flex gap-8 hidden sm:flex">
          <span>{couple.partner1.name}: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: couple.partner1.timezone })}</span>
          <span className="opacity-40">|</span>
          <span>{couple.partner2?.name}: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: couple.partner2?.timezone || 'UTC' })}</span>
        </div>
        <div className="flex gap-6 mx-auto sm:mx-0">
          <span className="text-romantic-rose animate-pulse">❤ Sanctuary Live</span>
          <span className="hidden xs:inline">Hub: {couple.id}</span>
        </div>
      </footer>
        </>
      )}

      <AnimatePresence>
        {selectedLetter && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-romantic-dark/40 backdrop-blur-md"
            onClick={() => setSelectedLetter(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white p-8 md:p-12 rounded-[2rem] shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto relative text-romantic-bg"
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setSelectedLetter(null)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-romantic-rose/10 text-romantic-rose"
              >
                <X size={20} />
              </button>
              <div className="space-y-8">
                <div className="text-center">
                  <span className="text-[10px] uppercase tracking-widest text-romantic-rose font-bold">Unsealed Sanctum</span>
                  <h3 className="text-4xl font-serif italic text-romantic-rose mt-2">{selectedLetter.title}</h3>
                </div>
                <div className="h-[1px] w-full bg-romantic-rose/10" />
                <p className="font-serif text-xl leading-relaxed whitespace-pre-wrap italic first-letter:text-5xl first-letter:float-left first-letter:mr-3 first-letter:font-bold first-letter:text-romantic-rose">
                  {selectedLetter.content}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const NavLink = ({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) => (
  <button 
    onClick={onClick}
    className={cn(
      "transition-colors relative py-1",
      active ? "text-white" : "text-white/40 hover:text-white"
    )}
  >
    {label}
    {active && (
      <motion.div 
        layoutId="navUnderline"
        className="absolute bottom-[-4px] left-0 right-0 h-px bg-romantic-rose shadow-[0_0_8px_var(--glow-color)]"
      />
    )}
  </button>
);

const MobileNavLink = ({ onClick, label }: { onClick: () => void; label: string }) => (
  <button onClick={onClick} className="text-3xl font-serif hover:text-romantic-rose transition-colors">
    {label}
  </button>
);

const HeartStatus = ({ isPartner1, status, name, onUpdate }: { isPartner1: boolean; status?: string; name: string; onUpdate?: (s: string) => void }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [val, setVal] = useState(status || '');

  return (
    <div className={cn(
      "flex flex-col items-center gap-2 p-4 rounded-3xl border border-white/5 bg-white/[0.02] min-w-[140px]",
      onUpdate ? "cursor-pointer hover:bg-white/[0.05] transition-colors" : ""
    )} onClick={() => onUpdate && setIsEditing(true)}>
      <div className="flex items-center gap-2">
        <Heart size={14} className={cn(isPartner1 ? "text-romantic-rose" : "text-romantic-gold", status ? "fill-current" : "")} />
        <span className="text-[10px] uppercase tracking-widest font-bold opacity-40">{name}</span>
      </div>
      {isEditing ? (
        <input 
          autoFocus
          className="bg-transparent border-b border-romantic-rose outline-none text-center text-sm w-full"
          value={val}
          onChange={e => setVal(e.target.value)}
          onBlur={() => {
            setIsEditing(false);
            if (val !== status) onUpdate?.(val);
          }}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              setIsEditing(false);
              onUpdate?.(val);
            }
          }}
          placeholder="Status..."
        />
      ) : (
        <span className="text-sm font-light italic truncate max-w-[120px]">
          {status || "Sharing silence..."}
        </span>
      )}
    </div>
  );
};
