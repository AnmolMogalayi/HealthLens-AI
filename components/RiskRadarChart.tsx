import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { RiskCategory } from '../types';

interface RiskRadarChartProps {
  data: RiskCategory[];
}

export const RiskRadarChart: React.FC<RiskRadarChartProps> = ({ data }) => {
  // Format data for Recharts
  const chartData = data.map(item => ({
    subject: item.category,
    A: item.score,
    fullMark: 100
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="glass-panel p-3 rounded-xl border border-white/50 dark:border-navy-600 shadow-xl text-xs dark:bg-navy-800/90">
          <p className="font-bold text-slate-700 dark:text-white mb-1">{data.subject}</p>
          <p className="text-sm font-bold text-indigo-600 dark:text-neon-blue">
            Score: {data.A}/100
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
          <PolarGrid stroke="#e2e8f0" strokeOpacity={0.3} />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }} 
          />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            name="Health Score"
            dataKey="A"
            stroke="#6366f1"
            strokeWidth={3}
            fill="#818cf8"
            fillOpacity={0.4}
          />
          <Tooltip content={<CustomTooltip />} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};