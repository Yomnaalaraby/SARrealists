'use client';
import { useState, useCallback } from 'react';
import MapComponent from '@/components/map/MapComponent';
import MapErrorBoundary from '@/components/map/MapErrorBoundary';
import HeroSection from '@/components/storytelling/HeroSection';
import CaliforniaSection from '@/components/storytelling/CaliforniaSection';
import HimalayaSection from '@/components/storytelling/HimalayaSection';
import DeltaSection from '@/components/storytelling/DeltaSection';
import Dashboard from '@/components/dashboard/Dashboard';

export default function Home() {
  const [showDashboard, setShowDashboard] = useState(false);

  const handleRegionJump = useCallback((region: string) => {
    window.dispatchEvent(new CustomEvent('flyToLocation', { detail: region }));
  }, []);

  if (showDashboard) {
    return (
      // ✅ أضفت pt-16 هنا
      <main className="relative w-full h-screen bg-black overflow-hidden pt-16">
        <div className="fixed inset-0 z-0">
          <MapErrorBoundary>
            <MapComponent showDashboard={true} />
          </MapErrorBoundary>
        </div>
        <Dashboard 
          onRegionJump={handleRegionJump} 
          onClose={() => setShowDashboard(false)} 
        />
      </main>
    );
  }

  return (
    // ✅ أضفت pt-16 هنا كمان
    <main className="relative w-full bg-black pt-16">
      <div className="fixed inset-0 z-0">
        <MapErrorBoundary>
          <MapComponent showDashboard={false} />
        </MapErrorBoundary>
      </div>

      <div className="relative z-10 w-full">
        <HeroSection />
        <div className="h-[30vh] w-full" />
        <CaliforniaSection />
        <div className="h-[30vh] w-full" />
        <HimalayaSection />
        <div className="h-[30vh] w-full" />
        <DeltaSection />
        
        <div className="h-[50vh] w-full flex flex-col items-center justify-center px-4">
          <div className="text-center max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              End of Journey
            </h2>
            <p className="text-gray-400 mb-8 text-lg">
              You&apos;ve explored California, the Himalayas, and the Nile Delta. 
              Now it&apos;s time to explore the globe freely with NISAR data.
            </p>
            <button
              onClick={() => setShowDashboard(true)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-4 px-8 rounded-xl flex items-center justify-center gap-3 mx-auto shadow-lg shadow-purple-600/30 transition-all cursor-pointer hover:scale-105"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Launch Mission Control Dashboard</span>
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
