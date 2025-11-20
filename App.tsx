
import React, { useState, useEffect } from 'react';
import { Profile, UserProfile } from './types';
import { MOCK_DB_PROFILES } from './data/mockProfiles';
import Card from './components/Card';
import Onboarding from './components/Onboarding';
import VoiceChat from './components/VoiceChat';
import { Heart, Sparkles, Loader2, User, Gem, LogOut, Trash2 } from 'lucide-react';

// Reusable Logo Component
const Logo = ({ size = "normal", className = "" }: { size?: "normal" | "large", className?: string }) => (
  <div className={`flex flex-col items-center select-none ${className}`}>
     <div className="relative flex items-center justify-center">
        {/* Decorative Heart top */}
        <div className={`absolute left-1/2 -translate-x-1/2 z-20 ${size === 'large' ? '-top-7' : '-top-4'}`}>
             <Heart 
                className={`${size === 'large' ? 'w-14 h-14' : 'w-6 h-6'} text-pink-500 fill-pink-100 stroke-[2.5] drop-shadow-md`} 
             />
        </div>
        
        {/* Main Text */}
        <h1 className={`font-['Outfit'] font-black tracking-tighter leading-none text-transparent bg-clip-text bg-gradient-to-br from-pink-500 via-rose-500 to-pink-600 relative z-10 ${
            size === 'large' ? 'text-8xl drop-shadow-xl pb-2' : 'text-3xl drop-shadow-sm pb-1'
        }`} style={{ textShadow: '0px 2px 3px rgba(255,255,255,0.5)' }}>
            BeeB
        </h1>
     </div>
     <span className={`font-['Outfit'] font-bold text-pink-400 uppercase tracking-[0.3em] ${
         size === 'large' ? 'text-lg mt-2' : 'text-[0.5rem] -mt-1'
     }`}>
        Connect & Love
     </span>
  </div>
);

const App: React.FC = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  // Mystery Mode is now enforced, state removed.
  
  // Matches state
  const [matches, setMatches] = useState<Profile[]>([]);
  const [showMatchScreen, setShowMatchScreen] = useState<Profile | null>(null);
  
  // Chat state
  const [chatProfile, setChatProfile] = useState<Profile | null>(null);

  // Load and FILTER data based on user preferences
  useEffect(() => {
    if (userProfile) {
        const targetGenders = userProfile.targetGenders || [];
        const filtered = MOCK_DB_PROFILES.filter(p => 
            targetGenders.includes(p.gender) && 
            p.id !== userProfile.id
        );
        setProfiles(filtered);
    }
  }, [userProfile]);

  const handleLike = (profile: Profile) => {
    // Simulate a match probability
    const isMatch = Math.random() > 0.4; 
    
    if (isMatch) {
        setMatches(prev => [...prev, profile]);
        setShowMatchScreen(profile);
    } else {
        nextProfile();
    }
  };

  const nextProfile = () => {
    setCurrentIndex(prev => prev + 1);
  };

  const handleLogout = () => {
      setUserProfile(null);
      setCurrentIndex(0);
      setMatches([]);
      setChatProfile(null);
  };

  // GDPR: Right to Erasure
  const handleDeleteAccount = () => {
      if (window.confirm("Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible et toutes vos données seront effacées (RGPD).")) {
          handleLogout();
          // In a real app, this would call an API to DELETE /user/:id
          alert("Votre compte et vos données ont été supprimés.");
      }
  };

  const openChat = (profile: Profile) => {
      setChatProfile(profile);
  };

  // ------------------- ONBOARDING GATEWALL -------------------
  // If no user profile or not premium, show Onboarding
  if (!userProfile || !userProfile.isPremium) {
      return (
        <div className="h-screen w-full bg-[#fff0f5]">
            <Onboarding onComplete={(p) => setUserProfile(p)} />
        </div>
      );
  }

  const currentProfile = profiles[currentIndex];

  // ------------------- CHAT SCREEN -------------------
  if (chatProfile) {
      return (
          <div className="h-screen w-full relative bg-gray-50">
              <VoiceChat match={chatProfile} onClose={() => setChatProfile(null)} />
          </div>
      );
  }

  // ------------------- MATCH SCREEN -------------------
  if (showMatchScreen) {
      return (
          <div className="h-screen w-full flex flex-col items-center justify-center p-6 relative overflow-hidden bg-pink-50">
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5" />
             <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-pink-200/50 to-white/50 pointer-events-none"></div>
             
             <div className="z-10 text-center animate-in fade-in zoom-in duration-500 flex flex-col items-center">
                 <div className="mb-12 relative">
                    <div className="absolute inset-0 bg-pink-500 rounded-full blur-3xl opacity-20"></div>
                    <Logo size="large" />
                    <Sparkles className="w-12 h-12 text-yellow-400 absolute -top-4 -right-12 animate-pulse z-20" />
                 </div>

                 <h1 className="text-4xl font-black text-gray-800 italic mb-2 font-serif tracking-tighter">C'est un Match !</h1>
                 <p className="text-gray-500 text-lg mb-10 font-medium tracking-wide">Vos voix se sont trouvées.</p>
                 
                 <div className="flex justify-center items-center gap-4 mb-8">
                    <div className="w-32 h-32 rounded-full border-4 border-white shadow-xl overflow-hidden">
                        <img src={userProfile.imageUrls[0]} className="w-full h-full object-cover" />
                    </div>
                    <Heart className="w-10 h-10 text-pink-500 fill-current animate-pulse" />
                    <div className="w-32 h-32 rounded-full border-4 border-white shadow-xl overflow-hidden">
                        <img src={showMatchScreen.imageUrls[0]} className="w-full h-full object-cover" />
                    </div>
                 </div>

                 <p className="text-gray-700 text-xl mb-12 max-w-xs mx-auto leading-relaxed">
                    Vous pouvez maintenant discuter avec <span className="font-bold text-pink-500">{showMatchScreen.name}</span>.
                 </p>

                 <div className="flex flex-col gap-3 w-full max-w-xs">
                     <button 
                        onClick={() => { 
                            const match = showMatchScreen;
                            setShowMatchScreen(null); 
                            nextProfile(); 
                            openChat(match);
                        }}
                        className="px-8 py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold rounded-full text-lg hover:scale-105 transition-all shadow-lg shadow-pink-200"
                     >
                        Envoyer un vocal
                     </button>
                     <button 
                        onClick={() => { setShowMatchScreen(null); nextProfile(); }}
                        className="px-8 py-4 bg-white text-gray-600 font-bold rounded-full hover:bg-gray-50 transition-colors"
                     >
                        Continuer à swiper
                     </button>
                 </div>
             </div>
          </div>
      )
  }

  // ------------------- MAIN APP -------------------
  return (
    <div className="h-screen w-full flex flex-col overflow-hidden relative bg-[#fff0f5]">
      
      {/* Soft Background Blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-pink-200/40 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-200/40 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-[30%] left-[30%] w-[400px] h-[400px] bg-white rounded-full blur-[80px] pointer-events-none opacity-60"></div>

      {/* Header */}
      <header className="p-4 flex justify-between items-center z-20 relative max-w-md mx-auto w-full md:max-w-2xl lg:max-w-4xl">
        <div className="flex items-center gap-2">
          <Logo />
        </div>

        <div className="flex items-center gap-3">
             {/* Mystery Badge (Static) */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border shadow-sm bg-white border-purple-200 text-purple-600 shadow-purple-100">
                 <Gem className="w-3 h-3 fill-current" />
                 <span className="hidden sm:inline">MODE MYSTÈRE</span>
            </div>

            {/* User Menu / Matches */}
            <div className="w-11 h-11 bg-white rounded-full flex items-center justify-center border border-white shadow-md relative group cursor-pointer hover:shadow-lg transition-all overflow-hidden">
                 {userProfile.imageUrls && userProfile.imageUrls[0] ? (
                     <img src={userProfile.imageUrls[0]} alt="Me" className="w-full h-full object-cover" />
                 ) : (
                    <User className="w-5 h-5 text-gray-600" />
                 )}
                
                {/* Dropdown */}
                <div className="absolute top-full right-0 mt-3 w-72 bg-white/90 backdrop-blur-xl border border-white/50 rounded-3xl p-4 hidden group-hover:block shadow-[0_10px_40px_rgba(0,0,0,0.1)] z-50">
                    <div className="mb-4 pb-4 border-b border-gray-100">
                        <p className="font-black text-gray-800 text-lg">{userProfile.name}</p>
                        <p className="text-xs text-pink-500 font-bold uppercase tracking-wide">Membre à vie</p>
                    </div>

                    <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center justify-between">
                        Mes Matchs 
                        <span className="bg-pink-500 text-white text-[10px] px-2 py-0.5 rounded-full">{matches.length}</span>
                    </h3>
                    <div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar mb-4">
                        {matches.map(m => (
                            <div key={m.id} onClick={() => openChat(m)} className="flex items-center gap-3 p-2 hover:bg-pink-50 rounded-xl cursor-pointer transition-colors group/item">
                                <img src={m.imageUrls[0]} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-gray-800 truncate">{m.name}</p>
                                    <p className="text-[10px] text-pink-400 truncate font-medium">Appuyer pour discuter</p>
                                </div>
                            </div>
                        ))}
                        {matches.length === 0 && (
                            <div className="text-center py-4 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                <p className="text-xs font-medium">Pas encore de matchs</p>
                            </div>
                        )}
                    </div>

                    <button 
                        onClick={handleLogout}
                        className="w-full py-2 flex items-center justify-center gap-2 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-lg transition-colors mb-2"
                    >
                        <LogOut className="w-3 h-3" /> Se déconnecter
                    </button>

                    {/* GDPR Delete */}
                    <button 
                        onClick={handleDeleteAccount}
                        className="w-full py-2 flex items-center justify-center gap-2 text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                    >
                        <Trash2 className="w-3 h-3" /> Supprimer mon compte
                    </button>
                </div>
            </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 relative z-10 w-full">
        {currentProfile ? (
           <div className="w-full h-full flex justify-center items-center max-h-[850px]">
              <Card 
                profile={currentProfile} 
                onLike={handleLike} 
                onPass={nextProfile}
              />
           </div>
        ) : (
           <div className="text-center max-w-md mx-auto p-8 glass-panel rounded-[2.5rem]">
             <div className="bg-pink-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-pink-500" />
             </div>
             <h2 className="text-2xl font-black text-gray-800 mb-2">Vous avez tout vu !</h2>
             <p className="text-gray-500 mb-6 font-medium">
                Il n'y a plus de profils correspondant à vos critères pour le moment.
             </p>
             <button onClick={() => setCurrentIndex(0)} className="px-8 py-3 bg-gray-900 rounded-full text-white font-bold hover:scale-105 transition-transform shadow-lg">Revoir les profils</button>
           </div>
        )}
      </main>

      {/* Footer */}
      <footer className="p-4 text-center z-10 pb-6 hidden md:block">
         <p className="text-xs font-bold text-pink-900/30 uppercase tracking-[0.2em] mb-2">
            Écoutez la voix pour révéler la beauté
         </p>
         <div className="flex justify-center gap-4 text-[10px] text-gray-400">
             <span className="hover:underline cursor-pointer">Mentions Légales</span>
             <span className="hover:underline cursor-pointer">Politique de Confidentialité (RGPD)</span>
             <span className="hover:underline cursor-pointer">CGU</span>
         </div>
      </footer>
    </div>
  );
};

export default App;
