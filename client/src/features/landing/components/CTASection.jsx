"use client";

import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { FloatingPaths } from "../../../components/ui/BackgroundPaths";

import { useAuth } from "../../../context/AuthContext";

export default function CTASection() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <section
      className="landing-section"
      style={{
        padding: "clamp(60px, 10vh, 100px) 24px",
        background: "var(--canvas)",
      }}
    >
      <div className="mx-auto max-w-[1040px] relative">
        <div className="relative flex flex-col md:flex-row items-center justify-between gap-8 p-10 md:p-14 rounded-[32px] border-2 border-dashed border-ink/5 bg-white shadow-[0_32px_64px_-16px_rgba(20,20,19,0.06)] overflow-hidden">
          {/* Background Paths */}
          <div className="absolute inset-0 z-0 opacity-80">
            <FloatingPaths position={1} />
            <FloatingPaths position={-1} />
          </div>

          <div className="max-w-xl text-center md:text-left relative z-10">
            {/* <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-arc/10 text-arc text-xs font-bold uppercase tracking-wider mb-4">
              <Sparkles size={14} />
              <span>Ready to start?</span>
            </div> */}

            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-ink mb-4 leading-tight">
              Broadcast your story <br className="hidden md:block" />
              <span className="text-arc">everywhere</span> today.
            </h2>

            <p className="text-base md:text-lg text-slate font-medium max-w-md mx-auto md:mx-0">
              Join 2,000+ creators who use GAP Social‑pilot to reach their
              audience on every platform.
            </p>
          </div>

          <div className="flex flex-col items-center md:items-end gap-4 shrink-0 relative z-10">
            <button
              onClick={() =>
                navigate(isAuthenticated ? "/dashboard" : "/login")
              }
              className="group flex h-14 items-center justify-center gap-2 rounded-full px-8 text-base font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] shadow-2xl border-none"
              style={{
                backgroundImage: 'url("/download (2).jpg")',
                backgroundSize: "cover",
                backgroundPosition: "20% 50%",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                boxShadow:
                  "0 0 20px rgba(255, 255, 255, 0.1), 0 12px 40px rgba(0, 0, 0, 0.3)",
              }}
            >
              {isAuthenticated ? "Go to Dashboard" : "Get started"}
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>

        {/* Decorative background element */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-arc/5 rounded-full blur-3xl -z-10" />
        <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-ink/5 rounded-full blur-[100px] -z-10" />
      </div>
    </section>
  );
}
