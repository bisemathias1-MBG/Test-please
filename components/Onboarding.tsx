
import React, { useState, useRef } from 'react';
import { Gender, UserProfile } from '../types';
import { resolveLocation } from '../services/geminiService';
import { Upload, Mic, Check, ArrowRight, Sparkles, Heart, StopCircle, Trash2, X, Image as ImageIcon, Users, Lock, MapPin, Navigation, Globe, Loader2, ExternalLink, ShieldCheck, CreditCard, Shield } from 'lucide-react';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
}

const STEPS = {
  LANDING: 0,
  PAYMENT: 1, // Skipped in this flow as it's merged with landing for UX
  IDENTITY: 2,
  PHYSICS: 3, // This is now LOCATION/RADIUS
  BIO: 4,
  PHOTO: 5,
};

const LogoSmall = () => (
    <div className="flex flex-col items-center">
       <div className="relative">
          <Heart className="w-6 h-6 text-pink-500 fill-pink-100 absolute -top-3 left-1/2 -translate-x-1/2" />
          <h1 className="font-['Outfit'] font-black text-2xl text-transparent bg-clip-text bg-gradient-to-br from-pink-500 to-rose-500">
              BeeB
          </h1>
       </div>
    </div>
  );

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(STEPS.LANDING);
  
  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  
  // File Upload Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // GDPR State
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Location State
  const [isLocating, setIsLocating] = useState(false);
  const [locationVerified, setLocationVerified] = useState(false);
  const [verifiedMapUrl, setVerifiedMapUrl] = useState<string | undefined>(undefined);

  // Form State
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    name: '',
    age: 25,
    gender: Gender.HOMME,
    targetGenders: [], // Init empty
    location: '',
    searchRadius: 30, // Default 30km
    bioText: 'Vocal Bio', // Placeholder as we only use audio
    imageUrls: [],
    audioBase64: undefined,
    isPremium: false,
    secondName: '',
    secondAge: 25,
    hasAcceptedTerms: false
  });

  const updateForm = (key: keyof UserProfile, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const toggleTargetGender = (gender: Gender) => {
    const currentTargets = formData.targetGenders || [];
    if (currentTargets.includes(gender)) {
        updateForm('targetGenders', currentTargets.filter(g => g !== gender));
    } else {
        updateForm('targetGenders', [...currentTargets, gender]);
    }
  };

  const handlePayment = () => {
    if (!acceptedTerms) return;

    const btn = document.getElementById('pay-btn');
    if(btn) btn.innerText = "Paiement validé...";
    setTimeout(() => {
        updateForm('isPremium', true);
        updateForm('hasAcceptedTerms', true);
        setStep(STEPS.IDENTITY);
    }, 1000);
  };

  // --- Location Logic ---
  const handleGeolocation = () => {
      if (!navigator.geolocation) {
          alert("La géolocalisation n'est pas supportée par votre navigateur.");
          return;
      }

      setIsLocating(true);
      setLocationVerified(false);

      navigator.geolocation.getCurrentPosition(
          async (position) => {
              const { latitude, longitude } = position.coords;
              const result = await resolveLocation("My location", latitude, longitude);
              
              if (result) {
                  updateForm('location', result.address);
                  setVerifiedMapUrl(result.mapUrl);
                  setLocationVerified(true);
              } else {
                  alert("Impossible de résoudre l'adresse précise.");
              }
              setIsLocating(false);
          },
          (error) => {
              console.error(error);
              alert("Erreur de géolocalisation. Veuillez entrer votre ville manuellement.");
              setIsLocating(false);
          }
      );
  };

  const verifyCityInput = async () => {
      if (!formData.location) return;
      
      setIsLocating(true);
      const result = await resolveLocation(formData.location);
      
      if (result) {
          updateForm('location', result.address);
          setVerifiedMapUrl(result.mapUrl);
          setLocationVerified(true);
      }
      setIsLocating(false);
  };

  // --- Audio Recording Logic ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(audioUrl);

        // Convert blob to base64 for the app logic
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
            const base64String = reader.result as string;
            const base64Content = base64String.split(',')[1];
            updateForm('audioBase64', base64Content);
        };
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Impossible d'accéder au micro. Veuillez vérifier vos permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const deleteRecording = () => {
      setRecordedAudioUrl(null);
      updateForm('audioBase64', undefined);
  };

  const toggleRecording = () => {
      if (isRecording) {
          stopRecording();
      } else {
          startRecording();
      }
  };

  // --- Photo Logic ---
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              const result = reader.result as string;
              const currentImages = formData.imageUrls || [];
              if (currentImages.length < 5) {
                   updateForm('imageUrls', [...currentImages, result]);
              }
          };
          reader.readAsDataURL(file);
      }
  };

  const triggerFileInput = () => {
      fileInputRef.current?.click();
  };

  const removePhoto = (index: number) => {
      const currentImages = formData.imageUrls || [];
      const newImages = [...currentImages];
      newImages.splice(index, 1);
      updateForm('imageUrls', newImages);
  };

  const finishOnboarding = () => {
      // Ensure at least one target gender is selected, otherwise default to ALL
      let finalTargetGenders = formData.targetGenders;
      if (!finalTargetGenders || finalTargetGenders.length === 0) {
          finalTargetGenders = Object.values(Gender);
      }

      if (formData.name && formData.imageUrls && formData.imageUrls.length > 0) {
          onComplete({
              ...formData as UserProfile,
              id: 'me',
              targetGenders: finalTargetGenders,
              isPremium: true,
              hasAcceptedTerms: true
          });
      }
  };

  // Validation helper
  const isIdentityValid = () => {
      const basicValid = formData.name && formData.age && (formData.targetGenders?.length || 0) > 0;
      if (formData.gender === Gender.COUPLE) {
          return basicValid && formData.secondName && formData.secondAge;
      }
      return basicValid;
  };

  // ------------------- LANDING & PAYMENT -------------------
  if (step === STEPS.LANDING) {
      return (
        <div className="h-full flex flex-col items-center justify-center p-6 relative overflow-hidden text-center overflow-y-auto">
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>
           
           <div className="mb-6 relative z-10 mt-10">
             <div className="absolute inset-0 bg-pink-500 rounded-full blur-[100px] opacity-20"></div>
             <Heart className="w-20 h-20 text-pink-500 fill-pink-100 mx-auto mb-4 animate-pulse" />
             <h1 className="font-['Outfit'] font-black text-6xl text-transparent bg-clip-text bg-gradient-to-br from-pink-500 via-rose-500 to-purple-600 drop-shadow-lg">
                 BeeB
             </h1>
             <p className="text-xl text-pink-400 font-bold tracking-[0.3em] uppercase mt-2">Connect & Love</p>
           </div>

           <div className="max-w-xs mx-auto space-y-6 relative z-10 pb-10">
              <p className="text-gray-600 font-medium text-lg leading-relaxed">
                  La première application de rencontre 100% vocale et authentique.
              </p>
              
              <div className="bg-white/80 backdrop-blur-xl border border-white p-6 rounded-3xl shadow-xl">
                 <div className="flex items-center justify-center gap-2 mb-2 text-yellow-500 font-bold uppercase text-xs tracking-wider">
                    <Sparkles className="w-4 h-4" />
                    Offre Premium à vie
                 </div>
                 <div className="text-5xl font-black text-gray-800 mb-1">9,99€</div>
                 <div className="text-gray-500 font-bold uppercase text-xs">Paiement unique</div>
                 <hr className="my-4 border-gray-200" />
                 <ul className="text-left text-sm space-y-2 text-gray-600 mb-6">
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Profils vérifiés</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Audio haute qualité</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Respect de la vie privée</li>
                 </ul>

                 {/* RGPD CHECKBOX - MANDATORY BEFORE PAYMENT */}
                 <div className="bg-pink-50 p-3 rounded-xl border border-pink-100 mb-4 text-left">
                    <label className="flex items-start gap-3 cursor-pointer group">
                        <div className="relative flex items-center mt-0.5">
                            <input 
                                type="checkbox" 
                                className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border-2 border-gray-300 bg-white transition-all checked:border-pink-500 checked:bg-pink-500"
                                checked={acceptedTerms}
                                onChange={(e) => setAcceptedTerms(e.target.checked)}
                            />
                            <Check className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                        </div>
                        <div className="text-[10px] text-gray-600 leading-relaxed">
                            <span className="font-bold text-pink-600">Consentement obligatoire :</span> J'accepte les CGU et la Politique de Confidentialité. Je consens au traitement de mes données sensibles (voix, image) pour utiliser le service BeeB.
                        </div>
                    </label>
                 </div>

                 <button 
                    id="pay-btn"
                    onClick={handlePayment}
                    disabled={!acceptedTerms}
                    className={`w-full py-4 font-bold rounded-xl text-lg transition-all ${
                        acceptedTerms 
                        ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-200 hover:shadow-pink-300 cursor-pointer hover:scale-105' 
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                >
                    {acceptedTerms ? "Payer & Accéder" : "Acceptez les conditions"}
                 </button>

                 {/* SECURITY BADGES */}
                 <div className="mt-6 border-t border-gray-100 pt-4 w-full bg-gray-50/50 rounded-xl p-4">
                    <div className="flex justify-center gap-6 mb-3">
                        <div className="flex flex-col items-center gap-1 text-[10px] text-gray-500 font-bold">
                            <div className="bg-white p-2 rounded-full shadow-sm">
                                <Lock className="w-4 h-4 text-green-500" />
                            </div>
                            <span>SSL Sécurisé</span>
                        </div>
                        <div className="flex flex-col items-center gap-1 text-[10px] text-gray-500 font-bold">
                            <div className="bg-white p-2 rounded-full shadow-sm">
                                <ShieldCheck className="w-4 h-4 text-blue-500" />
                            </div>
                            <span>PCI DSS</span>
                        </div>
                         <div className="flex flex-col items-center gap-1 text-[10px] text-gray-500 font-bold">
                            <div className="bg-white p-2 rounded-full shadow-sm">
                                <Shield className="w-4 h-4 text-purple-500" />
                            </div>
                            <span>Anti-Fraude</span>
                        </div>
                    </div>
                    <p className="text-[10px] text-gray-400 text-center leading-relaxed">
                        Utilisation du protocole <strong>Secure Sockets Layer (SSL)</strong> pour le chiffrement, respect de la norme <strong>PCI DSS</strong> et système actif de <strong>prévention des fraudes</strong>.
                    </p>
                 </div>
              </div>
              <p className="text-[10px] text-gray-400 text-center">
                  En continuant, vous confirmez avoir plus de 18 ans. <br/>
                  Droit de rétractation et suppression des données via l'application.
              </p>
           </div>
        </div>
      );
  }

  // ------------------- PROFILE CREATION LAYOUT -------------------
  return (
    <div className="h-full flex flex-col p-6 max-w-md mx-auto w-full relative">
       <header className="flex items-center justify-between mb-8">
          <LogoSmall />
          <div className="flex gap-1">
             {[2, 3, 4, 5].map(s => (
                 <div key={s} className={`h-1.5 w-8 rounded-full transition-colors ${step >= s ? 'bg-pink-500' : 'bg-pink-100'}`} />
             ))}
          </div>
       </header>

       <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar">
          {step === STEPS.IDENTITY && (
             <div className="animate-in slide-in-from-right duration-300">
                <h2 className="text-3xl font-black text-gray-800 mb-2">Qui êtes-vous ?</h2>
                <p className="text-gray-500 mb-8">Dites-nous en plus sur vous.</p>
                
                <div className="space-y-6">
                    {/* Identity Gender */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Je suis</label>
                        <select 
                           value={formData.gender}
                           onChange={(e) => updateForm('gender', e.target.value)}
                           className="w-full p-4 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none font-bold text-lg appearance-none"
                        >
                            {Object.values(Gender).map(g => (
                                <option key={g} value={g}>{g}</option>
                            ))}
                        </select>
                    </div>

                    {/* Basic Info Person 1 */}
                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Prénom</label>
                            <input 
                            type="text" 
                            value={formData.name}
                            onChange={(e) => updateForm('name', e.target.value)}
                            className="w-full p-4 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none font-bold text-lg"
                            placeholder="Votre prénom"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Âge</label>
                            <input 
                            type="number" 
                            value={formData.age}
                            onChange={(e) => updateForm('age', parseInt(e.target.value))}
                            className="w-full p-4 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none font-bold text-lg text-center"
                            />
                        </div>
                    </div>

                    {/* COUPLE SPECIFIC FIELDS */}
                    {formData.gender === Gender.COUPLE && (
                        <div className="bg-pink-50 p-4 rounded-2xl border border-pink-100 space-y-3 animate-in fade-in slide-in-from-top-2">
                            <div className="flex items-center gap-2 text-pink-500 font-bold text-sm uppercase tracking-wide">
                                <Users className="w-4 h-4" />
                                <span>Partenaire</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Prénom (2)</label>
                                    <input 
                                    type="text" 
                                    value={formData.secondName}
                                    onChange={(e) => updateForm('secondName', e.target.value)}
                                    className="w-full p-4 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none font-bold text-lg"
                                    placeholder="Son prénom"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Âge (2)</label>
                                    <input 
                                    type="number" 
                                    value={formData.secondAge}
                                    onChange={(e) => updateForm('secondAge', parseInt(e.target.value))}
                                    className="w-full p-4 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none font-bold text-lg text-center"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Target Genders (Preferences) */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Je veux rencontrer</label>
                        <div className="flex flex-wrap gap-2">
                            {Object.values(Gender).map(g => {
                                const isSelected = formData.targetGenders?.includes(g);
                                return (
                                    <button
                                        key={g}
                                        onClick={() => toggleTargetGender(g)}
                                        className={`px-4 py-2 rounded-full text-sm font-bold border transition-all ${
                                            isSelected 
                                            ? 'bg-pink-500 text-white border-pink-600 shadow-md' 
                                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                        }`}
                                    >
                                        {g}
                                    </button>
                                );
                            })}
                        </div>
                        <p className="text-xs text-gray-400 mt-1 ml-1">Choix multiple possible.</p>
                    </div>
                </div>

                <button 
                    disabled={!isIdentityValid()}
                    onClick={() => setStep(STEPS.PHYSICS)}
                    className="mt-8 w-full py-4 bg-gray-900 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-gray-800 disabled:opacity-50"
                >
                    Suivant <ArrowRight className="w-5 h-5" />
                </button>
             </div>
          )}

          {step === STEPS.PHYSICS && (
             <div className="animate-in slide-in-from-right duration-300">
                <h2 className="text-3xl font-black text-gray-800 mb-2">Zone de recherche</h2>
                <p className="text-gray-500 mb-8">Où cherchez-vous l'âme sœur ?</p>
                
                <div className="space-y-8">
                    {/* City Input with Google Maps Integration */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-pink-500" /> Ville de résidence
                        </label>
                        
                        <div className="flex gap-2 mb-2">
                            <div className="relative flex-1">
                                <input 
                                type="text" 
                                value={formData.location}
                                onChange={(e) => {
                                    updateForm('location', e.target.value);
                                    setLocationVerified(false);
                                }}
                                className={`w-full p-4 bg-white border rounded-xl focus:ring-2 focus:ring-pink-500 outline-none font-bold text-lg ${locationVerified ? 'border-green-400 pr-10' : 'border-gray-200'}`}
                                placeholder="Ex: Paris, Bordeaux..."
                                />
                                {locationVerified && (
                                    <Check className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 w-5 h-5" />
                                )}
                            </div>
                            <button 
                                onClick={verifyCityInput}
                                disabled={isLocating || !formData.location}
                                className="px-4 bg-gray-100 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-200 disabled:opacity-50"
                            >
                                {isLocating ? <Loader2 className="w-5 h-5 animate-spin" /> : "Vérifier"}
                            </button>
                        </div>

                        <button 
                            onClick={handleGeolocation}
                            disabled={isLocating}
                            className="w-full py-3 bg-pink-50 border border-pink-100 text-pink-500 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-pink-100 transition-colors"
                        >
                            {isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                            Me géolocaliser
                        </button>

                        {locationVerified && verifiedMapUrl && (
                            <a 
                                href={verifiedMapUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="block mt-2 text-xs text-center text-blue-500 font-medium hover:underline flex items-center justify-center gap-1"
                            >
                                Voir sur Google Maps <ExternalLink className="w-3 h-3" />
                            </a>
                        )}
                    </div>

                    {/* Radius Slider */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <label className="block text-sm font-bold text-gray-700 mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Navigation className="w-4 h-4 text-pink-500" /> Zone de recherche
                            </div>
                            <span className="text-pink-500 text-lg font-black bg-pink-50 px-3 py-1 rounded-lg">
                                {formData.searchRadius} km
                            </span>
                        </label>
                        
                        <input 
                            type="range" 
                            min="5" 
                            max="200" 
                            step="5"
                            value={formData.searchRadius || 30}
                            onChange={(e) => updateForm('searchRadius', parseInt(e.target.value))}
                            className="w-full h-2 bg-pink-100 rounded-lg appearance-none cursor-pointer accent-pink-500"
                        />
                        <div className="flex justify-between text-xs text-gray-400 font-bold mt-2">
                            <span>5 km</span>
                            <span>200 km+</span>
                        </div>
                    </div>
                </div>

                <button 
                    disabled={!locationVerified && !formData.location} // Allow proceed if typed, but verified is better
                    onClick={() => setStep(STEPS.BIO)}
                    className="mt-8 w-full py-4 bg-gray-900 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-gray-800 disabled:opacity-50"
                >
                    Suivant <ArrowRight className="w-5 h-5" />
                </button>
             </div>
          )}

          {step === STEPS.BIO && (
             <div className="animate-in slide-in-from-right duration-300 h-full flex flex-col">
                <div className="flex-1">
                    <h2 className="text-3xl font-black text-gray-800 mb-2">Votre voix</h2>
                    <p className="text-gray-500 mb-8">Brisez la glace avec un vocal fun, vous êtes là pour le Love !</p>
                    
                    <div className="space-y-6 flex flex-col items-center justify-center min-h-[300px]">
                        
                        {!formData.audioBase64 ? (
                            <div className="flex flex-col items-center gap-6">
                                <button
                                    onClick={toggleRecording}
                                    className={`relative w-40 h-40 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl group ${
                                        isRecording 
                                        ? 'bg-white border-4 border-red-500 shadow-red-200 scale-110' 
                                        : 'bg-gradient-to-br from-pink-500 via-rose-500 to-pink-600 shadow-pink-200 hover:scale-105'
                                    }`}
                                >
                                    {/* Pulse Effect when recording */}
                                    {isRecording && (
                                        <div className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-30"></div>
                                    )}
                                    
                                    <div className="relative z-10 flex flex-col items-center justify-center">
                                        {isRecording ? (
                                            <>
                                                <StopCircle className="w-16 h-16 text-red-500 fill-current" />
                                                <span className="text-xs font-bold text-red-500 mt-2 animate-pulse">STOP</span>
                                            </>
                                        ) : (
                                            <>
                                                <Mic className="w-16 h-16 text-white stroke-[1.5]" />
                                                <div className="absolute -top-2 -right-2 bg-white rounded-full p-2 shadow-md">
                                                     <Heart className="w-6 h-6 text-pink-500 fill-pink-500" />
                                                </div>
                                                <span className="text-xs font-bold text-pink-100 mt-2">ENREGISTRER</span>
                                            </>
                                        )}
                                    </div>
                                </button>
                                <p className={`text-sm font-bold uppercase tracking-widest text-center max-w-[200px] ${isRecording ? 'text-red-500 animate-pulse' : 'text-gray-400'}`}>
                                    {isRecording ? "Enregistrement en cours..." : "Appuyez pour démarrer, réappuyez pour arrêter"}
                                </p>
                            </div>
                        ) : (
                            <div className="w-full bg-white p-6 rounded-3xl shadow-lg border border-pink-100 flex flex-col items-center gap-4 animate-in fade-in zoom-in">
                                <div className="flex items-center gap-3 text-pink-500 font-bold">
                                    <Check className="w-6 h-6" /> Vocal enregistré !
                                </div>
                                
                                {recordedAudioUrl && (
                                    <audio controls src={recordedAudioUrl} className="w-full h-10 accent-pink-500" />
                                )}

                                <button 
                                    onClick={deleteRecording}
                                    className="text-gray-400 hover:text-red-500 text-sm flex items-center gap-2 transition-colors font-medium px-4 py-2 rounded-full hover:bg-red-50"
                                >
                                    <Trash2 className="w-4 h-4" /> Recommencer
                                </button>
                            </div>
                        )}

                    </div>
                </div>

                <button 
                    disabled={!formData.audioBase64}
                    onClick={() => setStep(STEPS.PHOTO)}
                    className="mt-8 w-full py-4 bg-gray-900 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-gray-800 disabled:opacity-50 transition-all"
                >
                    Suivant <ArrowRight className="w-5 h-5" />
                </button>
             </div>
          )}

          {step === STEPS.PHOTO && (
             <div className="animate-in slide-in-from-right duration-300 h-full flex flex-col">
                <h2 className="text-3xl font-black text-gray-800 mb-2">Vos photos</h2>
                <p className="text-gray-500 mb-4">Ajoutez entre 1 et 5 photos. Pas d'URL, importez directement.</p>
                
                <div className="space-y-4 flex-1 overflow-y-auto pr-1 custom-scrollbar">
                   {/* Add Photo Button (File Upload) */}
                   <div className="flex justify-center py-2">
                       <input 
                           type="file" 
                           ref={fileInputRef}
                           className="hidden"
                           accept="image/*"
                           onChange={handleFileSelect}
                       />
                       <button 
                           onClick={triggerFileInput}
                           disabled={(formData.imageUrls?.length || 0) >= 5}
                           className="w-full py-4 border-2 border-dashed border-pink-300 rounded-2xl bg-pink-50 text-pink-500 font-bold flex items-center justify-center gap-2 hover:bg-pink-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                       >
                           <ImageIcon className="w-5 h-5" /> Ajouter une photo depuis la galerie
                       </button>
                   </div>

                   {/* Photo Grid */}
                   <div className="grid grid-cols-2 gap-3">
                       {formData.imageUrls?.map((url, idx) => (
                           <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden group border-2 border-gray-100 bg-gray-50 shadow-sm">
                               <img src={url} alt={`User ${idx}`} className="w-full h-full object-cover" />
                               <button 
                                    onClick={() => removePhoto(idx)}
                                    className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-full hover:bg-red-500 transition-colors backdrop-blur-sm"
                                >
                                    <X className="w-4 h-4" />
                               </button>
                               {idx === 0 && (
                                   <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] font-bold text-center py-1 backdrop-blur-sm">
                                       Principale
                                   </div>
                               )}
                           </div>
                       ))}
                       
                       {/* Empty slots visualizer */}
                       {Array.from({ length: Math.max(0, 5 - (formData.imageUrls?.length || 0)) }).map((_, i) => (
                           <div key={`empty-${i}`} className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center text-gray-300">
                               <ImageOffIcon className="w-6 h-6 mb-1 opacity-50" />
                               <span className="text-xs font-bold">Vide</span>
                           </div>
                       ))}
                   </div>
                </div>

                <button 
                    disabled={!formData.imageUrls || formData.imageUrls.length < 1}
                    onClick={finishOnboarding}
                    className="mt-4 w-full py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-pink-200 hover:shadow-pink-300 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
                >
                    Terminer l'inscription <Heart className="w-5 h-5 fill-current" />
                </button>
             </div>
          )}
       </div>
    </div>
  );
};

// Helper icon
const ImageOffIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="2" y1="2" x2="22" y2="22"></line><path d="M10.41 10.41l-1.35 1.35a1.98 1.98 0 0 0 0 2.83l2.83 2.83a1.98 1.98 0 0 0 2.83 0l1.35-1.35"></path><path d="M12 12l1.35-1.35a1.98 1.98 0 0 1 2.83 0l2.83 2.83a1.98 1.98 0 0 1 0 2.83l-1.35 1.35"></path><path d="M2 12h.01"></path><path d="M22 12h.01"></path></svg>
)

export default Onboarding;
