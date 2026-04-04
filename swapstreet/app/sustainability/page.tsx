"use client";

import React, { useState } from 'react';
import { 
  Cloud, Droplets, Shirt, Zap, Pipette, Mountain, 
  LucideIcon
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { Header } from '@/components/common/Header';

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
  isSelected: boolean;
  onClick: () => void;
}

// --- Mock Data (Updated to months) ---

const DATA: ChartData[] = [
  { name: 'Jan', value: 65 }, 
  { name: 'Feb', value: 45 }, 
  { name: 'Mar', value: 25 },
  { name: 'Apr', value: 40 }, 
  { name: 'May', value: 48 }, 
  { name: 'Jun', value: 60 },
  { name: 'Jul', value: 38 }, 
  { name: 'Aug', value: 55 }, 
  { name: 'Sep', value: 70 },
  { name: 'Oct', value: 82 }, 
  { name: 'Nov', value: 95 }, 
  { name: 'Dec', value: 62 },
];

// --- Sub-components ---

const StatCard: React.FC<StatCardProps> = ({ 
  icon: Icon, value, label, colorClass, isSelected, onClick
}) => (
  <div 
    className={`relative p-6 bg-white border-2 rounded-xl transition-all cursor-pointer ${
      isSelected ? 'border-blue-500 shadow-md' : 'border-gray-200'
    }`}
    onClick={onClick}
  >
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

// Custom Tooltip Component
const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: ChartData[] }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-200 p-3 rounded shadow-lg border border-gray-300">
        <p className="text-sm font-bold text-gray-800">
          {payload[0].value}
        </p>
        <p className="text-xs text-gray-600">{payload[0].name} 2026</p>
      </div>
    );
  }
  return null;
};

// --- Main Component ---

export default function SustainabilityDashboard() {
  // Get current month (0-11, so April = 3)
  const currentMonth = new Date().getMonth();
  
  const [selectedBar, setSelectedBar] = useState<number>(currentMonth);
  const [selectedCard, setSelectedCard] = useState<number>(0);

  const handleBarClick = (index: number) => {
    setSelectedBar(index);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 pt-20 md:pt-24 font-sans">
      <Header />
      <header className="mb-12">
        <h1 className="text-2xl font-bold text-gray-900">Sustainability Overview</h1>
        <p className="text-gray-500">Detailed insights into your impact</p>
      </header>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        <StatCard 
          icon={Cloud} 
          value="82" 
          label="Metric tons of CO₂ avoided" 
          colorClass="bg-green-50 text-green-500" 
          isSelected={selectedCard === 0}
          onClick={() => setSelectedCard(0)}
        />
        <StatCard 
          icon={Droplets} 
          value="8,059" 
          label="Gallons of water saved" 
          colorClass="bg-blue-50 text-blue-400" 
          isSelected={selectedCard === 1}
          onClick={() => setSelectedCard(1)}
        />
        <StatCard 
          icon={Shirt} 
          value="132" 
          label="Individual clothes saved" 
          colorClass="bg-orange-50 text-orange-400" 
          isSelected={selectedCard === 2}
          onClick={() => setSelectedCard(2)}
        />
        <StatCard 
          icon={Zap} 
          value="5,287" 
          label="Kwh of electricity saved" 
          colorClass="bg-yellow-50 text-yellow-400" 
          isSelected={selectedCard === 3}
          onClick={() => setSelectedCard(3)}
        />
        <StatCard 
          icon={Pipette} 
          value="2,350" 
          label="Kg of toxic dye chemicals avoided" 
          colorClass="bg-purple-50 text-purple-400" 
          isSelected={selectedCard === 4}
          onClick={() => setSelectedCard(4)}
        />
        <StatCard 
          icon={Mountain} 
          value="8,000" 
          label="m² of land preserved" 
          colorClass="bg-red-50 text-red-400" 
          isSelected={selectedCard === 5}
          onClick={() => setSelectedCard(5)}
        />
      </div>

      <section>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Impact Summary</h2>
          <p className="text-gray-500">Track your performance changes and environmental progress over time</p>
        </div>

        <div className="bg-white border-2 border-gray-200 rounded-xl p-4 md:p-8">
          <div className="mb-10">
            <h3 className="text-xl font-semibold text-gray-800">Monthly Usage</h3>
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
                  content={<CustomTooltip />}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                  {DATA.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={selectedBar === index ? '#0D9488' : '#E5E7EB'} 
                      className="transition-all duration-300 hover:opacity-80 cursor-pointer"
                      onClick={() => handleBarClick(index)}
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