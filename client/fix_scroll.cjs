const fs = require('fs');

try {
  let content = fs.readFileSync('src/components/ComposerModal.jsx', 'utf8');

  // 1. Add scrollRef
  content = content.replace(
    'const activeId = activePlatform || selectedChannels[0] || null;',
    'const activeId = activePlatform || selectedChannels[0] || null;\n  const scrollRef = useRef(null);'
  );

  // 2. Replace invocations
  content = content.replace(/<PreviewMediaContent \/>/g, '{renderPreviewMediaContent()}');
  content = content.replace(/<PreviewMediaContent forceRatio="([^"]+)" \/>/g, '{renderPreviewMediaContent("$1")}');

  // 3. Replace the component declaration
  const oldBlockRegex = /  \/\* ── INTERNAL COMPONENT: PreviewMedia ── \*\/[\s\S]*?    \);\n  };/;
  
  const replacementFunc = `  /* ── INTERNAL COMPONENT: PreviewMedia ── */
  const renderPreviewMediaContent = (forceRatio) => {
    if (!mediaUrls || mediaUrls.length === 0) {
      return (
        <div
          className={\`w-full \${forceRatio || currentAspect} flex flex-col items-center justify-center bg-gray-100\`}
        >
          <ImageIcon className="w-8 h-8 text-gray-300 mb-1" />
          <span className="text-[10px] text-gray-400">No media yet</span>
        </div>
      );
    }

    return (
      <div
        className={\`relative w-full \${forceRatio || currentAspect} bg-gray-900 group overflow-hidden\`}
      >
        <div
          className="flex w-full h-full overflow-x-auto snap-x snap-mandatory no-scrollbar"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          onScroll={(e) => {
            const index = Math.round(e.target.scrollLeft / e.target.clientWidth);
            if (index !== activeMediaIndex) setActiveMediaIndex(index);
          }}
          ref={scrollRef}
        >
          {mediaUrls.map((media) => (
            <div key={media.id} className="w-full h-full flex-shrink-0 snap-center relative bg-black/10">
              {media.type === "image" ? (
                <img src={media.url} alt="Post" className="w-full h-full object-cover pointer-events-none" />
              ) : (
                <video src={media.url} className="w-full h-full object-cover pointer-events-none" muted playsInline autoPlay loop />
              )}
            </div>
          ))}
        </div>

        {mediaUrls.length > 1 && (
          <>
            {activeMediaIndex > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (scrollRef.current) {
                    const newIndex = activeMediaIndex - 1;
                    scrollRef.current.scrollTo({ left: newIndex * scrollRef.current.clientWidth, behavior: 'smooth' });
                  }
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/60 transition-all opacity-0 group-hover:opacity-100 z-10"
              >
                <ChevronLeft size={16} />
              </button>
            )}
            {activeMediaIndex < mediaUrls.length - 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (scrollRef.current) {
                    const newIndex = activeMediaIndex + 1;
                    scrollRef.current.scrollTo({ left: newIndex * scrollRef.current.clientWidth, behavior: 'smooth' });
                  }
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/60 transition-all opacity-0 group-hover:opacity-100 z-10"
              >
                <ChevronRight size={16} />
              </button>
            )}
            <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md rounded-full px-2 py-0.5 flex items-center gap-1 border border-white/10 shadow-lg z-10">
              <ImageIcon className="w-2.5 h-2.5 text-white" />
              <span className="text-[10px] font-bold text-white leading-none">
                {activeMediaIndex + 1}/{mediaUrls.length}
              </span>
            </div>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 z-10">
              {mediaUrls.map((_, i) => (
                <div
                  key={i}
                  className={\`w-1 h-1 rounded-full transition-all \${
                    i === activeMediaIndex ? "bg-white scale-125" : "bg-white/40"
                  }\`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    );
  };`;

  if (!oldBlockRegex.test(content)) {
    console.error("Regex did not match the file content!");
    process.exit(1);
  }

  content = content.replace(oldBlockRegex, replacementFunc);

  fs.writeFileSync('src/components/ComposerModal.jsx', content);
  console.log("Successfully updated ComposerModal!");
} catch (err) {
  console.error(err);
  process.exit(1);
}
