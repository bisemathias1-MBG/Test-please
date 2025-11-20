
import React, { useState, useRef, useEffect } from 'react';
import { Profile, Message } from '../types';
import { Mic, Play, Pause, ArrowLeft, StopCircle, Volume2 } from 'lucide-react';

interface VoiceChatProps {
    match: Profile;
    onClose: () => void;
}

const VoiceChat: React.FC<VoiceChatProps> = ({ match, onClose }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isRecording, setIsRecording] = useState(false);
    const [playingMsgId, setPlayingMsgId] = useState<string | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);
    
    // Audio playback refs
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = () => {
                    const base64 = (reader.result as string).split(',')[1];
                    sendMessage(base64);
                };
                stream.getTracks().forEach(t => t.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Mic error", err);
            alert("Microphone inaccessible.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const sendMessage = (base64: string) => {
        const newMsg: Message = {
            id: Date.now().toString(),
            senderId: 'me',
            audioBase64: base64,
            timestamp: Date.now(),
            isMe: true
        };
        setMessages(prev => [...prev, newMsg]);

        // Simulate reply
        setTimeout(() => {
            const replyMsg: Message = {
                id: (Date.now() + 1).toString(),
                senderId: match.id,
                audioBase64: undefined, // Simulé
                timestamp: Date.now(),
                isMe: false
            };
            setMessages(prev => [...prev, replyMsg]);
        }, 2500);
    };

    const togglePlay = (msg: Message) => {
        if (playingMsgId === msg.id) {
            audioRef.current?.pause();
            setPlayingMsgId(null);
        } else {
            if (msg.audioBase64) {
                if (audioRef.current) {
                    audioRef.current.src = `data:audio/mp3;base64,${msg.audioBase64}`;
                    audioRef.current.play();
                    setPlayingMsgId(msg.id);
                    audioRef.current.onended = () => setPlayingMsgId(null);
                }
            } else {
                alert("Simulation: Ce message n'a pas de fichier audio réel.");
            }
        }
    };

    return (
        <div className="absolute inset-0 z-50 bg-white flex flex-col animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex items-center gap-4 bg-white/80 backdrop-blur-md sticky top-0 z-10 shadow-sm">
                <button onClick={onClose} className="p-2 -ml-2 hover:bg-gray-50 rounded-full">
                    <ArrowLeft className="w-6 h-6 text-gray-600" />
                </button>
                <div className="relative">
                     <img src={match.imageUrls[0]} className="w-10 h-10 rounded-full object-cover border-2 border-pink-100" />
                     <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                </div>
                <div>
                    <h3 className="font-bold text-gray-900">{match.name}</h3>
                    <p className="text-xs text-pink-500 font-medium flex items-center gap-1">
                        <Volume2 className="w-3 h-3" /> Discussion Vocale
                    </p>
                </div>
            </div>

            {/* Reminder Banner */}
            <div className="bg-pink-50 py-2 text-center border-b border-pink-100">
                <p className="text-[10px] font-bold text-pink-600 uppercase tracking-widest">Zone 100% Vocale - Pas de texte</p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50" ref={scrollRef}>
                <div className="text-center py-4">
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-widest">Aujourd'hui</p>
                </div>
                
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                         <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4 border-4 border-white shadow-sm">
                            <Mic className="w-8 h-8 text-gray-300" />
                         </div>
                         <p className="text-sm font-medium">Lancez la conversation avec un vocal.</p>
                    </div>
                )}

                {messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex items-center gap-2 p-3 rounded-2xl max-w-[80%] shadow-sm transition-all ${
                            msg.isMe 
                            ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-br-none' 
                            : 'bg-white text-gray-800 rounded-bl-none border border-gray-100'
                        }`}>
                            <button 
                                onClick={() => togglePlay(msg)}
                                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 ${
                                    msg.isMe ? 'bg-white/20' : 'bg-pink-100 text-pink-500'
                                }`}
                            >
                                {playingMsgId === msg.id ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                            </button>
                            <div className="flex flex-col min-w-[100px]">
                                <div className="h-6 flex items-center gap-1 opacity-60">
                                    {/* Fake waveform */}
                                    {Array.from({length: 12}).map((_, i) => (
                                        <div key={i} className={`w-1 rounded-full ${msg.isMe ? 'bg-white' : 'bg-gray-400'}`} style={{ height: `${Math.random() * 16 + 4}px`}}></div>
                                    ))}
                                </div>
                                <span className={`text-[10px] font-medium mt-1 ${msg.isMe ? 'text-white/70' : 'text-gray-400'}`}>
                                    {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Input Area - Voice Only */}
            <div className="p-6 bg-white border-t border-gray-100 flex flex-col items-center pb-8">
                <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-lg relative ${
                        isRecording 
                        ? 'bg-red-500 scale-110 shadow-red-200' 
                        : 'bg-gradient-to-r from-pink-500 to-rose-500 hover:scale-105 shadow-pink-200'
                    }`}
                >
                    {isRecording && <div className="absolute inset-0 bg-red-400 rounded-full animate-ping opacity-50"></div>}
                    
                    {isRecording ? (
                        <StopCircle className="w-10 h-10 text-white fill-current relative z-10" />
                    ) : (
                        <Mic className="w-10 h-10 text-white relative z-10" />
                    )}
                </button>
                <p className={`text-xs font-bold mt-4 uppercase tracking-wide ${isRecording ? 'text-red-500 animate-pulse' : 'text-gray-400'}`}>
                    {isRecording ? "Enregistrement..." : "Maintenez pour parler"}
                </p>
            </div>

            <audio ref={audioRef} className="hidden" />
        </div>
    );
};

export default VoiceChat;
