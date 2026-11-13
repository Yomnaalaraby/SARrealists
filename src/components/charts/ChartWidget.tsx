'use client';
import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { jsonUrl } from '@/lib/nisarData';

// ===== Fallback (لو الـ fetch فشل لأي سبب) =====
const MOCK_POLARIZATION = [
  { name: 'Pre-Fire', HH: -7.33, HV: -15.68 },
  { name: 'Post-Fire', HH: -8.28, HV: -18.29 },
];

const MOCK_SUBSIDENCE = [
  { distance: 0, subsidence: 0 },
  { distance: 15, subsidence: -12 },
  { distance: 30, subsidence: -28 },
  { distance: 45, subsidence: -45 },
  { distance: 60, subsidence: -30 },
  { distance: 75, subsidence: -10 },
  { distance: 90, subsidence: 0 },
];

// ===== Helper Functions =====
function round2(n: number) { return Math.round(n * 100) / 100; }
function round1(n: number) { return Math.round(n * 10) / 10; }
function formatDate(d: string) {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const [y, m, day] = d.split('-');
  return `${months[parseInt(m) - 1]} ${parseInt(day)}, ${y}`;
}

// ✅ Hook الحقيقي (المعدل)
export function useCaliforniaRealData() {
  const [polarizationData, setPolarizationData] = useState(MOCK_POLARIZATION);
  const [subsidenceData, setSubsidenceData] = useState(MOCK_SUBSIDENCE);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<'real' | 'mock'>('mock');

  useEffect(() => {
    let cancelled = false;
    fetch(jsonUrl('california', 'timeseries/points.json'))
      .then(r => { if (!r.ok) throw new Error('fetch failed'); return r.json(); })
      .then(points => {
        if (cancelled) return;

        const eaton = points.find((p: any) => p.id === 'cal_eaton_canyon');
        if (eaton) {
          // ✅ دالة بتدور على آخر index فيه قيمة مش null
          const findLastValid = (arr: (number | null)[]) => {
            for (let i = arr.length - 1; i >= 0; i--) {
              if (arr[i] !== null) return i;
            }
            return 0;
          };

          const firstIdx = 0;
          const lastValidIdx = findLastValid(eaton.hh_db); // ← هنا الحل

          setPolarizationData([
            { 
              name: 'Pre-Fire (Nov 2025)', 
              HH: round2(eaton.hh_db[firstIdx]!), 
              HV: round2(eaton.hv_db[firstIdx]!) 
            },
            { 
              name: `Post-Fire (${formatDate(eaton.dates[lastValidIdx])})`, 
              HH: round2(eaton.hh_db[lastValidIdx]!), 
              HV: round2(eaton.hv_db[lastValidIdx]!) 
            },
          ]);
          setSource('real');
        }

        // 📉 Subsidence profile من disp_mm الحقيقي
        if (eaton?.disp_mm) {
          const validDisp = eaton.disp_mm
            .map((v: number | null, i: number) => ({ v, date: eaton.dates[i] }))
            .filter((x: any) => x.v !== null);
          const profile = validDisp.map((x: any, i: number) => ({
            distance: i * 15,
            subsidence: round1(x.v),
          }));
          setSubsidenceData(profile);
        }
        setLoading(false);
      })
      .catch(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, []);

  return { polarizationData, subsidenceData, loading, source };
}

// ===== المكون 1: Polarization Chart =====
export function PolarizationChart() {
  const { polarizationData, source } = useCaliforniaRealData();

  return (
    <div className="bg-black/20 backdrop-blur-md p-4 rounded-xl border border-red-500/20 text-white shadow-xl">
      <h3 className="text-sm font-bold mb-3 text-red-400 flex items-center gap-2">
        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
        Backscatter Response (dB)
        {source === 'real' && (
          <span className="ml-auto text-[10px] px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full border border-green-500/30">
            ● NISAR Real Data
          </span>
        )}
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={polarizationData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="name" stroke="#9CA3AF" fontSize={11} />
          <YAxis stroke="#9CA3AF" fontSize={12} domain={[-22, 0]} />
          <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.85)', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }} />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          <Bar dataKey="HH" fill="#EF4444" radius={[4, 4, 0, 0]} />
          <Bar dataKey="HV" fill="#F97316" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <p className="text-[10px] text-gray-500 mt-2 leading-relaxed">
        Eaton Canyon, LA — HV drops ~2.6 dB after fire (canopy loss reduces volume scattering).
      </p>
    </div>
  );
}

// ===== المكون 2: Subsidence Chart =====
export function SubsidenceChart() {
  const { subsidenceData, source } = useCaliforniaRealData();

  return (
    <div className="bg-black/20 backdrop-blur-md p-4 rounded-xl border border-orange-500/20 text-white shadow-xl">
      <h3 className="text-sm font-bold mb-3 text-orange-400 flex items-center gap-2">
        <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
        Central Valley Subsidence Profile
        {source === 'real' && (
          <span className="ml-auto text-[10px] px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full border border-green-500/30">
            ● NISAR Real Data
          </span>
        )}
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={subsidenceData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="distance" label={{ value: 'Distance (km)', position: 'insideBottom', offset: -5, fill: '#9CA3AF', fontSize: 10 }} stroke="#9CA3AF" fontSize={12} />
          <YAxis label={{ value: 'mm', angle: -90, position: 'insideLeft', fill: '#9CA3AF', fontSize: 10 }} stroke="#9CA3AF" fontSize={12} />
          <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.85)', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }} />
          <Line type="monotone" dataKey="subsidence" stroke="#F97316" strokeWidth={3} dot={{ fill: '#F97316', r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ===== Hook لـ Nile (Soil Moisture + Subsidence حقيقي) =====
export function useNileRealData() {
  const [soilMoistureData, setSoilMoistureData] = useState<any[]>([]);
  const [subsidenceData, setSubsidenceData] = useState<any[]>([]);

  useEffect(() => {
    fetch(jsonUrl('nile', 'timeseries/points.json'))
      .then(r => r.json())
      .then(points => {
        const mansoura = points.find((p: any) => p.id === 'nile_mansoura_ag') || points[0];
        if (!mansoura) return;

        // 🌱 Soil Moisture حقيقي (sm array)
        const smData = mansoura.dates
          .map((d: string, i: number) => ({
            month: d.slice(5),
            moisture: mansoura.sm[i] !== null ? round1(mansoura.sm[i] * 100) : null,
          }))
          .filter((x: any) => x.moisture !== null);
        setSoilMoistureData(smData);

        // 📉 Subsidence حقيقي (disp_mm)
        const dispData = mansoura.dates
          .map((d: string, i: number) => ({
            month: d.slice(5),
            subsidence: mansoura.disp_mm[i] !== null ? round1(mansoura.disp_mm[i]) : null,
          }))
          .filter((x: any) => x.subsidence !== null);
        setSubsidenceData(dispData);
      });
  }, []);

  return { soilMoistureData, subsidenceData };
}

// ===== Hook لـ Himalayas (HV/HH time series حقيقي) =====
export function useHimalayaRealData() {
  const [polarizationSeries, setPolarizationSeries] = useState<any[]>([]);

  useEffect(() => {
    fetch(jsonUrl('himalayas', 'timeseries/points.json'))
      .then(r => r.json())
      .then(points => {
        const snout = points.find((p: any) => p.id === 'gangotri_snout') || points[0];
        if (!snout) return;
        const series = snout.dates.map((d: string, i: number) => ({
          month: d.slice(5),
          HH: round2(snout.hh_db[i]),
          HV: round2(snout.hv_db[i]),
        }));
        setPolarizationSeries(series);
      });
  }, []);

  return { polarizationSeries };
}