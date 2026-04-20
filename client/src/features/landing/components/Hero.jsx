import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Play, Instagram, Youtube, Linkedin, Twitter, Share2 } from 'lucide-react';
import '../../../styles/landing.css';

export default function Hero() {
  return (
    <section className="hero-bg min-h-screen flex items-center justify-center relative overflow-hidden pt-20">
      {/* Floating Icons */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <Instagram className="absolute top-20 left-10 w-12 h-12 text-purple-300 opacity-30 animate-float" style={{ animationDelay: '0s' }} />
        <Youtube className="absolute top-40 right-20 w-14 h-14 text-pink-300 opacity-30 animate-float" style={{ animationDelay: '1s' }} />
        <Linkedin className="absolute bottom-40 left-20 w-10 h-10 text-cyan-300 opacity-30 animate-float" style={{ animationDelay: '2s' }} />
        <Twitter className="absolute bottom-20 right-32 w-12 h-12 text-purple-300 opacity-30 animate-float" style={{ animationDelay: '0.5s' }} />
        <Share2 className="absolute top-1/3 right-10 w-10 h-10 text-pink-300 opacity-30 animate-float" style={{ animationDelay: '1.5s' }} />
      </div>

      <div className="landing-container relative z-10">
        <div className="text-center max-w-5xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 bg-white border-2 border-purple-100 px-4 py-2 rounded-full mb-8 animate-fade-in-up shadow-sm">
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#8E4CFB' }}></span>
            <span className="text-sm text-gray-700 font-medium">Now supporting 5+ major platforms</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-gray-900 mb-6 leading-tight animate-fade-in-up">
            Broadcast Your Content
            <br />
            <span className="gradient-text">Everywhere, Instantly</span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            Post once, reach millions. GAP Social-pilot automatically publishes your content to Instagram, YouTube, LinkedIn, Twitter, and Pinterest—all at the same time.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <Link
              to="/login"
              className="btn-glow text-white font-semibold px-8 py-4 rounded-lg text-lg flex items-center space-x-2 group w-full sm:w-auto justify-center"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <button className="bg-white border-2 border-gray-200 text-gray-700 font-semibold px-8 py-4 rounded-lg text-lg flex items-center space-x-2 hover:border-gray-300 hover:shadow-md transition-all w-full sm:w-auto justify-center">
              <Play className="w-5 h-5" />
              <span>Watch Demo</span>
            </button>
          </div>

          {/* Dashboard Preview Card */}
          <div className="bg-white border-2 border-gray-200 rounded-2xl p-2 max-w-4xl mx-auto animate-scale-in shadow-xl" style={{ animationDelay: '0.6s' }}>
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 md:p-8">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              
              <div className="space-y-4">
                {/* Composer Preview */}
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="h-3 bg-gray-300 rounded w-1/4 mb-3"></div>
                  <div className="h-2 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-2 bg-gray-200 rounded w-3/4"></div>
                </div>

                {/* Platform Selector Preview */}
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-lime-500 flex items-center justify-center">
                    <Instagram className="w-6 h-6 text-white" />
                  </div>
                  <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center">
                    <Youtube className="w-6 h-6 text-white" />
                  </div>
                  <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
                    <Linkedin className="w-6 h-6 text-white" />
                  </div>
                  <div className="w-12 h-12 rounded-full bg-sky-500 flex items-center justify-center">
                    <Twitter className="w-6 h-6 text-white" />
                  </div>
                </div>

                {/* Publish Button Preview */}
                <div className="rounded-lg h-12 flex items-center justify-center" style={{ background: '#8E4CFB' }}>
                  <span className="text-white font-semibold">Publish to All Platforms</span>
                </div>
              </div>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-gray-500 text-sm animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>No credit card required</span>
            </div>
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Free forever plan</span>
            </div>
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
