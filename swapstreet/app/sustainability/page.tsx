"use client";

import React, { useState } from 'react';
import { 
  Cloud, Droplets, Shirt, Zap, Pipette, Mountain, 
  Maximize2, BarChart2, TrendingUp, ChevronDown, Fullscreen,
  LucideIcon
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { TooltipProps } from 'recharts';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import { Header } from '@/components/common/Header';

// This matches the structure of your DATA array
interface CustomTooltipProps extends TooltipProps<ValueType, NameType> {
  active?: boolean;
  payload?: readonly any[];
}

// --- Types ---

interface ChartData {
  name: string;
  value: number;
  highlighted?: boolean;
}

interface StatCardProps {
  icon: LucideIcon;
  value: string;
  label: string;
  colorClass: string;
  borderClass?: string;
}

// --- Mock Data ---

const DATA: ChartData[] = [
  { name: '10', value: 65 }, { name: '11', value: 45 }, { name: '12', value: 25 },
  { name: '13', value: 40 }, { name: '14', value: 48 }, { name: '15', value: 60, highlighted: true },
  { name: '16', value: 38 }, { name: '17', value: 55 }, { name: '18', value: 70 },
  { name: '19', value: 82 }, { name: '20', value: 95 }, { name: '21', value: 62 },
];

// --- Sub-components ---

const StatCard: React.FC<StatCardProps> = ({ 
  icon: Icon, value, label, colorClass, borderClass = "border-gray-200" 
}) => (
  <div className={`relative p-6 bg-white border-2 rounded-xl transition-all ${borderClass}`}>
    <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
      <Maximize2 size={18} />
    </button>
    <div className="flex items-center gap-4">
      <div className={`p-4 rounded-full ${colorClass}`}>
        <Icon size={32} className="stroke-[1.5]" />
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-800">{value}</div>
        <div className="text-sm text-gray-500 leading-tight">{label}</div>
      </div>
    </div>
  </div>
);

// --- Main Component ---

export default function SustainabilityDashboard() {
  const [view, setView] = useState<'bar' | 'trend'>('bar');

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 pt-20 md:pt-24 font-sans">
      <Header />
      <header className="mb-12">
        <h1 className="text-2xl font-bold text-gray-900">Sustainability Overview</h1>
        <p className="text-gray-500">Detailed insights into your impact</p>
      </header>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        <StatCard icon={Cloud} value="82" label="Metric tons of CO₂ avoided" colorClass="bg-green-50 text-green-500" />
        <StatCard icon={Droplets} value="8,059" label="Gallons of water saved" colorClass="bg-blue-50 text-blue-400" />
        <StatCard icon={Shirt} value="132" label="Individual clothes saved" colorClass="bg-orange-50 text-orange-400" />
        <StatCard icon={Zap} value="5,287" label="Kwh of electricity saved" colorClass="bg-yellow-50 text-yellow-400" borderClass="border-blue-500 shadow-md" />
        <StatCard icon={Pipette} value="2,350" label="Kg of toxic dye chemicals avoided" colorClass="bg-purple-50 text-purple-400" />
        <StatCard icon={Mountain} value="8,000" label="m² of land preserved" colorClass="bg-red-50 text-red-400" />
      </div>

      <section>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Impact Summary</h2>
          <p className="text-gray-500">Track your performance changes and environmental progress over time</p>
        </div>

        <div className="bg-white border-2 border-gray-200 rounded-xl p-4 md:p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
            <h3 className="text-xl font-semibold text-gray-800">Chart</h3>
            <div className="flex items-center gap-3">
              <div className="flex border rounded-lg overflow-hidden bg-white shadow-sm">
                <button 
                  onClick={() => setView('bar')}
                  className={`p-2 transition-colors ${view === 'bar' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                >
                  <BarChart2 size={20} className={view === 'bar' ? 'text-teal-600' : 'text-gray-500'} />
                </button>
                <button 
                  onClick={() => setView('trend')}
                  className={`p-2 border-l transition-colors ${view === 'trend' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                >
                  <TrendingUp size={20} className={view === 'trend' ? 'text-teal-600' : 'text-gray-500'} />
                </button>
              </div>
              <button className="flex items-center gap-2 px-3 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50 bg-white shadow-sm">
                Last Month <ChevronDown size={16} />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <Fullscreen size={20} />
              </button>
            </div>
          </div>

          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#9CA3AF', fontSize: 12 }} 
                  dy={10} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#9CA3AF', fontSize: 12 }} 
                />
                <Tooltip 
                  cursor={{ fill: '#F9FAFB' }}
                  content={(props: CustomTooltipProps) => {
                    const { active, payload } = props;

                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-gray-200 p-3 rounded shadow-lg border border-gray-300">
                          {/* Use payload[0].value to get the number */}
                          <p className="text-sm font-bold text-gray-800">
                            {payload[0].value}
                          </p>
                          <p className="text-xs text-gray-600">January 15, 2026</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                  {DATA.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.highlighted ? '#0D9488' : '#E5E7EB'} 
                      className="transition-all duration-300 hover:opacity-80"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
    </div>
  );
}