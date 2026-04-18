import React from 'react';
import { Link } from 'react-router-dom';
import { Link2, PenTool, Rocket, ArrowRight } from 'lucide-react';

export default function HowItWorks() {
  const steps = [
    {
      number: '01',
      icon: Link2,
      title: 'Connect Your Accounts',
      description: 'Link your Instagram, YouTube, LinkedIn, Twitter, and Pinterest accounts in seconds.',
      color: 'purple'
    },
    {
      number: '02',
      icon: PenTool,
      title: 'Create Your Content',
      description: 'Write your post, upload media, and customize for each platform with AI assistance.',
      color: 'purple'
    },
    {
      number: '03',
      icon: Rocket,
      title: 'Broadcast Instantly',
      description: 'Hit publish and watch your content go live across all platforms simultaneously.',
      color: 'purple'
    }
  ];

  return (
    <section id="how-it-works" className="landing-section bg-white relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-purple-50 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-purple-100 rounded-full blur-3xl"></div>

      <div className="landing-container relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            How It <span className="gradient-text">Works</span>
          </h2>
          <p className="text-xl text-gray-600">
            Get started in minutes. Our simple three-step process makes social media broadcasting effortless.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid md:grid-cols-3 gap-8 md:gap-12 relative">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="relative">
                {/* Connector Line (hidden on mobile) */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-20 left-full w-full h-0.5 bg-gradient-to-r from-purple-500 to-transparent" 
                       style={{ zIndex: 0 }}></div>
                )}

                {/* Step Card */}
                <div className="relative z-10 text-center animate-fade-in-up" style={{ animationDelay: `${index * 0.2}s` }}>
                  {/* Step Number */}
                  <div className="text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-purple-200 to-purple-300 mb-4">
                    {step.number}
                  </div>

                  {/* Icon */}
                  <div 
                    className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-6"
                    style={{
                      background: '#8E4CFB',
                      boxShadow: '0 0 20px rgba(142, 76, 251, 0.5)'
                    }}
                  >
                    <Icon className="w-10 h-10 text-white" />
                  </div>

                  {/* Title */}
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">{step.title}</h3>

                  {/* Description */}
                  <p className="text-gray-600 leading-relaxed">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <Link
            to="/login"
            className="inline-flex items-center space-x-2 btn-glow text-white font-semibold px-8 py-4 rounded-lg text-lg group"
          >
            <span>Start Broadcasting Now</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}
