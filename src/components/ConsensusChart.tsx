import React from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ProjectState } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import { BarChart2, ThumbsUp, ThumbsDown, HelpCircle, Activity } from 'lucide-react';

interface ConsensusChartProps {
  project: ProjectState;
}

export default function ConsensusChart({ project }: ConsensusChartProps) {
  const { t } = useLanguage();

  if (!project.rounds || project.rounds.length === 0) {
    return null;
  }

  const isZh = project.language === 'zh';
  const confidenceLineLabel = isZh ? '平均置信度（趋势）' : 'Avg Confidence (Trend)';

  // Calculate metrics
  let totalUp = 0;
  let totalDown = 0;
  let totalNeutral = 0;

  const chartData = project.rounds.map((r) => {
    let upVotes = 0;
    let downVotes = 0;
    let neutralVotes = 0;
    let confidenceSum = 0;

    r.responses.forEach((resp) => {
      if (resp.userVote === 'up') {
        upVotes++;
        totalUp++;
      } else if (resp.userVote === 'down') {
        downVotes++;
        totalDown++;
      } else {
        neutralVotes++;
        totalNeutral++;
      }
      confidenceSum += (resp.confidence || 0);
    });

    const avgConfidence = r.responses.length > 0 
      ? Math.round(confidenceSum / r.responses.length) 
      : 0;

    const roundLabel = isZh ? `第 ${r.roundNumber} 轮` : `Round ${r.roundNumber}`;

    return {
      name: roundLabel,
      roundNumber: r.roundNumber,
      [t.chartApprove]: upVotes,
      [t.chartReject]: downVotes,
      [t.chartAbstain]: neutralVotes,
      confidence: avgConfidence,
      rawUp: upVotes,
      rawDown: downVotes,
      rawNeutral: neutralVotes,
    };
  });

  const totalEvaluations = totalUp + totalDown;
  const consensusRate = totalEvaluations > 0 
    ? Math.round((totalUp / totalEvaluations) * 100) 
    : 0;

  // Calculte overall average agent confidence
  const totalRoundsCount = project.rounds.length;
  const grandConfidenceSum = chartData.reduce((sum, item) => sum + item.confidence, 0);
  const overallConfidenceAvg = totalRoundsCount > 0 
    ? Math.round(grandConfidenceSum / totalRoundsCount) 
    : 0;

  // Render a customized tooltip to perfectly fit the dark aesthetic
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl shadow-2xl font-mono text-xs text-slate-300">
          <p className="font-bold text-white mb-2 pb-1 border-b border-slate-800">{label}</p>
          <div className="space-y-1.5">
            {payload.map((entry: any, index: number) => {
              let dotColor = 'bg-slate-500';
              if (entry.name === t.chartApprove) dotColor = 'bg-emerald-500';
              else if (entry.name === t.chartReject) dotColor = 'bg-rose-500';
              else if (entry.name === t.chartAbstain) dotColor = 'bg-[#334155]';
              else if (entry.name === 'confidence' || entry.name === confidenceLineLabel) dotColor = 'bg-indigo-400';

              const isConfidence = entry.name === 'confidence' || entry.name === confidenceLineLabel;
              const displayLabel = isConfidence ? confidenceLineLabel : entry.name;
              const displayValue = isConfidence ? `${entry.value}%` : entry.value;

              return (
                <div key={index} className="flex items-center gap-5 justify-between">
                  <span className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                    <span className="text-slate-400">{displayLabel}</span>
                  </span>
                  <span className="font-bold text-white">{displayValue}</span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div id="voting-consensus-chart-card" className="bg-[#161B22] border border-slate-800 rounded-xl p-5 shadow-2xl space-y-4">
      {/* Header section with metrics/summaries */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/60 font-sans">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 rounded-lg">
            <BarChart2 size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight text-white uppercase">{t.consensusChartTitle}</h3>
            <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
              {project.rounds.length} {project.rounds.length === 1 ? 'round' : 'rounds'} analyzed
            </p>
          </div>
        </div>

        {/* Aggregate consensus visual status */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 bg-slate-900/40 border border-[#1f2937] rounded-xl px-4 py-1.5 shrink-0">
            <div className="text-right">
              <div className="text-[9px] uppercase font-mono tracking-wider text-slate-500">Consensus Rate</div>
              <div className="text-base font-bold font-mono text-cyan-400 leading-tight">
                {totalEvaluations > 0 ? `${consensusRate}%` : '—'}
              </div>
            </div>
            <div className="w-8 h-8 rounded-full border border-slate-800 bg-[#0F1219] flex items-center justify-center">
              <Activity size={14} className={totalEvaluations > 0 ? "text-cyan-400 animate-pulse" : "text-slate-600"} />
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-900/40 border border-[#1f2937] rounded-xl px-4 py-1.5 shrink-0">
            <div className="text-right">
              <div className="text-[9px] uppercase font-mono tracking-wider text-slate-500">
                {isZh ? '平均置信度' : 'Mean Confidence'}
              </div>
              <div className="text-base font-bold font-mono text-indigo-400 leading-tight">
                {overallConfidenceAvg > 0 ? `${overallConfidenceAvg}%` : '—'}
              </div>
            </div>
            <div className="w-8 h-8 rounded-full border border-slate-800 bg-[#0F1219] flex items-center justify-center">
              <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-ping opacity-60 absolute" />
              <div className="w-2 h-2 bg-indigo-400 rounded-full relative" />
            </div>
          </div>
        </div>
      </div>

      {/* Numerical Indicators */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-900/30 border border-slate-800/50 rounded-lg p-2.5 text-center">
          <div className="flex items-center justify-center gap-1.5 text-emerald-500/90 text-[10px] font-mono font-semibold uppercase tracking-wider mb-1">
            <ThumbsUp size={10} className="fill-emerald-500/10" />
            <span>{t.chartApprove}</span>
          </div>
          <div className="text-base font-bold text-white font-mono">{totalUp}</div>
        </div>

        <div className="bg-slate-900/30 border border-slate-800/50 rounded-lg p-2.5 text-center border-l border-r border-slate-800/50">
          <div className="flex items-center justify-center gap-1.5 text-rose-500/90 text-[10px] font-mono font-semibold uppercase tracking-wider mb-1">
            <ThumbsDown size={10} className="fill-rose-500/10" />
            <span>{t.chartReject}</span>
          </div>
          <div className="text-base font-bold text-white font-mono">{totalDown}</div>
        </div>

        <div className="bg-slate-900/30 border border-slate-800/50 rounded-lg p-2.5 text-center">
          <div className="flex items-center justify-center gap-1.5 text-slate-500 text-[10px] font-mono font-semibold uppercase tracking-wider mb-1">
            <HelpCircle size={10} />
            <span>{t.chartAbstain}</span>
          </div>
          <div className="text-base font-bold text-white font-mono">{totalNeutral}</div>
        </div>
      </div>

      {/* The Stacked Bar Graph Combined with Line Trend Overlay */}
      <div className="w-full h-[220px] relative mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 10, right: 0, left: -25, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#232a35" horizontal={true} vertical={false} />
            <XAxis 
              dataKey="name" 
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace', fontWeight: 500 }}
              stroke="#2d3748"
            />
            {/* Left Y-Axis for Vote Counts */}
            <YAxis 
              yAxisId="votes"
              orientation="left"
              allowDecimals={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
              stroke="#2d3748"
            />
            {/* Right Y-Axis for Confidence Rate */}
            <YAxis 
              yAxisId="confidence"
              orientation="right"
              domain={[0, 100]}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
              tick={{ fill: '#818cf8', fontSize: 9, fontFamily: 'monospace' }}
              stroke="#2d3748"
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(30, 41, 59, 0.4)' }} />
            
            {/* Vote Count Stacked Bars mapped on left Y-axis */}
            <Bar 
              yAxisId="votes"
              dataKey={t.chartApprove} 
              stackId="a" 
              fill="#10b981" 
              radius={[0, 0, 0, 0]}
              maxBarSize={28}
            />
            <Bar 
              yAxisId="votes"
              dataKey={t.chartReject} 
              stackId="a" 
              fill="#f43f5e" 
              radius={[0, 0, 0, 0]}
              maxBarSize={28}
            />
            <Bar 
              yAxisId="votes"
              dataKey={t.chartAbstain} 
              stackId="a" 
              fill="#334155" 
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
            />

            {/* Average Confidence line mapped on right Y-axis */}
            <Line
              yAxisId="confidence"
              type="monotone"
              dataKey="confidence"
              name={confidenceLineLabel}
              stroke="#6366f1"
              strokeWidth={2}
              dot={{ r: 4, stroke: '#818cf8', strokeWidth: 1.5, fill: '#0F1219' }}
              activeDot={{ r: 6, stroke: '#818cf8', strokeWidth: 2, fill: '#6366f1' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Mini legend description */}
      <div className="flex flex-wrap justify-center items-center gap-x-5 gap-y-2 text-[10px] text-slate-500 font-mono mt-2">
        <label className="flex items-center gap-1.5">
          <span className="w-2.5 h-1.5 bg-[#10b981] rounded-sm" />
          <span>{t.chartApprove}</span>
        </label>
        <label className="flex items-center gap-1.5">
          <span className="w-2.5 h-1.5 bg-[#f43f5e] rounded-sm" />
          <span>{t.chartReject}</span>
        </label>
        <label className="flex items-center gap-1.5">
          <span className="w-2.5 h-1.5 bg-[#334155] rounded-sm" />
          <span>{t.chartAbstain}</span>
        </label>
        <label className="flex items-center gap-1.5">
          <span className="relative flex items-center justify-center w-5 h-1.5">
            <span className="absolute w-full h-[2px] bg-indigo-500" />
            <span className="absolute w-1.5 h-1.5 rounded-full bg-indigo-400 border border-[#161B22]" />
          </span>
          <span>{confidenceLineLabel}</span>
        </label>
      </div>
    </div>
  );
}
