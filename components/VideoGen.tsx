import React, { useState } from 'react';
import { Video, Loader2, Play, Download } from 'lucide-react';
import { generateScenarioVideo } from '../services/geminiService';

const VideoGen: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [loading, setLoading] = useState(false);
  const [videoUri, setVideoUri] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt) return;
    setLoading(true);
    setVideoUri(null);
    try {
      const uri = await generateScenarioVideo(prompt, aspectRatio);
      if (uri) {
          // Add API Key for fetch
          const fetchUrl = `${uri}&key=${process.env.API_KEY}`;
          // Fetch blob for safer local playback if needed, or direct src
          setVideoUri(fetchUrl); 
      }
    } catch (e) {
      console.error(e);
      alert("Falha ao gerar o vídeo. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6">
        <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
                <Video className="w-6 h-6 text-purple-400" />
                Gerador de Cenários Veo
            </h2>
            <p className="text-slate-400 mb-6">
                Visualize tendências de mercado, simule jornadas de clientes ou crie conceitos estratégicos visuais usando Veo 3.
            </p>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Prompt do Cenário</label>
                    <textarea 
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        rows={3}
                        placeholder="Ex: Um dashboard futurista mostrando setas verdes de crescimento em um escritório de tecnologia movimentado..."
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-4">
                     <label className="text-sm font-medium text-slate-300">Formato:</label>
                     <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700">
                        <button 
                            onClick={() => setAspectRatio('16:9')}
                            className={`px-3 py-1.5 rounded-md text-sm transition-colors ${aspectRatio === '16:9' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                            16:9 (Paisagem)
                        </button>
                        <button 
                            onClick={() => setAspectRatio('9:16')}
                            className={`px-3 py-1.5 rounded-md text-sm transition-colors ${aspectRatio === '9:16' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                            9:16 (Retrato)
                        </button>
                     </div>
                </div>

                <button 
                    onClick={handleGenerate}
                    disabled={loading || !prompt}
                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <><Loader2 className="w-5 h-5 animate-spin" /> Gerando Vídeo (Leva aprox. 1 min)...</>
                    ) : (
                        <><Play className="w-5 h-5 fill-current" /> Gerar Cenário</>
                    )}
                </button>
            </div>
        </div>

        {videoUri && (
            <div className="flex-1 bg-black rounded-xl overflow-hidden relative group border border-slate-700 flex items-center justify-center">
                <video 
                    src={videoUri} 
                    controls 
                    autoPlay 
                    loop 
                    className={`max-h-full ${aspectRatio === '16:9' ? 'w-full' : 'h-full w-auto'}`}
                />
                <a 
                    href={videoUri} 
                    download="cenario.mp4"
                    className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/80 rounded-full text-white backdrop-blur opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Baixar Vídeo"
                >
                    <Download className="w-5 h-5" />
                </a>
            </div>
        )}
    </div>
  );
};

export default VideoGen;