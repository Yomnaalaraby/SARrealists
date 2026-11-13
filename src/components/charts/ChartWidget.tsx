'use client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

const polarizationData = [
  { name: 'Pre-Fire', HH: -12, HV: -18 },
  { name: 'Post-Fire', HH: -4, HV: -25 },
];

const subsidenceData = [
  { distance: 0, subsidence: 0 },
  { distance: 15, subsidence: -12 },
  { distance: 30, subsidence: -28 },
  { distance: 45, subsidence: -45 },
  { distance: 60, subsidence: -30 },
  { distance: 75, subsidence: -10 },
  { distance: 90, subsidence: 0 },
];

export function PolarizationChart() {
  return (
    // تم تغيير الخلفية لتكون شفافة والحدود حمراء خفيفة
    <div className="bg-black/20 backdrop-blur-md p-4 rounded-xl border border-red-500/20 text-white shadow-xl">
      <h3 className="text-sm font-bold mb-3 text-red-400 flex items-center gap-2">
        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
        Backscatter Response (dB)
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={polarizationData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} />
          <YAxis stroke="#9CA3AF" fontSize={12} />
          <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }} />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          <Bar dataKey="HH" fill="#EF4444" radius={[4, 4, 0, 0]} /> {/* أحمر */}
          <Bar dataKey="HV" fill="#F97316" radius={[4, 4, 0, 0]} /> {/* برتقالي */}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SubsidenceChart() {
  return (
    // تم تغيير الخلفية لتكون شفافة والحدود برتقالية خفيفة
    <div className="bg-black/20 backdrop-blur-md p-4 rounded-xl border border-orange-500/20 text-white shadow-xl">
      <h3 className="text-sm font-bold mb-3 text-orange-400 flex items-center gap-2">
        <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
        Central Valley Subsidence Profile
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={subsidenceData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="distance" label={{ value: 'Distance (km)', position: 'insideBottom', offset: -5, fill: '#9CA3AF', fontSize: 10 }} stroke="#9CA3AF" fontSize={12} />
          <YAxis label={{ value: 'mm', angle: -90, position: 'insideLeft', fill: '#9CA3AF', fontSize: 10 }} stroke="#9CA3AF" fontSize={12} />
          <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }} />
          <Line type="monotone" dataKey="subsidence" stroke="#F97316" strokeWidth={3} dot={{ fill: '#F97316', r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}