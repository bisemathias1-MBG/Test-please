
import React, { useState, useEffect } from 'react';
import { Profile } from '../types';
import AudioPlayer from './AudioPlayer';
import { Heart, X, MapPin, Info, Eye, EyeOff } from 'lucide-react';
import { generateProfileAudio } from '../services/geminiService';

interface CardProps {
  profile: Profile;
  onLike: (profile: Profile) => void;
  onPass: () => void;
}

const Card: React.FC<CardProps> = ({ profile, onLike, onPass }) => {
  const [audioData, setAudioData] = useState<string | undefined>(profile.audioBase64);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false); // Always start hidden (Mystery Mode enforced)
  
  // Photo Navigation State
  const [photoIndex, setPhotoIndex] = useState(0);
  const photos = profile.imageUrls && profile.imageUrls.length > 0 ? profile.imageUrls : ['https://via.placeholder.com/400'];

  // Reset state when profile changes
  useEffect(() => {
    setAudioData(profile.audioBase64);
    setIsRevealed(false); // Reset to hidden for new profile
    setIsLoadingAudio(false);
    setPhotoIndex(0);
  }, [profile.id]);

  const handlePlayRequest = async () => {
    if (audioData) return;
    
    setIsLoadingAudio(true);
    // Note: This generates audio for MOCK profiles only. 
    // Real users have their own recorded audioBase64.
    const audio = await generateProfileAudio(profile.bioText, profile.gender);
    if (audio) {
      setAudioData(audio);
    }
    setIsLoadingAudio(false);
  };

  const handleAction = () => {
    if (!isRevealed) {
      // Step 1: REVEAL
      setIsRevealed(true);
    } else {
      // Step 2: LIKE (Match attempt)
      onLike(profile);
    }
  };

  const nextPhoto = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (photoIndex < photos.length - 1) {
          setPhotoIndex(prev => prev + 1);
      }
  };

  const prevPhoto = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (photoIndex > 0) {
          setPhotoIndex(prev => prev - 1);
      }
  };

  // Heavy blur logic: Only blur if not revealed
  const shouldBlur = !isRevealed;

  // Helper to format name and age for display (handles Couples)
  const displayName = profile.secondName ? `${profile.name} & ${profile.secondName}` : profile.name;
  const displayAge = profile.secondAge ? `${profile.age} & ${profile.secondAge}` : `${profile.age}`;

  return (
    <div className="relative w-full h-full max-w-md mx-auto bg-white/40 backdrop-blur-2xl rounded-[2.5rem] overflow-hidden shadow-2xl shadow-pink-500/10 border border-white/60 flex flex-col group">
      
      {/* Image Section */}
      <div className="relative h-[65%] w-full overflow-hidden bg-pink-50 m-2 rounded-[2rem] shadow-inner group-image">
        
        {/* Story Indicators */}
        {photos.length > 1 && (
            <div className="absolute top-4 left-4 right-4 z-30 flex gap-1.5">
                {photos.map((_, idx) => (
                    <div 
                        key={idx} 
                        className={`h-1 rounded-full flex-1 transition-colors shadow-sm ${idx === photoIndex ? 'bg-white' : 'bg-white/30'}`}
                    />
                ))}
            </div>
        )}

        <div className={`absolute inset-0 transition-all duration-700 ease-in-out ${shouldBlur ? 'blur-[60px] scale-110 opacity-80' : 'blur-0 scale-100 opacity-100'}`}>
             <img 
                src={photos[photoIndex]} 
                alt={profile.name} 
                className="w-full h-full object-cover"
             />
        </div>
        
        {/* Tap Zones for Photo Navigation */}
        {!shouldBlur && (
            <>
                <div className="absolute inset-y-0 left-0 w-[30%] z-20 cursor-pointer" onClick={prevPhoto}></div>
                <div className="absolute inset-y-0 right-0 w-[30%] z-20 cursor-pointer" onClick={nextPhoto}></div>
            </>
        )}

        {/* Mystery Mode Badge / Overlay */}
        {shouldBlur && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-white/10 pointer-events-none">
             <div className="bg-white/80 p-6 rounded-full backdrop-blur-md shadow-lg mb-4 animate-pulse">
                 <EyeOff className="w-12 h-12 text-pink-400" />
             </div>
             <p className="text-gray-600 text-lg font-bold tracking-wide text-center px-6 bg-white/80 py-2 rounded-full">
               Écoutez pour découvrir
             </p>
          </div>
        )}

        {/* Info Overlay on Image (Basic info always visible) */}
        <div className="absolute bottom-0 left-0 right-0 p-6 pt-24 bg-gradient-to-t from-white via-white/60 to-transparent z-20 pointer-events-none">
             <div className="flex items-end gap-3 mb-2">
                <h2 className={`font-black text-gray-800 drop-shadow-sm ${displayName.length > 15 ? 'text-2xl' : 'text-4xl'}`}>
                    {shouldBlur ? 'Profil Mystère' : displayName}
                </h2>
                <span className="text-2xl font-bold text-pink-500 mb-1">{displayAge} ans</span>
             </div>
             
             <div className="flex flex-wrap items-center gap-2 text-gray-600 text-sm font-semibold mb-2">
                <div className="flex items-center gap-1 bg-white/80 px-3 py-1 rounded-full shadow-sm border border-pink-100">
                    <MapPin className="w-3.5 h-3.5 text-pink-400" />
                    {profile.location}
                </div>
                <div className="flex items-center gap-1 bg-white/80 px-3 py-1 rounded-full shadow-sm border border-pink-100">
                    <Info className="w-3.5 h-3.5 text-purple-400" />
                    {profile.gender}
                </div>
             </div>
        </div>
      </div>

      {/* Details & Actions Section */}
      <div className="flex-1 flex flex-col justify-between px-6 pb-8 pt-2">
        
        {/* Spacer to keep layout consistent without stats */}
        <div className="h-2"></div>

        {/* Audio Player */}
        <div className="mb-6">
            <AudioPlayer 
                audioBase64={audioData} 
                onPlayRequest={handlePlayRequest}
                isLoading={isLoadingAudio}
                autoPlay={!isRevealed} 
            />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center items-center gap-6">
            <button 
                onClick={onPass}
                className="w-16 h-16 rounded-full bg-white border border-gray-200 text-gray-400 flex items-center justify-center hover:bg-red-50 hover:border-red-200 hover:text-red-500 hover:scale-110 transition-all shadow-md"
            >
                <X className="w-8 h-8" />
            </button>

            <button 
                onClick={handleAction}
                className={`h-20 rounded-full flex items-center justify-center transition-all shadow-xl hover:scale-105 ${
                    !isRevealed 
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white w-auto px-8 gap-3' 
                    : 'bg-gradient-to-r from-pink-500 to-rose-500 text-white w-20'
                }`}
            >
                {!isRevealed ? (
                    <>
                        <Eye className="w-6 h-6 fill-current" />
                        <div className="flex flex-col items-start leading-none">
                            <span className="font-bold uppercase text-sm">Découvrir</span>
                            <span className="text-[10px] opacity-80 font-medium">Ça me plaît</span>
                        </div>
                    </>
                ) : (
                    <Heart className="w-10 h-10 fill-current" />
                )}
            </button>
        </div>
      </div>
    </div>
  );
};

export default Card;
