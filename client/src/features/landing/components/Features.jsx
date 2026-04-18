import React from 'react';
import { Share2, Sliders, BarChart3, Zap, CheckCircle, Clock } from 'lucide-react';

export default function Features() {
  const features = [
    {
      icon: Share2,
      title: 'Multi-Platform Posting',
      description: 'Post to Instagram, YouTube, LinkedIn, Twitter, and Pinterest simultaneously with a single click.',
      color: 'purple',
      highlights: ['5+ Platforms', 'One Click', 'Real-time']
    },
    {
      icon: Sliders,
      title: 'Smart Customization',
      description: 'Customize captions, hashtags, and media for each platform automatically while keeping your brand voice.',
      color: 'purple',
      highlights: ['Auto-optimize', 'Brand Safe', 'Platform-specific']
    },
    {
      icon: BarChart3,
      title: 'Real-Time Analytics',
      description: 'Track engagement, reach, and performance across all platforms from one unified dashboard.',
      color: 'purple',
      highlights: ['Unified Dashboard', 'Live Stats', 'Deep Insights']
    }
  ];

  const benefits = [
    { icon: Zap, text: 'Save 10+ hours per week' },
    { icon: CheckCircle, text: 'Consistent posting schedule' },
    { icon: Clock, text: 'Schedule posts in advance' }
  ];

  return (
    <section id="features" className="landing-section bg-gray-50 relative">
      <div className="landing-container">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Everything You Need to
            <span className="gradient-text"> Go Viral</span>
          </h2>
          <p className="text-xl text-gray-600">
            Powerful features designed to amplify your social media presence and save you time.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="bg-white border-2 border-gray-200 rounded-2xl p-8 feature-card group hover:border-purple-200 hover:shadow-xl"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Icon */}
                <div 
                  className="w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"
                  style={{
                    background: '#8E4CFB',
                    boxShadow: '0 0 20px rgba(142, 76, 251, 0.5)'
                  }}
                >
                  <Icon className="w-8 h-8 text-white" />
                </div>

                {/* Title */}
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{feature.title}</h3>

                {/* Description */}
                <p className="text-gray-600 mb-6 leading-relaxed">{feature.description}</p>

                {/* Highlights */}
                <div className="flex flex-wrap gap-2">
                  {feature.highlights.map((highlight, i) => (
                    <span
                      key={i}
                      className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-700 border border-gray-200"
                    >
                      {highlight}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Benefits Bar */}
        <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 shadow-sm">
          <div className="grid md:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#8E4CFB' }}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-gray-700 font-medium">{benefit.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
