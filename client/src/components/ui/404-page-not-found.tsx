"use client";

import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "./button";

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <section className="bg-white font-serif min-h-screen flex items-center justify-center p-4">
      <div className="container mx-auto">
        <div className="flex justify-center">
          <div className="w-full sm:w-10/12 md:w-8/12 text-center">
            {/* The Background GIF section with 404 text */}
            <div
              className="bg-[url(https://cdn.dribbble.com/users/285475/screenshots/2083086/dribbble_1.gif)] h-[250px] sm:h-[350px] md:h-[400px] bg-center bg-no-repeat bg-contain relative"
              aria-hidden="true"
            >
              <h1 className="absolute top-0 left-0 right-0 text-center text-black text-6xl sm:text-7xl md:text-8xl pt-6 sm:pt-8 font-bold">
                404
              </h1>
            </div>

            {/* Content Section */}
            <div className="mt-[-50px] relative z-10">
              <h3 className="text-3xl text-black sm:text-4xl font-bold mb-4 tracking-tight">
                Look like you're lost
              </h3>
              <p className="mb-8 text-slate-600 sm:text-lg font-medium">
                The page you are looking for is not available!
              </p>

              <Button
                variant="default"
                onClick={() => navigate("/")}
                className="h-12 px-8 bg-[#22c55e] hover:bg-[#16a34a] text-white rounded-md font-bold text-lg shadow-lg shadow-green-200 transition-all active:scale-95"
              >
                Go to Home
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
