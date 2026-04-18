import React from 'react';
import { Instagram, Youtube, Linkedin, Twitter, Users, TrendingUp, CheckCircle } from 'lucide-react';
import { FaPinterest } from 'react-icons/fa';

export default function SocialProof() {
  const platforms = [
    { icon: Instagram, name: 'Instagram', color: 'from-purple-500 to-pink-500' },
    { icon: Youtube, name: 'YouTube', color: 'from-red-500 to-red-600' },
    { icon: Linkedin, name: 'LinkedIn', color: 'from-blue-600 to-blue-700' },
    { icon: Twitter, name: 'Twitter', color: 'from-sky-400 to-sky-500' },
    { icon: FaPinterest, name: 'Pinterest', color: 'from-red-600 to-red-700' }
  ];

  const stats = [
    { icon: Users, number: '10K+', label: 'Active Users' },
    { icon: TrendingUp, number: '500K+', label: 'Posts Published' },
    { icon: CheckCircle, number: '99.9%', label: 'Success Rate' }
  ];

  const platformColors = {
    'from-purple-500 to-pink-500': 'linear-gradient(135deg, rgb(139, 92, 246), rgb(236, 72, 153))',
    'from-red-500 to-red-600': 'linear-gradient(135deg, rgb(239, 68, 68), rgb(220, 38, 38))',
    'from-blue-600 to-blue-700': 'linear-gradient(135deg, rgb(37, 99, 235), rgb(29, 78, 216))',
    'from-sky-400 to-sky-500': 'linear-gradient(135deg, rgb(56, 189, 248), rgb(14, 165, 233))',
    'from-red-600 to-red-700': 'linear-gradient(135deg, rgb(220, 38, 38), rgb(185, 28, 28))'
  };

  return (
    <section id="platforms" className="landing-section bg-gray-50">
      <div className="landing-container">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            One Platform,
            <span className="gradient-text"> All Networks</span>
          </h2>
          <p className="text-xl text-gray-600">
            Connect with billions of users across the world's most popular social media platforms.
          </p>
        </div>

        {/* Platform Logos */}
        <div className="platform-grid max-w-4xl mx-auto mb-20">
          {platforms.map((platform, index) => {
            const Icon = platform.icon;
            return (
              <div
                key={index}
                className="platform-logo animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div 
                  className="w-full h-full flex items-center justify-center rounded-2xl"
                  style={{ background: platformColors[platform.color] }}
                >
                  <Icon className="w-8 h-8 text-white" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="stat-card animate-scale-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <Icon className="w-12 h-12 mx-auto mb-4" style={{ color: '#8E4CFB' }} />
                <div className="stat-number">{stat.number}</div>
                <div className="text-gray-600 text-lg mt-2">{stat.label}</div>
              </div>
            );
          })}
        </div>

        {/* Testimonial */}
        <div className="max-w-4xl mx-auto bg-white border-2 border-gray-200 rounded-2xl p-8 md:p-12 shadow-sm">
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-white" style={{ background: '#8E4CFB' }}>
                JD
              </div>
            </div>

            {/* Testimonial Content */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start mb-3">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-lg text-gray-600 mb-4 italic">
                "QuickPost has completely transformed my social media workflow. What used to take me hours now takes minutes. The ROI is incredible!"
              </p>
              <div>
                <div className="text-gray-900 font-semibold">Jordan Davis</div>
                <div className="text-gray-500 text-sm">Digital Marketing Manager</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
