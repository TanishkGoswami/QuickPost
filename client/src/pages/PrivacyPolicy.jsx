import React from 'react';
import { Link } from 'react-router-dom';
import { LandingNav } from '../features/landing';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <LandingNav />
      
      <main className="flex-grow container mx-auto px-6 py-24 max-w-4xl">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
          <Link to="/" className="text-violet-600 hover:text-violet-700 font-medium mb-8 inline-flex items-center gap-2">
            ← Back to Home
          </Link>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
          
          <div className="prose prose-violet max-w-none text-gray-600 space-y-6">
            <p className="text-lg">Last Updated: April 18, 2026</p>
            
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
              <p>
                QuickPost ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and share information about you when you use our website and services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
              <p>We collect information you provide directly to us, such as when you create an account, connect social media profiles, or contact us for support.</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Account Information:</strong> Name, email address, and profile picture.</li>
                <li><strong>Connected Accounts data:</strong> Authentication tokens (OAuth) for platforms like YouTube, Facebook, Instagram, Pinterest, and Bluesky.</li>
                <li><strong>Content:</strong> Media files and captions you upload for broadcasting.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Use of Google and YouTube Data</h2>
              <p>
                QuickPost uses YouTube API Services to allow you to upload videos to your YouTube channel. By using our service, you agree to be bound by the <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer" className="text-violet-600 hover:underline">YouTube Terms of Service</a> and the <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-violet-600 hover:underline">Google Privacy Policy</a>.
              </p>
              <p>
                We only access data that is specifically required to provide our core broadcasting functionality. You can revoke QuickPost's access to your data at any time via the <a href="https://security.google.com/settings/security/permissions" target="_blank" rel="noopener noreferrer" className="text-violet-600 hover:underline">Google security settings page</a>.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Data Security</h2>
              <p>
                We implement a variety of security measures to maintain the safety of your personal information. Access tokens are stored securely and encrypted in our database. We do not sell or share your personal information with third parties for marketing purposes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Changes to This Policy</h2>
              <p>
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy, please contact us at support@quickpost.app.
              </p>
            </section>
          </div>
        </div>
      </main>

      <footer className="bg-white py-8 border-t border-gray-100">
        <div className="container mx-auto px-6 text-center text-gray-500 text-sm">
          © 2026 QuickPost. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
