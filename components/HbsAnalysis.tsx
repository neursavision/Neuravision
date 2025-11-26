import React, { useState } from 'react';
import { AnalysisReport, BusinessProfile } from '../types';
import { GraduationCap, Loader2, BookOpen } from 'lucide-react';
import { generateHBSAnalysis } from '../services/geminiService';

interface HbsAnalysisProps {
  report: AnalysisReport | null;
  profile: BusinessProfile;
  onAnalysisGenerated: (content: string) => void;
}

const HbsAnalysis: React.FC<HbsAnalysisProps> = ({ report, profile, onAnalysisGenerated }) => {
  const [loading, setLoading] = useState(false);

  if (!report) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-slate-400">
          <GraduationCap size={48} className="mb-4 opacity-50" />
          <p className="text-lg">Diagnóstico base necessário.</p>
          <p className="text-sm">Execute a análise inicial na aba "Inputs" primeiro.</p>
        </div>
    );
  }

  const handleGenerate = async () => {
    setLoading(true);
    try {
        const context = `Empresa: ${profile.name}. Setor: ${profile.sector}. Missão: ${profile.mission}. Desafios: ${profile.challenges}.`;
        const content = await generateHBSAnalysis(context, report.diagnosis);
        onAnalysisGenerated(content);
    } catch (e) {
        console.error(e);
        alert("Erro ao gerar análise HBS. Tente novamente.");
    } finally {
        setLoading(false);
    }
  };

  const content = report.hbsAnalysis;

  // Function to render content safely without markdown code blocks
  const renderContent = (text: string) => {
    const cleanText = text.replace(/^```markdown/i, '').replace(/^```/i, '').replace(/```$/i, '');
    return cleanText;
  };

  return (
    <div className="space-y-6 h-full flex flex-col animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <GraduationCap className="text-purple-400" />
            Análise Método Harvard (HBS)
          </h2>
          {!content && !loading && (
              <button 
                onClick={handleGenerate}
                className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-lg shadow-purple-900/20"
              >
                  <BookOpen size={18} />
                  Gerar Estudo de Caso
              </button>
          )}
      </div>

      {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-800/30 rounded-2xl border border-slate-700 border-dashed">
              <Loader2 className="w-10 h-10 animate-spin text-purple-500 mb-4" />
              <p className="text-lg font-medium text-slate-200">Professor HBS Analisando...</p>
              <p className="text-sm opacity-75 max-w-md text-center mt-2">
                  Aplicando frameworks de estratégia, definindo o problema raiz e avaliando alternativas com rigor acadêmico.
              </p>
          </div>
      ) : content ? (
          <div className="bg-slate-50 p-8 rounded-xl text-slate-900 shadow-xl overflow-y-auto border-l-8 border-purple-900 leading-relaxed custom-scrollbar">
             <div className="flex items-center gap-4 mb-8 border-b border-slate-300 pb-4">
                 <div className="w-16 h-16 bg-purple-900 text-white flex items-center justify-center font-serif font-bold text-2xl rounded shadow-md">HBS</div>
                 <div>
                     <h3 className="text-2xl font-serif font-bold text-slate-900">Estudo de Caso Estratégico</h3>
                     <p className="text-slate-600 font-serif italic">Neuravision Academic Module</p>
                 </div>
             </div>
             <div className="prose prose-slate max-w-none font-serif">
                <div className="whitespace-pre-wrap text-base">
                    {renderContent(content)}
                </div>
             </div>
          </div>
      ) : (
          <div className="flex-1 bg-slate-800/50 rounded-2xl border border-slate-700 flex flex-col items-center justify-center p-8 text-center">
              <p className="text-slate-300 mb-4 max-w-lg">
                  O módulo HBS aplica a metodologia de "Case Study" da Harvard Business School para dissecar os desafios da {profile.name || 'sua empresa'}.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-500 w-full max-w-2xl">
                  <div className="p-4 bg-slate-900 rounded border border-slate-800 shadow-sm">1. Definição do Problema</div>
                  <div className="p-4 bg-slate-900 rounded border border-slate-800 shadow-sm">2. Análise de Alternativas</div>
                  <div className="p-4 bg-slate-900 rounded border border-slate-800 shadow-sm">3. Recomendação Final</div>
              </div>
          </div>
      )}
    </div>
  );
};

export default HbsAnalysis;