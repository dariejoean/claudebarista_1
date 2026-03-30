
import React, { useState, useEffect, useRef } from 'react';
import { chatWithBarista } from '../services/geminiService';
import { ShotData } from '../types';
import { 
    PaperAirplaneIcon, 
    MicrophoneIcon, 
    SpeakerWaveIcon, 
    SpeakerXMarkIcon,
    UserIcon,
    StopIcon
} from '@heroicons/react/24/solid';

interface BaristaChatProps {
    shots: ShotData[];
}

// Helper for Web Speech API types
declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

export const BaristaChat: React.FC<BaristaChatProps> = ({ shots }) => {
    const [messages, setMessages] = useState<{role: 'user'|'expert', text: string}[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Voice State
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    
    // Settings State (Persisted)
    const [audioEnabled, setAudioEnabled] = useState(false);
    const [voiceGender, setVoiceGender] = useState<'female' | 'male'>('female');

    const recognitionRef = useRef<any>(null);
    const synthRef = useRef<SpeechSynthesis>(window.speechSynthesis);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // --- 1. PERSISTENCE & INIT ---
    useEffect(() => {
        const savedAudio = localStorage.getItem('barista_audio_enabled');
        const savedGender = localStorage.getItem('barista_voice_gender');
        
        if (savedAudio !== null) setAudioEnabled(savedAudio === 'true');
        if (savedGender === 'male' || savedGender === 'female') setVoiceGender(savedGender as 'female' | 'male');

        // Initial Greeting with Last Shot Context
        const initGreeting = async () => {
            if (messages.length === 0) {
                const lastShot = shots.length > 0 ? shots[0] : null;
                if (lastShot) {
                    setLoading(true);
                    try {
                        const response = await chatWithBarista("Salut! Analizează te rog ultima mea extracție și oferă-mi câteva sfaturi.", shots);
                        setMessages([{ role: 'expert', text: response }]);
                        // We can't call speakText directly here because it depends on audioEnabled state which might be stale in this closure
                        // But we can check the savedAudio value
                        if (savedAudio === 'true') {
                            const utterance = new SpeechSynthesisUtterance(response);
                            utterance.lang = 'ro-RO';
                            window.speechSynthesis.speak(utterance);
                        }
                    } catch (err) {
                        console.error("Failed to get initial greeting", err);
                        setMessages([{ role: 'expert', text: "Salut! Sunt barista tău virtual. Cum te pot ajuta astăzi?" }]);
                    } finally {
                        setLoading(false);
                    }
                } else {
                    setMessages([{ role: 'expert', text: "Salut! Sunt barista tău virtual. Cum te pot ajuta astăzi?" }]);
                }
            }
        };

        initGreeting();

        // Cleanup speech on unmount
        return () => {
            if (synthRef.current) synthRef.current.cancel();
        };
    }, []);

    useEffect(() => {
        localStorage.setItem('barista_audio_enabled', String(audioEnabled));
    }, [audioEnabled]);

    useEffect(() => {
        localStorage.setItem('barista_voice_gender', voiceGender);
    }, [voiceGender]);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
        }
    }, [input]);


    // --- 2. TEXT-TO-SPEECH (OUTPUT) ---
    const speakText = (text: string) => {
        if (!audioEnabled || !synthRef.current) return;

        // Cancel previous
        synthRef.current.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ro-RO';

        // Voice Selection Strategy
        const voices = synthRef.current.getVoices();
        
        // Try to find Romanian voices
        const roVoices = voices.filter(v => v.lang.includes('ro'));
        
        let selectedVoice = null;

        if (roVoices.length > 0) {
            if (voiceGender === 'female') {
                // Try to find female keywords or default
                selectedVoice = roVoices.find(v => v.name.includes('Ioana') || v.name.includes('Alina') || v.name.toLowerCase().includes('female')) || roVoices[0];
                // Female: Standard pitch, slightly normal speed
                utterance.pitch = 1.0;
                utterance.rate = 1.0;
            } else {
                // Try to find male keywords
                selectedVoice = roVoices.find(v => v.name.includes('Andrei') || v.name.includes('Emil') || v.name.toLowerCase().includes('male'));
                // If no specific male voice, use the first one but lower the pitch to simulate warmth/strength
                if (!selectedVoice) selectedVoice = roVoices[0];
                
                // Male characteristics simulation: Lower pitch, slightly slower
                utterance.pitch = 0.85; 
                utterance.rate = 0.95;
            }
        }

        if (selectedVoice) utterance.voice = selectedVoice;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        synthRef.current.speak(utterance);
    };

    const stopSpeaking = () => {
        if (synthRef.current) {
            synthRef.current.cancel();
            setIsSpeaking(false);
        }
    };

    // --- 3. SPEECH-TO-TEXT (INPUT) ---
    const toggleListening = () => {
        if (isListening) {
            if (recognitionRef.current) recognitionRef.current.stop();
            setIsListening(false);
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Browserul tău nu suportă recunoașterea vocală.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'ro-RO';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => setIsListening(true);
        
        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setInput(prev => prev + (prev ? ' ' : '') + transcript);
            setIsListening(false);
        };

        recognition.onerror = (event: any) => {
            console.error("Speech error", event);
            setIsListening(false);
        };

        recognition.onend = () => setIsListening(false);

        recognitionRef.current = recognition;
        recognition.start();
    };


    // --- 4. HANDLING ---
    const handleSend = async () => {
        if(!input.trim()) return;
        
        // Stop any current speech
        stopSpeaking();

        const userMsg = input;
        setInput('');
        setMessages(prev => [...prev, {role: 'user', text: userMsg}]);
        setLoading(true);
        
        // Reset textarea height
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
        
        const response = await chatWithBarista(userMsg, shots);
        
        setMessages(prev => [...prev, {role: 'expert', text: response}]);
        setLoading(false);

        // Trigger Voice Response
        speakText(response);
    };

    return (
        <div className="flex flex-col h-full bg-surface-container">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto space-y-3 p-4 no-scrollbar">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center opacity-50 space-y-2">
                        <p className="text-sm font-medium text-on-surface">Salut! Sunt Expertul tău Barista.</p>
                        <p className="text-xs text-on-surface-variant">Discută cu mine despre cafea, rețete sau echipamente.</p>
                        <div className="flex gap-2 mt-4 text-[10px] text-on-surface-variant border border-white/5 p-2 rounded-xl bg-black/10">
                            <span>🎙️ Poți folosi vocea</span>
                            <span>🔊 Pot răspunde vocal</span>
                        </div>
                    </div>
                )}
                {messages.map((m, i) => (
                    <div key={i} className={`p-3 rounded-2xl text-sm max-w-[85%] leading-relaxed shadow-sm whitespace-pre-wrap break-words ${m.role === 'user' ? 'bg-crema-500 text-coffee-900 self-end ml-auto rounded-tr-sm font-medium' : 'bg-surface-container-high text-on-surface self-start mr-auto rounded-tl-sm'}`}>
                        {m.text}
                    </div>
                ))}
                {loading && <div className="text-xs text-on-surface-variant animate-pulse ml-2 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-on-surface-variant rounded-full animate-bounce"></span> Expertul analizează...</div>}
                <div ref={messagesEndRef} />
            </div>

            {/* Controls & Input Area */}
            <div className="shrink-0 bg-surface border-t border-white/5 p-3 space-y-3">
                
                {/* Voice Settings Toolbar */}
                <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-3">
                        {/* Audio Toggle */}
                        <button 
                            onClick={() => {
                                if (isSpeaking) stopSpeaking();
                                setAudioEnabled(!audioEnabled);
                            }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border ${audioEnabled ? 'bg-blue-600/20 text-blue-400 border-blue-500/30' : 'bg-surface-container-high text-on-surface-variant border-white/5'}`}
                        >
                            {audioEnabled ? <SpeakerWaveIcon className="w-3.5 h-3.5" /> : <SpeakerXMarkIcon className="w-3.5 h-3.5" />}
                            {audioEnabled ? 'VOCE ON' : 'VOCE OFF'}
                        </button>

                        {/* Gender Toggle (Only if Audio Enabled) */}
                        {audioEnabled && (
                            <button 
                                onClick={() => setVoiceGender(prev => prev === 'female' ? 'male' : 'female')}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border bg-surface-container-high text-on-surface border-white/5 hover:bg-surface-container-high/80"
                            >
                                <UserIcon className="w-3.5 h-3.5 text-on-surface-variant" />
                                {voiceGender === 'female' ? 'FEMININ (Cald)' : 'MASCULIN (Puternic)'}
                            </button>
                        )}
                    </div>

                    {isSpeaking && (
                        <button onClick={stopSpeaking} className="text-[10px] font-bold text-red-400 flex items-center gap-1 bg-red-900/10 px-2 py-1 rounded-lg border border-red-500/20 animate-pulse">
                            <StopIcon className="w-3 h-3" /> STOP
                        </button>
                    )}
                </div>

                {/* Input Row - USING ITEMS-END to align buttons with bottom of text */}
                <div className="flex gap-2 items-end">
                    {/* Microphone Button */}
                    <button 
                        onClick={toggleListening}
                        className={`w-12 h-12 rounded-2xl flex shrink-0 items-center justify-center transition-all border shadow-md active:scale-95 ${
                            isListening 
                            ? 'bg-red-500 text-white border-red-400 animate-pulse shadow-red-500/20' 
                            : 'bg-surface-container-high text-on-surface-variant border-white/5 hover:text-on-surface hover:bg-surface-container'
                        }`}
                    >
                        <MicrophoneIcon className="w-5 h-5" />
                    </button>

                    {/* Textarea instead of Input for wrapping */}
                    <textarea 
                        ref={textareaRef}
                        value={input} 
                        onChange={e => setInput(e.target.value)} 
                        placeholder={isListening ? "Te ascult..." : "Scrie sau vorbește..."}
                        rows={1}
                        className="flex-1 bg-surface-container-high rounded-2xl px-4 py-3 text-sm text-on-surface outline-none border border-white/5 min-h-[48px] max-h-[120px] placeholder:text-on-surface-variant/40 focus:border-crema-500/50 transition-colors resize-none leading-relaxed scrollbar-thin scrollbar-thumb-white/10"
                        onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                    />
                    
                    {/* Send Button */}
                    <button 
                        onClick={handleSend} 
                        disabled={loading || !input.trim()} 
                        className="w-12 h-12 shrink-0 bg-crema-500 rounded-2xl flex items-center justify-center text-coffee-900 active:scale-95 transition-all shadow-lg hover:brightness-110 disabled:opacity-50 disabled:grayscale"
                    >
                        <PaperAirplaneIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};
