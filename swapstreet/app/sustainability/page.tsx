"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Cloud,
  Droplets,
  Shirt,
  Zap,
  Pipette,
  Trash2,
  LucideIcon,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Header } from "@/components/common/Header";
import AnimatedCounter from "@/components/AnimatedCounter";

interface ChartData {
  name: string;
  total: number;
}

interface SustainabilityStats {
  CO2Kg: number;
  WaterL: number;
  ElectricityKWh: number;
  ToxicChemicalsG: number;
  LandfillKg: number;
  Articles: number;
}

function mapStats(raw: Record<string, unknown>): SustainabilityStats {
  return {
    CO2Kg: Number(raw.CO2Kg ?? raw.co2Kg ?? 0),
    WaterL: Number(raw.WaterL ?? raw.waterL ?? 0),
    ElectricityKWh: Number(raw.ElectricityKWh ?? raw.electricityKWh ?? 0),
    ToxicChemicalsG: Number(
      raw.ToxicChemicalsG ?? raw.toxicChemicalsG ?? raw.toxicChemicals ?? 0,
    ),
    LandfillKg: Number(raw.LandfillKg ?? raw.landfillKg ?? 0),
    Articles: Number(raw.Articles ?? raw.articles ?? 0),
  };
}

interface StatCardProps {
  icon: LucideIcon;
  value: React.ReactNode;
  label: string;
  colorClass: string;
}

const EMPTY_STATS: SustainabilityStats = {
  CO2Kg: 0,
  WaterL: 0,
  ElectricityKWh: 0,
  ToxicChemicalsG: 0,
  LandfillKg: 0,
  Articles: 0,
};

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const StatCard: React.FC<StatCardProps> = ({
  icon: Icon,
  value,
  label,
  colorClass,
}) => {
  return (
    <div className="relative rounded-xl border-2 border-gray-200 bg-white p-3 transition-all md:p-4">
      <div className="flex items-center gap-2 md:gap-3">
        <div className={`rounded-full p-2.5 md:p-3 ${colorClass}`}>
          <Icon size={22} className="stroke-[1.5]" />
        </div>
        <div>
          <div className="text-lg font-bold text-gray-800 md:text-xl">
            {value}
          </div>
          <div className="text-xs leading-tight text-gray-500 md:text-sm">
            {label}
          </div>
        </div>
      </div>
    </div>
  );
};

export const CustomTooltip = ({
  active,
  label,
  stats,
}: {
  active?: boolean;
  label?: string;
  stats: SustainabilityStats;
}) => {
  if (!active) {
    return null;
  }

  const unitByMetric: Record<string, string> = {
    "Kg of CO2 avoided": "Kg",
    "Liters of water saved": "Liters",
    "Clothes saved": "items",
    "Electricity saved": "kWh",
    "Toxic chemicals avoided": "kg",
    "Landfill avoided": "g",
  };

  const rows = [
    { name: "Kg of CO2 avoided", value: stats.CO2Kg },
    { name: "Liters of water saved", value: stats.WaterL },
    { name: "Clothes saved", value: stats.Articles },
    { name: "Electricity saved", value: stats.ElectricityKWh },
    { name: "Toxic chemicals avoided", value: stats.ToxicChemicalsG },
    { name: "Landfill avoided", value: stats.LandfillKg * 1000 },
  ];

  const hasData = rows.some((item) => item.value > 0);

  return (
    <div className="rounded border border-gray-300 bg-gray-200 p-3 shadow-lg">
      <p className="text-sm font-bold text-gray-800">{label} 2026</p>
      <p className="text-xs text-gray-600">
        {hasData ? "Current month metric breakdown" : "No data for this month"}
      </p>
      {hasData && (
        <div className="mt-2 space-y-1">
          {rows.map((item) => (
            <p
              key={item.name}
              className="flex items-center justify-between gap-3 text-xs text-gray-700"
            >
              <span>
                {item.name}
                {unitByMetric[item.name] ? ` (${unitByMetric[item.name]})` : ""}
              </span>
              <span className="font-semibold">{item.value.toLocaleString()}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
};

export default function SustainabilityDashboard() {
  const currentMonth = new Date().getMonth();

  const [selectedView, setSelectedView] = useState<"individual" | "platform">(
    "individual",
  );
  const [userStats, setUserStats] = useState<SustainabilityStats>(EMPTY_STATS);
  const [globalStats, setGlobalStats] = useState<SustainabilityStats | null>(
    null,
  );

  const activeStats =
    selectedView === "individual" ? userStats : globalStats ?? EMPTY_STATS;

  const activeViewLabel =
    selectedView === "individual" ? "Individual View" : "Platform View";

  const chartData: ChartData[] = useMemo(
    () =>
      MONTHS.map((name, index) => ({
        name,
        total:
          index === currentMonth
            ? activeStats.CO2Kg +
              activeStats.WaterL +
              activeStats.Articles +
              activeStats.ElectricityKWh +
              activeStats.ToxicChemicalsG +
              activeStats.LandfillKg * 1000
            : 0,
      })),
    [activeStats, currentMonth],
  );

  useEffect(() => {
    const accessToken = sessionStorage.getItem("accessToken");
    if (!accessToken) {
      return;
    }

    const headers = {
      Authorization: `Bearer ${accessToken}`,
    };

    Promise.all([
      fetch("/api/sustainability/data", { headers }),
      fetch("/api/sustainability/global", { headers }),
    ])
      .then(async ([userRes, globalRes]) => {
        if (userRes.ok) {
          const userData = (await userRes.json()) as Record<string, unknown>;
          setUserStats(mapStats(userData));
        }

        if (globalRes.ok) {
          const globalData = (await globalRes.json()) as Record<
            string,
            unknown
          >;
          setGlobalStats(mapStats(globalData));
        }
      })
      .catch(() => {
        // Keep the default empty state if the backend is temporarily unavailable.
      });
  }, []);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gray-50 px-3 pt-20 font-sans md:px-6 md:pt-24">
      <Header />
      <div className="mx-auto flex w-full max-w-[1200px] flex-1 min-h-0 flex-col">
        <header className="mb-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900 md:text-2xl">
                Sustainability Overview
              </h1>
              <p className="text-sm text-gray-500">
                Detailed insights into your impact
              </p>
            </div>
            <div className="inline-flex rounded-full border border-gray-200 bg-white p-1 shadow-sm">
              <button
                type="button"
                onClick={() => setSelectedView("individual")}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  selectedView === "individual"
                    ? "bg-teal-500 text-white"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Individual
              </button>
              <button
                type="button"
                onClick={() => setSelectedView("platform")}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  selectedView === "platform"
                    ? "bg-teal-500 text-white"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Platform
              </button>
            </div>
          </div>
        </header>

        <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
          {activeViewLabel}
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-3">
          <StatCard
            icon={Cloud}
            value={<AnimatedCounter target={activeStats.CO2Kg} />}
            label="Kg of CO2 avoided"
            colorClass="bg-green-50 text-green-500"
          />
          <StatCard
            icon={Droplets}
            value={<AnimatedCounter target={activeStats.WaterL} />}
            label="Liters of water saved"
            colorClass="bg-blue-50 text-blue-400"
          />
          <StatCard
            icon={Shirt}
            value={<AnimatedCounter target={activeStats.Articles} />}
            label="Individual clothes saved"
            colorClass="bg-orange-50 text-orange-400"
          />
          <StatCard
            icon={Zap}
            value={<AnimatedCounter target={activeStats.ElectricityKWh} />}
            label="Kwh of electricity saved"
            colorClass="bg-yellow-50 text-yellow-400"
          />
          <StatCard
            icon={Pipette}
            value={<AnimatedCounter target={activeStats.ToxicChemicalsG} />}
            label="Grams of toxic dye chemicals avoided"
            colorClass="bg-purple-50 text-purple-400"
          />
          <StatCard
            icon={Trash2}
            value={<AnimatedCounter target={activeStats.LandfillKg * 1000} />}
            label="Grams not ending up in a landfill"
            colorClass="bg-red-50 text-red-400"
          />
        </div>

        <section>
          <div className="mb-3">
            <h2 className="text-xl font-bold text-gray-900">Impact Summary</h2>
            <p className="text-sm text-gray-500">
              Track your performance changes and environmental progress over time
            </p>
          </div>
          <div className="rounded-xl border-2 border-gray-200 bg-white p-4 md:p-5">
            <div className="mb-3">
              <h3 className="text-lg font-semibold text-gray-800">
                Monthly Usage
              </h3>
            </div>

            <div className="h-[220px] w-full md:h-[255px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 6, right: 6, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#F3F4F6"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#9CA3AF", fontSize: 11 }}
                    dy={8}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#9CA3AF", fontSize: 11 }}
                  />
                  <Tooltip
                    cursor={{ fill: "#F9FAFB" }}
                    content={<CustomTooltip stats={activeStats} />}
                  />
                  <Bar
                    dataKey="total"
                    name="Monthly impact"
                    fill="#14B8A6"
                    barSize={32}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
