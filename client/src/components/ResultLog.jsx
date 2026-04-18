import React from 'react';
import { CheckCircle2, XCircle, Instagram, Youtube, ExternalLink, AlertTriangle } from 'lucide-react';

function ResultLog({ results }) {
  const platforms = [
    {
      name: 'Instagram',
      key: 'instagram',
      icon: Instagram,
      color: 'from-purple-500 to-pink-500',
      data: results.instagram
    },
    {
      name: 'YouTube',
      key: 'youtube',
      icon: Youtube,
      color: 'from-red-500 to-red-600',
      data: results.youtube
    }
  ];

  const successCount = platforms.filter(p => p.data?.success).length;
  const totalCount = platforms.length;

  return (
    <div className="space-y-4">
      {/* Summary Header */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-bold text-white">Broadcast Results</h3>
          <div className="px-4 py-2 bg-white/10 rounded-full">
            <span className="text-sm font-medium">
              {successCount} / {totalCount} Successful
            </span>
          </div>
        </div>

        {/* Overall Status */}
        {successCount === totalCount ? (
          <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
            <CheckCircle2 className="w-6 h-6 text-green-400" />
            <div>
              <p className="font-semibold text-green-300">All platforms posted successfully!</p>
              <p className="text-sm text-green-400/80">Your content is now live on Instagram and YouTube.</p>
            </div>
          </div>
        ) : successCount > 0 ? (
          <div className="flex items-center gap-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <AlertTriangle className="w-6 h-6 text-yellow-400" />
            <div>
              <p className="font-semibold text-yellow-300">Partially successful</p>
              <p className="text-sm text-yellow-400/80">Some platforms posted successfully, others failed.</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <XCircle className="w-6 h-6 text-red-400" />
            <div>
              <p className="font-semibold text-red-300">All platforms failed</p>
              <p className="text-sm text-red-400/80">Please check your credentials and try again.</p>
            </div>
          </div>
        )}
      </div>

      {/* Platform Results */}
      <div className="grid md:grid-cols-2 gap-4">
        {platforms.map((platform) => {
          const Icon = platform.icon;
          const isSuccess = platform.data?.success;

          return (
            <div key={platform.key} className="glass-card p-6 hover:scale-[1.02] transition-transform">
              {/* Platform Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-3 bg-gradient-to-br ${platform.color} rounded-xl`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-lg text-white">{platform.name}</h4>
                  <p className="text-xs text-white/60">
                    {isSuccess ? 'Published' : 'Failed'}
                  </p>
                </div>
                <div>
                  {isSuccess ? (
                    <CheckCircle2 className="w-6 h-6 text-green-400" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-400" />
                  )}
                </div>
              </div>

              {/* Result Details */}
              {isSuccess ? (
                <div className="space-y-3">
                  <p className="text-sm text-green-300 bg-green-500/10 p-3 rounded-lg border border-green-500/20">
                    {platform.data.message}
                  </p>

                  {/* Instagram Details */}
                  {platform.key === 'instagram' && platform.data.mediaId && (
                    <div className="p-3 bg-white/5 rounded-lg">
                      <p className="text-xs text-white/60 mb-1">Media ID</p>
                      <p className="text-sm font-mono text-white/90">{platform.data.mediaId}</p>
                    </div>
                  )}

                  {/* YouTube Details */}
                  {platform.key === 'youtube' && (
                    <div className="space-y-2">
                      {platform.data.videoId && (
                        <div className="p-3 bg-white/5 rounded-lg">
                          <p className="text-xs text-white/60 mb-1">Video ID</p>
                          <p className="text-sm font-mono text-white/90">{platform.data.videoId}</p>
                        </div>
                      )}
                      {platform.data.shortsUrl && (
                        <a
                          href={platform.data.shortsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors group"
                        >
                          <span className="text-sm text-white/90">View on YouTube</span>
                          <ExternalLink className="w-4 h-4 text-white/60 group-hover:text-primary transition-colors" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                    <p className="text-sm text-red-300 font-medium mb-1">Error</p>
                    <p className="text-xs text-red-400/90">
                      {platform.data?.error || 'Unknown error occurred'}
                    </p>
                  </div>

                  {platform.data?.errorCode && (
                    <div className="p-2 bg-white/5 rounded">
                      <p className="text-xs text-white/60">
                        Error Code: <span className="font-mono text-white/80">{platform.data.errorCode}</span>
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ResultLog;
