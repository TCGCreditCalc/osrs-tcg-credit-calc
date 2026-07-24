import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import type { DataPoint } from '../../hooks/useCreditCalculation';

interface ChartProps {
  method1Data: DataPoint[];
  method1Name: string;
  method2Data?: DataPoint[];
  method2Name?: string;
}

export const CrossoverChart: React.FC<ChartProps> = ({
  method1Data,
  method1Name,
  method2Data,
  method2Name,
}) => {
  const [metric, setMetric] = React.useState<'marginal' | 'cumulative'>('marginal');

  // Merge data points by level instead of time
  const allLevels = new Set([
    ...method1Data.map(d => d.level),
    ...(method2Data ? method2Data.map(d => d.level) : [])
  ]);
  
  const sortedLevels = Array.from(allLevels).sort((a, b) => a - b);

  const mergedData = sortedLevels.map(level => {
    const d1 = method1Data.find(d => d.level === level);
    const d2 = method2Data ? method2Data.find(d => d.level === level) : null;
    return {
      level,
      [method1Name]: d1 ? (metric === 'marginal' ? d1.marginalCreditsPerHour : d1.creditsPerHour) : null,
      ...(method2Data && method2Name ? { [method2Name]: d2 ? (metric === 'marginal' ? d2.marginalCreditsPerHour : d2.creditsPerHour) : null } : {})
    };
  });

  return (
    <div style={{ width: '100%', height: 450, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', gap: '1rem' }}>
        <button 
          onClick={() => setMetric('marginal')}
          style={{ padding: '0.4rem 1rem', background: metric === 'marginal' ? '#f39c12' : '#333', color: metric === 'marginal' ? '#000' : '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
        >
          Level-by-Level Rate
        </button>
        <button 
          onClick={() => setMetric('cumulative')}
          style={{ padding: '0.4rem 1rem', background: metric === 'cumulative' ? '#f39c12' : '#333', color: metric === 'cumulative' ? '#000' : '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
        >
          Cumulative Average
        </button>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <ResponsiveContainer>
          <LineChart
            data={mergedData}
          margin={{
            top: 20,
            right: 30,
            left: 35,
            bottom: 20,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis 
            dataKey="level" 
            stroke="#aaa"
            type="number"
            domain={['dataMin', 'dataMax']}
            label={{ value: 'Primary Level', position: 'bottom', fill: '#aaa', offset: 0 }} 
          />
          <YAxis 
            stroke="#aaa"
            label={{ value: 'Credits / Hour', angle: -90, position: 'insideLeft', fill: '#aaa', dx: -35 }} 
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
            itemStyle={{ color: '#fff' }}
            labelFormatter={(label) => `Level ${label}`}
          />
          <Legend verticalAlign="top" height={36}/>
          <Line 
            type="monotone" 
            dataKey={method1Name} 
            stroke="#8884d8" 
            activeDot={{ r: 8 }} 
            strokeWidth={3}
            dot={false}
            connectNulls={true}
          />
          {method2Data && method2Name && (
            <Line 
              type="monotone" 
              dataKey={method2Name} 
              stroke="#82ca9d" 
              strokeWidth={3}
              dot={false}
              connectNulls={true}
            />
          )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
