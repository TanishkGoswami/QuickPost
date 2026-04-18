import React from 'react';
import { Instagram, Youtube, Github, Heart } from 'lucide-react';

function Footer() {
  return (
    <footer className="relative z-10 px-6 py-8 border-t border-white/10">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Platform Icons */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-white/60">
              <span>Supports:</span>
              <div className="flex gap-2">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                  <Instagram className="w-4 h-4 text-white" />
                </div>
                <div className="p-2 bg-red-500 rounded-lg">
                  <Youtube className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="flex items-center gap-2 text-sm text-white/60">
            <span>Made with</span>
            <Heart className="w-4 h-4 text-red-500 fill-red-500 animate-pulse" />
            <span>by Priyansh Gour</span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-4">
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-white/60 hover:text-white transition-colors"
            >
              <Github className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
