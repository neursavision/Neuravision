import React from 'react';
import { AnalysisReport } from '../types';
import { FileBarChart, Target, AlertTriangle, TrendingUp, Quote } from 'lucide-react';

interface AnalyticalSummaryProps {
  report: AnalysisReport | null;
}

const AnalyticalSummary: React.FC<AnalyticalSummaryProps> = ({ report }) => {
  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400">
        <FileBarChart size={48} className="mb-4 opacity-50" />
        <p className="text-lg">Nenhum dado analítico disponível.</p>
        <p className="text-sm">Por favor, execute o diagnóstico na aba "Inputs".</p>
      </div>
    );
  }

  // Extract paragraphs for better rendering
  const diagnosisParagraphs = report.diagnosis.split('\n').filter(p => p.trim().length > 0);
  const mainInsight = diagnosisParagraphs.length > 0 ? diagnosisParagraphs[0] : report.diagnosis;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="bg-slate-800/50 p-8 rounded-2xl border border-slate-700 shadow-2xl">
        <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3 border-b border-slate-700 pb-4">
          <FileBarChart className="text-blue-400 w-8 h-8" />
          Resumo Analítico Executivo Detalhado
        </h2>

        {/* Highlight Section */}
        <div className="bg-slate-900/80 p-6 rounded-xl border border-slate-700/50 mb-8 relative overflow-hidden">
            <Quote className="absolute top-4 right-4 text-slate-800 w-24 h-24 transform rotate-180 opacity-50" />
            <h3 className="text-blue-400 font-bold mb-3 text-sm uppercase tracking-wide relative z-10">Síntese Estratégica</h3>
            <p className="text-xl text-slate-100 leading-relaxed font-serif italic relative z-10">
              "{mainInsight}"
            </p>
        </div>

        {/* Detailed Text Block - Expanded */}
        <div className="prose prose-lg prose-invert max-w-none text-slate-300 leading-relaxed">
           <h3 className="text-slate-200 font-semibold mb-4">Análise Profunda do Cenário</h3>
           {diagnosisParagraphs.slice(1).map((para, idx) => (
               <p key={idx} className="mb-4 text-justify">{para}</p>
           ))}
        </div>
      </div>
      
      {/* Strategic Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-800/80 p-6 rounded-xl border border-slate-700 shadow-lg hover:border-yellow-500/50 transition-colors group">
                <div className="flex items-center gap-3 mb-4 text-yellow-400">
                    <div className="p-2 bg-yellow-900/30 rounded-lg group-hover:bg-yellow-900/50 transition-colors">
                        <Target size={24} />
                    </div>
                    <span className="font-bold text-lg">Foco Estratégico</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                    Priorização de ações de alto impacto identificadas no modelo preditivo para correção de gargalos imediatos.
                </p>
            </div>
            
            <div className="bg-slate-800/80 p-6 rounded-xl border border-slate-700 shadow-lg hover:border-red-500/50 transition-colors group">
                <div className="flex items-center gap-3 mb-4 text-red-400">
                     <div className="p-2 bg-red-900/30 rounded-lg group-hover:bg-red-900/50 transition-colors">
                        <AlertTriangle size={24} />
                    </div>
                    <span className="font-bold text-lg">Risco Crítico</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                    Mitigação de vulnerabilidades operacionais que podem comprometer a escalabilidade nos próximos trimestres.
                </p>
            </div>
            
            <div className="bg-slate-800/80 p-6 rounded-xl border border-slate-700 shadow-lg hover:border-green-500/50 transition-colors group">
                <div className="flex items-center gap-3 mb-4 text-green-400">
                     <div className="p-2 bg-green-900/30 rounded-lg group-hover:bg-green-900/50 transition-colors">
                        <TrendingUp size={24} />
                    </div>
                    <span className="font-bold text-lg">Oportunidade</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                    Alavancagem de vantagens competitivas latentes confirmadas pelas projeções de cenário otimista da IA.
                </p>
            </div>
      </div>
      
      {/* KPI Quick View Row */}
      <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 flex flex-wrap justify-between items-center gap-4">
           <span className="text-sm font-semibold text-slate-500 uppercase">Indicadores Chave Recentes</span>
           <div className="flex gap-8 overflow-x-auto pb-2">
                {report.kpis.map((kpi, idx) => (
                    <div key={idx} className="flex flex-col min-w-[120px]">
                        <span className="text-xs text-slate-400 mb-1">{kpi.name}</span>
                        <span className="text-xl font-bold text-white">{kpi.value}</span>
                        <span className={`text-[10px] ${kpi.status === 'good' ? 'text-green-400' : 'text-red-400'}`}>Target: {kpi.target}</span>
                    </div>
                ))}
           </div>
      </div>
    </div>
  );
};

export default AnalyticalSummary;