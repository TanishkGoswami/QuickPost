"use client";

import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import React from "react";

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <main 
      className="bg-[#F3F0EE] text-[#141413] min-h-screen flex items-center justify-center relative overflow-hidden z-0"
      style={{ fontFamily: '"Sofia Sans", Arial, sans-serif' }}
    >
      {/* Ghost Watermark Text */}
      <h1 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#E8E2DA] font-bold select-none -z-10 pointer-events-none"
        style={{ fontSize: 'min(35vw, 400px)', lineHeight: 0.8, letterSpacing: '-0.04em' }}
        aria-hidden="true"
      >
        404
      </h1>

      <div className="container mx-auto px-6 relative z-10 flex flex-col items-center">
        
        {/* Eyebrow Label */}
        <div className="flex items-center gap-2 mb-8 uppercase text-[#696969] text-[14px]" style={{ fontWeight: 700, letterSpacing: '0.04em' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#F37338]"></span>
          PAGE NOT FOUND
        </div>

        {/* Circular Portrait with Orbit & Satellite */}
        <div className="relative mb-8 md:mb-12">
          {/* Orbital Arc (Decorative SVG) */}
          <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[160%] h-[160%] -z-10 text-[#F37338]" viewBox="0 0 100 100" fill="none">
            <path d="M 0 50 C 20 0, 80 0, 100 50" stroke="currentColor" strokeWidth="0.2" vectorEffect="non-scaling-stroke" strokeDasharray="3 3" className="opacity-80" />
            <path d="M -10 60 Q 50 150 110 60" stroke="currentColor" strokeWidth="0.3" vectorEffect="non-scaling-stroke" fill="transparent" className="opacity-40" />
          </svg>

          {/* Portrait Circle */}
          <div className="w-[260px] h-[260px] md:w-[320px] md:h-[320px] rounded-full overflow-hidden shadow-[0px_24px_48px_rgba(0,0,0,0.08)] bg-white relative">
            <img 
              src="https://cdn.dribbble.com/users/285475/screenshots/2083086/dribbble_1.gif" 
              alt="Lost animation"
              className="w-full h-full object-cover object-center translate-y-2 scale-105"
            />
            {/* Soft inner vignette mimicking the edge-fade */}
            <div className="absolute inset-0 rounded-full shadow-[inset_0_0_40px_rgba(243,240,238,0.15)] pointer-events-none"></div>
          </div>

          {/* Satellite Micro-CTA */}
          <button 
            onClick={() => navigate("/")}
            className="absolute bottom-1 -right-1 md:bottom-4 md:-right-2 w-[56px] h-[56px] bg-white rounded-full flex items-center justify-center hover:scale-[1.05] transition-transform duration-300 shadow-[0_8px_16px_rgba(0,0,0,0.06)] group z-20 outline-none focus-visible:ring-2 focus-visible:ring-[#141413] border border-[#F3F0EE]/80 pointer-events-auto"
            aria-label="Return home"
          >
            <ArrowRight className="text-[#141413] w-6 h-6 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Content Wrapper */}
        <div className="max-w-md text-center flex flex-col items-center">
          <h2 className="text-[#141413] text-3xl md:text-4xl mb-4" style={{ fontWeight: 500, letterSpacing: '-0.02em' }}>
            Looks like you're lost
          </h2>
          <p className="text-[#141413] text-base md:text-lg mb-10 px-4" style={{ fontWeight: 450, lineHeight: 1.4 }}>
            The page you are looking for has drifted out of orbit. We can help you navigate back to familiar territory.
          </p>

          {/* Primary CTA (Ink Pill) */}
          <button 
            onClick={() => navigate("/")}
            className="bg-[#141413] text-[#F3F0EE] border-[1.5px] border-[#141413] rounded-[20px] px-[24px] py-[6px] text-[16px] active:scale-[0.98] transition-all hover:bg-[#141413]/90 leading-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F3F0EE] focus-visible:ring-[#141413]"
            style={{ fontWeight: 500, letterSpacing: '-0.02em' }}
          >
            Return to Dashboard
          </button>
        </div>

      </div>
    </main>
  );
}
