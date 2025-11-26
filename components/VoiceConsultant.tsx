import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { Mic, MicOff, Activity, XCircle } from 'lucide-react';

interface VoiceConsultantProps {
  systemInstruction: string;
}

const VoiceConsultant: React.FC<VoiceConsultantProps> = ({ systemInstruction }) => {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [volume, setVolume] = useState(0);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null); // To store the session promise/object
  const nextStartTimeRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  // Helper: Encode PCM to Base64
  const encodePCM = (bytes: Uint8Array) => {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  // Helper: Decode Base64 to PCM
  const decodePCM = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const startSession = async () => {
    try {
      setStatus('connecting');
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Initialize Audio Contexts
      inputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const connectPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            console.log('Sessão Live Iniciada');
            setStatus('connected');
            setIsActive(true);

            // Setup Input Stream
            if (!inputContextRef.current) return;
            const source = inputContextRef.current.createMediaStreamSource(stream);
            sourceRef.current = source;
            
            // ScriptProcessor for raw PCM access (standard for Live API demo)
            const processor = inputContextRef.current.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;

            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              // Calculate volume for UI
              let sum = 0;
              for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
              setVolume(Math.sqrt(sum / inputData.length));

              // Convert Float32 to Int16
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32768;
              }
              
              const base64Data = encodePCM(new Uint8Array(int16.buffer));
              
              // Send to model
              connectPromise.then((session) => {
                session.sendRealtimeInput({
                  media: {
                    mimeType: 'audio/pcm;rate=16000',
                    data: base64Data
                  }
                });
              });
            };

            source.connect(processor);
            processor.connect(inputContextRef.current.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data) {
              const base64Audio = message.serverContent.modelTurn.parts[0].inlineData.data;
              playAudioChunk(base64Audio);
            }
          },
          onclose: () => {
            setStatus('disconnected');
            setIsActive(false);
          },
          onerror: (e) => {
            console.error(e);
            setStatus('error');
          }
        },
        config: {
            responseModalities: [Modality.AUDIO],
            systemInstruction: systemInstruction + " Fale claramente e de forma profissional como um consultor sênior em Português do Brasil.",
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
            }
        }
      });

      sessionRef.current = connectPromise;

    } catch (error) {
      console.error("Falha ao iniciar sessão live", error);
      setStatus('error');
    }
  };

  const playAudioChunk = async (base64Data: string) => {
    if (!audioContextRef.current) return;
    
    const ctx = audioContextRef.current;
    const rawBytes = decodePCM(base64Data);
    const dataInt16 = new Int16Array(rawBytes.buffer);
    
    const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < dataInt16.length; i++) {
      channelData[i] = dataInt16[i] / 32768.0;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);

    const currentTime = ctx.currentTime;
    // Schedule smoothly
    if (nextStartTimeRef.current < currentTime) {
      nextStartTimeRef.current = currentTime;
    }
    
    source.start(nextStartTimeRef.current);
    nextStartTimeRef.current += buffer.duration;
  };

  const stopSession = async () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    if (processorRef.current) processorRef.current.disconnect();
    if (sourceRef.current) sourceRef.current.disconnect();
    if (inputContextRef.current) inputContextRef.current.close();
    if (audioContextRef.current) audioContextRef.current.close();
    
    // Attempt to close session if SDK exposes it, strictly we just let connections drop/cleanup
    setIsActive(false);
    setStatus('disconnected');
    setVolume(0);
  };

  useEffect(() => {
    return () => {
      stopSession();
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl relative overflow-hidden">
        {/* Background Animation */}
        <div className={`absolute inset-0 bg-blue-500/10 transition-opacity duration-1000 ${isActive ? 'opacity-100' : 'opacity-0'}`} />
        
        <div className="z-10 text-center space-y-6">
            <h2 className="text-2xl font-semibold text-slate-100">Consultoria de Bordo ao Vivo</h2>
            <p className="text-slate-400 max-w-md">
                Tenha uma conversa de voz em tempo real com seu conselheiro IA. Discuta estratégias, peça feedbacks rápidos ou simule negociações.
            </p>

            <div className="relative">
                {/* Pulse Ring */}
                {isActive && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-blue-500/30 rounded-full animate-ping" />
                )}
                
                {/* Status Indicator */}
                <div 
                    className={`w-24 h-24 rounded-full flex items-center justify-center border-4 transition-all duration-300 ${
                        status === 'connected' ? 'border-blue-400 bg-blue-900/50 shadow-[0_0_30px_rgba(96,165,250,0.5)]' : 
                        status === 'connecting' ? 'border-yellow-400 bg-yellow-900/20 animate-pulse' :
                        status === 'error' ? 'border-red-500 bg-red-900/20' :
                        'border-slate-600 bg-slate-800'
                    }`}
                >
                    {status === 'connected' ? (
                        <Activity className="w-10 h-10 text-blue-400" style={{ transform: `scale(${1 + volume * 5})` }} />
                    ) : (
                        <Mic className={`w-10 h-10 ${status === 'disconnected' ? 'text-slate-400' : 'text-slate-100'}`} />
                    )}
                </div>
            </div>

            <div className="flex gap-4 justify-center">
                {!isActive ? (
                    <button 
                        onClick={startSession}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-medium transition-colors"
                    >
                        <Mic className="w-4 h-4" /> Iniciar Sessão
                    </button>
                ) : (
                    <button 
                        onClick={stopSession}
                        className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-full font-medium transition-colors"
                    >
                        <MicOff className="w-4 h-4" /> Encerrar Chamada
                    </button>
                )}
            </div>
            
            {status === 'error' && (
                <p className="text-red-400 text-sm flex items-center gap-2 justify-center">
                    <XCircle className="w-4 h-4" /> Conexão falhou. Verifique permissões.
                </p>
            )}
        </div>
    </div>
  );
};

export default VoiceConsultant;