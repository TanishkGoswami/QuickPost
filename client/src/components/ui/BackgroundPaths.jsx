"use client";

import React from "react";
import { motion } from "framer-motion";

export function FloatingPaths({ position }) {
  const paths = React.useMemo(() => 
    Array.from({ length: 12 }, (_, i) => ({
      id: i,
      d: `M ${-100 + i * 60} ${-100} C ${200 + i * 40} ${100} ${400 - i * 40} ${200} ${800 + i * 60} ${450}`,
      width: 0.5 + i * 0.08,
      duration: 20 + Math.random() * 15,
    })), []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <svg
        className="w-full h-full text-arc"
        viewBox="0 0 800 450"
        fill="none"
        preserveAspectRatio="none"
        style={{ willChange: "transform" }}
      >
        <title>Background Paths</title>
        {paths.map((path) => (
          <motion.path
            key={path.id}
            d={path.d}
            stroke="#F37338"
            strokeWidth={path.width * 4}
            strokeOpacity={0.25 + path.id * 0.015}
            initial={{ pathLength: 0.4, opacity: 0.9 }}
            animate={{
              pathLength: 1,
              opacity: [0.7, 0.9, 0.7],
              pathOffset: [0, 1],
            }}
            transition={{
              duration: path.duration,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
          />
        ))}
      </svg>
    </div>
  );
}
