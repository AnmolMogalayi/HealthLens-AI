import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { BiomarkerTrend } from '../types';

interface TrendChartProps {
  trend: BiomarkerTrend;
}

export const TrendChart: React.FC<TrendChartProps> = ({ trend }) => {
  // Determine color based on trend class
  const getColor = () => {
    switch (trend.trend_class) {
      case 'improved': return '#10b981'; // Emerald 500
      case 'worsened': return '#f43f5e'; // Rose 500
      case 'stable': return '#3b82f6'; // Blue 500
      default: return '#64748b'; // Slate 500
    }
  };

  const color = getColor();
  const sortedData = [...trend.values].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="glass-panel p-3 rounded-xl border border-white/50 dark:border-navy-600 shadow-xl text-xs dark:bg-navy-800/90">
          <p className="font-bold text-slate-700 dark:text-white mb-1">{data.date}</p>
          <p className="text-sm font-bold" style={{ color: color }}>
            {data.value} <span className="text-[10px] text-slate-400 font-normal">{data.unit}</span>
          </p>
          <p className="text-[10px] text-slate-400 mt-1">Confidence: {(data.confidence * 100).toFixed(0)}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-64 w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={sortedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id={`colorGradient-${trend.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.2}/>
              <stop offset="95%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" strokeOpacity={0.2} />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 10, fill: '#94a3b8' }} 
            axisLine={false} 
            tickLine={false} 
            tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          />
          <YAxis 
            tick={{ fontSize: 10, fill: '#94a3b8' }} 
            axisLine={false} 
            tickLine={false} 
            domain={['auto', 'auto']}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke={color} 
            strokeWidth={3}
            fillOpacity={1} 
            fill={`url(#colorGradient-${trend.key})`} 
            animationDuration={1500}
            activeDot={{ r: 6, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};