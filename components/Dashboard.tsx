import React from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend
} from 'recharts';
import { Activity, TrendingUp, Users, DollarSign, Target, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { AnalysisReport } from '../types';

interface DashboardProps {
  report: AnalysisReport | null;
}

// Fallback data
const mockGrowth = [
  { month: 'Jan', revenue: 4000, projected: 4100 },
  { month: 'Fev', revenue: 3000, projected: 3200 },
  { month: 'Mar', revenue: 2000, projected: 2400 },
  { month: 'Abr', revenue: 2780, projected: 2900 },
  { month: 'Mai', revenue: 1890, projected: 2500 },
  { month: 'Jun', revenue: 2390, projected: 3200 },
  { month: 'Jul', revenue: 3490, projected: 4500 },
];

const mockRadar = [
  { category: 'Tecnologia', A: 60, B: 90, fullMark: 100 },
  { category: 'Processos', A: 50, B: 85, fullMark: 100 },
  { category: 'Pessoas', A: 70, B: 80, fullMark: 100 },
  { category: 'Marketing', A: 40, B: 80, fullMark: 100 },
  { category: 'Financeiro', A: 65, B: 85, fullMark: 100 },
];

const mockPie = [
  { name: 'P&D', value: 400 },
  { name: 'Marketing', value: 300 },
  { name: 'Operações', value: 300 },
  { name: 'Vendas', value: 200 },
];

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

const Dashboard: React.FC<DashboardProps> = ({ report }) => {
  
  // Data extraction with safe fallbacks
  const growthData = (report?.growthProjection?.length ?? 0) > 0 ? report!.growthProjection : mockGrowth;
  const radarData = (report?.operationalMaturity?.length ?? 0) > 0 ? report!.operationalMaturity : mockRadar;
  const pieData = (report?.resourceAllocation?.length ?? 0) > 0 ? report!.resourceAllocation : mockPie;

  const kpis = report?.kpis || [
    { name: 'Crescimento Rec.', value: '---', target: '---', status: 'warning' },
    { name: 'Eficiência Op.', value: '---', target: '---', status: 'critical' },
    { name: 'Market Share', value: '---', target: '---', status: 'good' }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* 1. KPIs Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm relative overflow-hidden group">
             {/* Status Indicator */}
             <div className={`absolute top-0 right-0 p-2`}>
                {kpi.status === 'good' && <CheckCircle2 className="text-green-500 opacity-50" />}
                {kpi.status === 'warning' && <AlertTriangle className="text-yellow-500 opacity-50" />}
                {kpi.status === 'critical' && <XCircle className="text-red-500 opacity-50" />}
             </div>

            <div className="absolute right-0 top-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
              {idx === 0 ? <TrendingUp size={64} /> : idx === 1 ? <Activity size={64} /> : <DollarSign size={64} />}
            </div>
            
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">{kpi.name}</h3>
            <div className="flex items-end gap-3">
              <span className="text-3xl font-bold text-white">{kpi.value}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  kpi.status === 'good' ? 'bg-green-900/50 text-green-400' : 
                  kpi.status === 'warning' ? 'bg-yellow-900/50 text-yellow-400' : 
                  'bg-red-900/50 text-red-400'
              }`}>
                Meta: {kpi.target}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 2. Radar Chart - Maturity 5D */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm h-[400px]">
            <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                <Target className="text-purple-400" size={20} />
                Maturidade Operacional (Teia de Aranha)
            </h3>
            <ResponsiveContainer width="100%" height="90%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis dataKey="category" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#64748b' }} />
                    <Radar name="Atual" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} />
                    <Radar name="Ideal" dataKey="B" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} />
                    <Legend />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f1f5f9' }} 
                        itemStyle={{ color: '#e2e8f0' }}
                    />
                </RadarChart>
            </ResponsiveContainer>
        </div>

        {/* 3. Area Chart - Financial Projection */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm h-[400px]">
            <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                <TrendingUp className="text-blue-400" size={20} />
                Projeção de Crescimento Preditivo
            </h3>
            <ResponsiveContainer width="100%" height="90%">
            <AreaChart data={growthData}>
                <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorProj" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f1f5f9' }} 
                    itemStyle={{ color: '#e2e8f0' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRev)" name="Histórico" />
                <Area type="monotone" dataKey="projected" stroke="#a855f7" strokeDasharray="5 5" fillOpacity={1} fill="url(#colorProj)" name="Previsão IA" />
                <Legend />
            </AreaChart>
            </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* 4. Pie Chart - Resource Allocation */}
         <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 h-[350px]">
            <h3 className="text-lg font-semibold text-white mb-4">Sugestão de Alocação de Recursos</h3>
            <ResponsiveContainer width="100%" height="85%">
                <PieChart>
                    <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                        label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                        {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569' }} />
                </PieChart>
            </ResponsiveContainer>
         </div>

         {/* 5. OKRs List */}
         <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 h-[350px] overflow-y-auto custom-scrollbar">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Target className="text-green-400" />
                OKRs Estratégicos (Trimestral)
            </h3>
            <div className="space-y-4">
                {report?.okrs && report.okrs.length > 0 ? (
                    report.okrs.map((okr, idx) => (
                        <div key={idx} className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
                            <p className="text-sm font-bold text-slate-200 mb-2">O{idx+1}: {okr.objective}</p>
                            <ul className="space-y-1">
                                {okr.keyResults.map((kr, kIdx) => (
                                    <li key={kIdx} className="text-xs text-slate-400 flex items-start gap-2">
                                        <span className="mt-1 w-1 h-1 rounded-full bg-blue-500 block"></span>
                                        {kr}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))
                ) : (
                    <div className="text-center text-slate-500 mt-10">
                        <p>Nenhum OKR gerado ainda.</p>
                    </div>
                )}
            </div>
         </div>
      </div>
    </div>
  );
};

export default Dashboard;