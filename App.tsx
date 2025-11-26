import React, { useState, useRef } from 'react';
import { 
  LayoutDashboard, FileText, MessageSquare, FileBarChart, 
  Zap, Menu, Upload, Loader2, Sparkles, Volume2, GraduationCap, ClipboardList, FileBadge, Download, Pause
} from 'lucide-react';
import { AppView, BusinessProfile, AnalysisReport, ChatMessage } from './types';
import Dashboard from './components/Dashboard';
import VoiceConsultant from './components/VoiceConsultant';
import ImpactSimulator from './components/ImpactSimulator';
import AnalyticalSummary from './components/AnalyticalSummary';
import HbsAnalysis from './components/HbsAnalysis';
import { generateDeepDiagnosis, sendFastChatMessage, generateSpeech, decodeAudioData } from './services/geminiService';

// Simple Markdown Component to render the Action Plan nicely
const SimpleMarkdown = ({ text }: { text: string }) => {
  if (!text) return <p className="text-slate-500 italic">Nenhum plano de ação gerado.</p>;
  
  // Normalize line breaks to handle different LLM output styles
  const normalizedText = text.replace(/\n\s*-\s/g, '\n- '); // Ensure lists have newlines
  const blocks = normalizedText.split(/\n\n+/);
  
  return (
    <div className="space-y-4 text-slate-300 leading-relaxed">
      {blocks.map((block, idx) => {
        const trimmedBlock = block.trim();
        if (!trimmedBlock) return null;

        // Headers (H3/H4)
        if (trimmedBlock.startsWith('###')) {
            return <h4 key={idx} className="text-lg font-bold text-purple-400 mt-6 mb-2">{trimmedBlock.replace(/###\s?/, '')}</h4>
        }
        if (trimmedBlock.startsWith('##')) {
            return <h3 key={idx} className="text-xl font-bold text-slate-900 print:text-black dark:text-white mt-8 mb-4 border-b border-slate-700 pb-2">{trimmedBlock.replace(/##\s?/, '')}</h3>
        }
        
        // Lists (Bullet points) - Improved detection
        if (trimmedBlock.startsWith('- ') || trimmedBlock.startsWith('* ')) {
            const items = trimmedBlock.split('\n').filter(line => line.trim().match(/^[-*]\s/));
            return (
                <ul key={idx} className="list-disc pl-5 space-y-2 mb-4">
                    {items.map((item, i) => {
                        const content = item.replace(/^[-*]\s?/, '');
                        const parts = content.split(/(\*\*.*?\*\*)/g);
                        return (
                            <li key={i} className="text-slate-300 print:text-black">
                                {parts.map((part, pIdx) => {
                                    if (part.startsWith('**') && part.endsWith('**')) {
                                        return <strong key={pIdx} className="text-white print:text-black font-semibold">{part.slice(2, -2)}</strong>;
                                    }
                                    return part;
                                })}
                            </li>
                        );
                    })}
                </ul>
            )
        }
        
        // Regular paragraph with bold support
        return (
            <p key={idx} className="mb-2 text-justify">
                {trimmedBlock.split(/(\*\*.*?\*\*)/g).map((part, pIdx) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                        return <strong key={pIdx} className="text-white print:text-black font-semibold">{part.slice(2, -2)}</strong>;
                    }
                    return part;
                })}
            </p>
        );
      })}
    </div>
  )
}

const App = () => {
  // State
  const [view, setView] = useState<AppView>(AppView.DASHBOARD);
  const [profile, setProfile] = useState<BusinessProfile>({ name: '', sector: '', mission: '', challenges: '' });
  const [files, setFiles] = useState<File[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioSource, setAudioSource] = useState<AudioBufferSourceNode | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);

  // Handlers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const runAnalysis = async () => {
    if (!profile.name && files.length === 0) {
      alert("Por favor, forneça detalhes da empresa ou faça upload de arquivos primeiro.");
      return;
    }
    setIsAnalyzing(true);
    setView(AppView.ANALYSIS);
    
    try {
      // Simulate file reading for the demo
      const fileSummaries = files.map(f => `Arquivo: ${f.name} (Tipo: ${f.type})`);
      const businessContext = JSON.stringify(profile);
      
      const result = await generateDeepDiagnosis(businessContext, fileSummaries);
      setReport(result);
      
      // Auto-switch to Advanced Report view
      setView(AppView.ADVANCED_REPORT);
    } catch (error) {
      console.error("Analysis failed", error);
      alert("A análise falhou. Verifique sua chave de API ou tente novamente.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: chatInput, timestamp: new Date() };
    setChatHistory(prev => [...prev, userMsg]);
    setChatInput('');
    setIsChatting(true);

    try {
      const historyForGemini = chatHistory.map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      }));

      const responseText = await sendFastChatMessage(historyForGemini, userMsg.content);
      
      const botMsg: ChatMessage = { id: (Date.now()+1).toString(), role: 'model', content: responseText, timestamp: new Date() };
      setChatHistory(prev => [...prev, botMsg]);
    } catch (error) {
      console.error(error);
      const errMsg: ChatMessage = { id: (Date.now()+1).toString(), role: 'model', content: "Encontrei um erro ao conectar com o motor de inteligência.", timestamp: new Date() };
      setChatHistory(prev => [...prev, errMsg]);
    } finally {
      setIsChatting(false);
    }
  };

  const playSummary = async () => {
    if (isPlayingAudio) {
        if (audioSource) {
            audioSource.stop();
            setAudioSource(null);
        }
        setIsPlayingAudio(false);
        return;
    }

    if (!report?.diagnosis) return;
    
    try {
        setIsPlayingAudio(true);
        // Get raw PCM data (base64)
        const audioBase64 = await generateSpeech(report.diagnosis.substring(0, 300)); 
        if (audioBase64) {
             if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
             }
             
             const ctx = audioContextRef.current;
             const buffer = await decodeAudioData(audioBase64, ctx);
             
             const source = ctx.createBufferSource();
             source.buffer = buffer;
             source.connect(ctx.destination);
             source.onended = () => {
                 setIsPlayingAudio(false);
                 setAudioSource(null);
             };
             source.start(0);
             setAudioSource(source);
        } else {
            setIsPlayingAudio(false);
        }
    } catch (e) {
        console.error("TTS Failed", e);
        setIsPlayingAudio(false);
    }
  }

  const handleHbsGenerated = (content: string) => {
      if (report) {
          setReport({ ...report, hbsAnalysis: content });
      }
  };

  const handlePrint = () => {
    window.print();
  };

  // Render Helpers
  const renderContent = () => {
    switch(view) {
      case AppView.DASHBOARD:
        return <Dashboard report={report} />;
      case AppView.INPUT:
        return (
          <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-xl">
               <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><Upload className="text-blue-400"/> Entrada de Dados</h2>
               
               <div className="space-y-6">
                 <div>
                   <label className="block text-sm font-medium text-slate-300 mb-2">Nome da Empresa</label>
                   <input 
                     type="text" 
                     className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                     value={profile.name}
                     onChange={e => setProfile({...profile, name: e.target.value})}
                     placeholder="Empresa Exemplo Ltda"
                   />
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Setor</label>
                        <input 
                            type="text" 
                            className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={profile.sector}
                            onChange={e => setProfile({...profile, sector: e.target.value})}
                            placeholder="SaaS, Varejo, Logística..."
                        />
                    </div>
                    <div>
                         <label className="block text-sm font-medium text-slate-300 mb-2">Upload de Documentos</label>
                         <div className="relative border-2 border-dashed border-slate-600 rounded-lg p-8 hover:border-blue-500 transition-colors bg-slate-900/50 text-center cursor-pointer group">
                             <input type="file" multiple className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileUpload} />
                             <Upload className="mx-auto h-8 w-8 text-slate-400 group-hover:text-blue-400 transition-colors mb-2" />
                             <p className="text-sm text-slate-400">{files.length > 0 ? `${files.length} arquivos selecionados` : "Arraste PDF, CSV, XLSX aqui"}</p>
                         </div>
                    </div>
                 </div>

                 <div>
                   <label className="block text-sm font-medium text-slate-300 mb-2">Desafios Principais</label>
                   <textarea 
                     className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 h-24 focus:ring-2 focus:ring-blue-500 outline-none"
                     value={profile.challenges}
                     onChange={e => setProfile({...profile, challenges: e.target.value})}
                     placeholder="Alta rotatividade, crescimento estagnado, ineficiência operacional..."
                   />
                 </div>
                 
                 <button 
                    onClick={runAnalysis}
                    disabled={isAnalyzing}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-bold text-lg shadow-lg hover:shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                 >
                    {isAnalyzing ? <Loader2 className="animate-spin" /> : <Sparkles className="fill-white" />}
                    {isAnalyzing ? "Executando Modelos Preditivos..." : "Rodar Diagnóstico Completo"}
                 </button>
               </div>
            </div>
          </div>
        );
      case AppView.SUMMARY:
        return <AnalyticalSummary report={report} />;
      case AppView.ADVANCED_REPORT:
        if (!report) return <div className="text-center text-slate-400 mt-20">Nenhuma análise gerada ainda. Vá para Inputs.</div>;
        return (
          <div className="space-y-8 max-w-6xl mx-auto animate-in fade-in duration-700" id="printable-area">
             <div className="flex justify-between items-center border-b border-slate-700 pb-4 no-print">
                <h2 className="text-3xl font-bold text-white">Relatório Estratégico Avançado</h2>
                <div className="flex gap-2">
                    <button 
                        onClick={playSummary} 
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition-colors ${isPlayingAudio ? 'bg-red-500/20 text-red-400 border-red-500' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-600'}`}
                    >
                        {isPlayingAudio ? <Pause size={16} /> : <Volume2 size={16} />} 
                        {isPlayingAudio ? "Parar" : "Ouvir Resumo"}
                    </button>
                    <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors text-white">
                        <Download size={16} /> Baixar PDF
                    </button>
                </div>
             </div>
             
             {/* Print only header */}
             <div className="hidden print-only mb-6 border-b border-black pb-4">
               <h1 className="text-2xl font-bold text-black">Relatório Estratégico - Neuravision</h1>
               <p className="text-sm text-gray-600">Empresa: {profile.name} | Data: {new Date().toLocaleDateString()}</p>
             </div>

             <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-8 border border-slate-700 shadow-2xl break-inside-avoid">
                <h3 className="text-blue-400 font-bold mb-4 uppercase tracking-wider text-sm border-b border-slate-700 pb-2">Diagnóstico Profundado</h3>
                <div className="prose prose-lg prose-invert max-w-none text-slate-200 leading-relaxed text-justify print:text-black">
                    {report.diagnosis.split('\n').map((paragraph, idx) => (
                        paragraph.trim() && <p key={idx} className="mb-4">{paragraph}</p>
                    ))}
                </div>
             </div>

             {/* Simulation Impact Section */}
             {report.simulations && report.simulations.length > 0 && (
                 <div className="break-inside-avoid">
                    <ImpactSimulator simulations={report.simulations} />
                 </div>
             )}

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-slate-800/50 rounded-xl p-8 border border-slate-700 break-inside-avoid">
                    <h3 className="text-purple-400 font-bold mb-4 uppercase tracking-wider text-sm border-b border-slate-700 pb-2">Plano de Ação Tático</h3>
                    <div className="text-sm">
                        <SimpleMarkdown text={report.actionPlan} />
                    </div>
                </div>
                <div className="space-y-8">
                    <div className="bg-slate-800/50 rounded-xl p-8 border border-slate-700 break-inside-avoid">
                        <h3 className="text-green-400 font-bold mb-4 uppercase tracking-wider text-sm border-b border-slate-700 pb-2">Visão de Futuro (2 Gerações)</h3>
                        <div className="prose prose-invert max-w-none text-slate-300 text-sm print:text-black">
                             {report.futureOutlook}
                        </div>
                    </div>
                    {/* Reuse Dashboard Component for the charts section inside report */}
                    <div className="min-h-[400px] break-inside-avoid">
                        <Dashboard report={report} />
                    </div>
                </div>
             </div>
          </div>
        );
      case AppView.HBS:
        return <HbsAnalysis report={report} profile={profile} onAnalysisGenerated={handleHbsGenerated} />;
      case AppView.CONSULTANT:
        return <VoiceConsultant systemInstruction={`Você é um conselheiro estratégico para a empresa ${profile.name || 'esta empresa'}. O usuário tem os seguintes desafios: ${profile.challenges}.`} />;
      case AppView.ANALYSIS:
        return (
             <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-6">
                <div className="relative">
                    <div className="w-24 h-24 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Sparkles className="text-purple-400 animate-pulse" />
                    </div>
                </div>
                <h2 className="text-2xl font-bold tracking-tight">ANALISANDO OS DADOS</h2>
                <p className="text-slate-400 max-w-lg font-mono text-sm">
                    (Budget: 32k tokens)...
                </p>
             </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500/30">
      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 border-r border-slate-800 transition-all duration-300 flex flex-col z-20 no-print`}>
        <div className="p-6 flex items-center justify-between">
           {isSidebarOpen && <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">Neuravision</span>}
           <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-1 hover:bg-slate-800 rounded">
             <Menu className="w-5 h-5 text-slate-400" />
           </button>
        </div>

        <nav className="flex-1 px-3 space-y-2 mt-4">
            <SidebarItem icon={<LayoutDashboard />} label="Dashboard" active={view === AppView.DASHBOARD} onClick={() => setView(AppView.DASHBOARD)} expanded={isSidebarOpen} />
            <SidebarItem icon={<FileText />} label="Inputs" active={view === AppView.INPUT} onClick={() => setView(AppView.INPUT)} expanded={isSidebarOpen} />
            
            <div className="pt-4 pb-2 border-t border-slate-800 mt-4">
                <p className={`px-4 text-xs font-semibold text-slate-500 uppercase mb-2 ${!isSidebarOpen && 'hidden'}`}>Interativo</p>
                <SidebarItem icon={<ClipboardList />} label="Resumo Analítico" active={view === AppView.SUMMARY} onClick={() => setView(AppView.SUMMARY)} expanded={isSidebarOpen} />
                <SidebarItem icon={<FileBadge />} label="Relatório Avançado" active={view === AppView.ADVANCED_REPORT} onClick={() => setView(AppView.ADVANCED_REPORT)} expanded={isSidebarOpen} />
                <SidebarItem icon={<GraduationCap />} label="Análise HBS" active={view === AppView.HBS} onClick={() => setView(AppView.HBS)} expanded={isSidebarOpen} />
                <SidebarItem icon={<Zap />} label="Consultor de Voz" active={view === AppView.CONSULTANT} onClick={() => setView(AppView.CONSULTANT)} expanded={isSidebarOpen} />
            </div>
        </nav>
        
        {/* Chat Widget Area in Sidebar */}
        {isSidebarOpen && (
            <div className="p-4 border-t border-slate-800">
                <div className="bg-slate-800 rounded-xl p-3 h-64 flex flex-col">
                    <div className="flex-1 overflow-y-auto space-y-2 mb-2 pr-1 custom-scrollbar">
                        {chatHistory.length === 0 ? (
                            <p className="text-xs text-slate-500 text-center mt-10">Pergunte sobre seu negócio...</p>
                        ) : (
                            chatHistory.map(msg => (
                                <div key={msg.id} className={`text-xs p-2 rounded-lg ${msg.role === 'user' ? 'bg-blue-600 ml-4' : 'bg-slate-700 mr-4'}`}>
                                    {msg.content}
                                </div>
                            ))
                        )}
                    </div>
                    <div className="flex gap-2">
                        <input 
                            className="flex-1 bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-xs outline-none focus:border-blue-500"
                            placeholder="Chat rápido..."
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        />
                        <button disabled={isChatting} onClick={handleSendMessage} className="p-1.5 bg-blue-600 rounded-md hover:bg-blue-500 disabled:opacity-50">
                            {isChatting ? <Loader2 size={12} className="animate-spin"/> : <MessageSquare size={12} />}
                        </button>
                    </div>
                </div>
                 {/* Engineer Credit */}
                 <div className="mt-4 text-center">
                    <p className="text-[10px] text-slate-600">Engenharia de IA: <span className="text-slate-400">Ronnie Girardi</span></p>
                </div>
            </div>
        )}
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative">
         {/* Header */}
         <header className="sticky top-0 z-10 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 px-8 py-4 flex justify-between items-center no-print">
            <h1 className="text-xl font-semibold text-slate-100">
                {view === AppView.DASHBOARD && "Dashboard de Inteligência Empresarial"}
                {view === AppView.INPUT && "Diagnóstico e Entrada"}
                {view === AppView.ANALYSIS && "Processando..."}
                {view === AppView.ADVANCED_REPORT && "Relatório Avançado Imediato"}
                {view === AppView.SUMMARY && "Resumo Analítico Executivo"}
                {view === AppView.HBS && "Estudo de Caso HBS"}
                {view === AppView.CONSULTANT && "Consultor de Bordo ao Vivo"}
            </h1>
            <div className="flex items-center gap-4">
                <span className="text-xs font-mono text-slate-500 bg-slate-900 px-2 py-1 rounded border border-slate-800">v1.3.1-beta - RG</span>
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold">NV</div>
            </div>
         </header>

         <div className="p-8 pb-20">
            {renderContent()}
         </div>
      </main>
    </div>
  );
};

// Sidebar Helper Component
const SidebarItem = ({ icon, label, active, onClick, expanded }: any) => (
    <button 
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 ${active ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'}`}
        title={!expanded ? label : ''}
    >
        {React.cloneElement(icon, { size: 20 })}
        {expanded && <span className="text-sm font-medium">{label}</span>}
        {active && expanded && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 box-shadow-glow"></div>}
    </button>
);

export default App;