import React from 'react';
import { Link } from 'react-router-dom';
import { LandingNav } from '../features/landing';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <LandingNav />
      
      <main className="flex-grow container mx-auto px-6 py-24 max-w-4xl">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
          <Link to="/" className="text-violet-600 hover:text-violet-700 font-medium mb-8 inline-flex items-center gap-2">
            ← Back to Home
          </Link>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms of Service</h1>
          
          <div className="prose prose-violet max-w-none text-gray-600 space-y-6">
            <p className="text-lg">Last Updated: April 18, 2026</p>
            
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p>
                By accessing or using QuickPost, you agree to be bound by these Terms of Service. If you do not agree to all of these terms, do not use our service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
              <p>
                QuickPost provides a platform for users to manage their social media accounts and broadcast media content to multiple platforms simultaneously, including YouTube, Facebook, Instagram, Pinterest, and Bluesky.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Responsibilities</h2>
              <p>You are responsible for:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Maintaining the confidentiality of your account credentials.</li>
                <li>All activities that occur under your account.</li>
                <li>Ensuring that the content you broadcast does not violate any local or international laws or the terms of the third-party platforms you connect to.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. YouTube API Usage</h2>
              <p>
                Our service allows you to interact with YouTube via the YouTube API. By using this functionality, you are agreeing to be bound by the <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer" className="text-violet-600 hover:underline">YouTube Terms of Service</a>. We do not store your YouTube content on our servers after it has been broadcast.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Account Termination</h2>
              <p>
                We reserve the right to suspend or terminate your account at our sole discretion, without notice, for conduct that we believe violates these Terms of Service or is harmful to other users or our business interests.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Limitation of Liability</h2>
              <p>
                QuickPost shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Contact Information</h2>
              <p>
                If you have any questions about these Terms, please contact us at terms@quickpost.app.
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
