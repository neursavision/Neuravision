import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { ArrowUpRight, ArrowDownRight, TrendingUp, Sparkles } from 'lucide-react';
import { SimulationScenario } from '../types';

interface ImpactSimulatorProps {
  simulations: SimulationScenario[];
}

const ImpactSimulator: React.FC<ImpactSimulatorProps> = ({ simulations }) => {
  const [activeTab, setActiveTab] = useState(0);

  if (!simulations || simulations.length === 0) return null;

  const activeScenario = simulations[activeTab];

  // Calculate percentage change for display with safety check
  const getChange = (base: number, proj: number) => {
    if (base === 0) return "0.0"; // Avoid division by zero
    const diff = ((proj - base) / base) * 100;
    return diff.toFixed(1);
  };

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="p-6 border-b border-slate-700 bg-slate-900/50 flex justify-between items-center">
        <div>
           <h3 className="text-xl font-bold text-white flex items-center gap-2">
             <Sparkles className="w-5 h-5 text-purple-400" />
             Simulador de Impacto Estratégico
           </h3>
           <p className="text-slate-400 text-sm mt-1">
             Modelagem preditiva de resultados baseada no plano de ação proposto.
           </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700 overflow-x-auto">
        {simulations.map((sim, idx) => (
          <button
            key={idx}
            onClick={() => setActiveTab(idx)}
            className={`flex-1 min-w-[120px] py-4 text-sm font-medium transition-colors border-b-2 ${
              activeTab === idx 
                ? 'border-purple-500 text-purple-400 bg-slate-800' 
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
            }`}
          >
            Cenário {sim.name}
          </button>
        ))}
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Visual Chart */}
        <div className="lg:col-span-2 h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={activeScenario.outcomes}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              barGap={8}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="kpi" stroke="#94a3b8" tick={{fontSize: 12}} />
              <YAxis stroke="#94a3b8" tick={{fontSize: 12}} />
              <Tooltip 
                cursor={{fill: '#1e293b'}}
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#475569', color: '#f8fafc' }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar dataKey="baseline" name="Linha de Base Atual" fill="#64748b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="projected" name="Projeção IA" fill={activeTab === 0 ? '#fbbf24' : activeTab === 1 ? '#3b82f6' : '#10b981'} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Impact Cards */}
        <div className="space-y-4">
           <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-2">Análise de Impacto</h4>
           <p className="text-slate-400 text-sm italic mb-4">"{activeScenario.description}"</p>
           
           <div className="space-y-3">
             {activeScenario.outcomes.map((outcome, idx) => {
               const diffVal = parseFloat(getChange(outcome.baseline, outcome.projected));
               const isPositive = diffVal > 0;
               return (
                 <div key={idx} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
                    <div>
                      <p className="text-xs text-slate-500 font-medium">{outcome.kpi}</p>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-slate-400 text-xs strike-through line-through opacity-70">{outcome.baseline}</span>
                        <span className="text-slate-200 font-bold ml-1">{outcome.projected} {outcome.unit}</span>
                      </div>
                    </div>
                    <div className={`flex items-center gap-1 text-sm font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                       {isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                       {Math.abs(diffVal)}%
                    </div>
                 </div>
               );
             })}
           </div>
           
           <div className="pt-2">
             <div className="text-xs text-slate-500 flex items-center gap-2">
               <TrendingUp size={14} /> Confiança do Modelo: 
               <span className="text-slate-300 font-medium">
                  {activeTab === 0 ? 'Alta (92%)' : activeTab === 1 ? 'Média (85%)' : 'Baixa (68%)'}
               </span>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ImpactSimulator;