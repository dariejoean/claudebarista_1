import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { BOX_STYLE } from '../../styles/common';
import { ChartDataPoint } from '../../types';

interface LiveExtractionChartProps {
  data: ChartDataPoint[];
  compact?: boolean;
}

export const LiveExtractionChart: React.FC<LiveExtractionChartProps> = React.memo(({ data, compact }) => {
  return (
    <div className={`${BOX_STYLE} ${compact ? '!h-48' : '!h-72'} !p-3 flex flex-col`}>
      <div className="text-[11px] font-bold text-[var(--color-box-label)] uppercase tracking-wider w-full text-center mb-2 drop-shadow-sm">
        PROFIL EXTRACȚIE
      </div>
      <div className="flex-1 w-full relative">
        {data.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-on-surface/30 text-xs font-bold uppercase tracking-widest z-10">
            Așteptare date...
          </div>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis 
              dataKey="time" 
              type="number" 
              domain={[0, 'dataMax']} 
              tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }}
              tickCount={5}
              axisLine={false}
              tickLine={false}
              tickFormatter={(val) => `${val}s`}
            />
            <YAxis 
              yAxisId="weight"
              orientation="left"
              domain={[0, 60]} 
              tick={{ fontSize: 10, fill: '#A0522D' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(val) => `${val}g`}
            />
            <YAxis 
              yAxisId="pressure"
              orientation="right"
              domain={[0, 13]} 
              tick={{ fontSize: 10, fill: '#22c55e' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(val) => `${val}b`}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px', color: '#fff' }}
              labelStyle={{ display: 'none' }}
              formatter={(value: number, name: string) => {
                if (name === 'weight') return [`${value.toFixed(1)}g`, 'Greutate'];
                if (name === 'pressure') return [`${value.toFixed(1)} bar`, 'Presiune'];
                return [value, name];
              }}
              isAnimationActive={false}
            />
            <Line 
              yAxisId="weight"
              type="monotone" 
              dataKey="weight" 
              stroke="#A0522D" 
              strokeWidth={3} 
              dot={false}
              isAnimationActive={false}
            />
            <Line 
              yAxisId="pressure"
              type="monotone" 
              dataKey="pressure" 
              stroke="#22c55e" 
              strokeWidth={2} 
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-3 text-[10px] font-bold uppercase tracking-wider">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-1 bg-[#A0522D] rounded-full"></div>
          <span className="text-[#A0522D]">Greutate (g)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-1 bg-[#22c55e] rounded-full"></div>
          <span className="text-[#22c55e]">Presiune (bar)</span>
        </div>
      </div>
    </div>
  );
});
