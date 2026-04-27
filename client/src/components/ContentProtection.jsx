import React, { useEffect } from 'react';

/**
 * ContentProtection Component
 * Prevents common ways of downloading or copying content from the website.
 * - Disables Right-Click (except on inputs)
 * - Disables Keyboard Shortcuts (Ctrl+S, Ctrl+U, F12, DevTools)
 * - Disables Image/Video Dragging
 * - Disables Text Selection (except on inputs)
 */
const ContentProtection = () => {
  useEffect(() => {
    const handleContextMenu = (e) => {
      // Allow context menu only on inputs and textareas
      const isInput = e.target.tagName === 'INPUT' || 
                     e.target.tagName === 'TEXTAREA' || 
                     e.target.isContentEditable;
      if (!isInput) {
        e.preventDefault();
      }
    };

    const handleKeyDown = (e) => {
      // Detect specific key combinations
      const isCtrl = e.ctrlKey || e.metaKey; // Meta for Mac
      const isShift = e.shiftKey;

      // Block Save (Ctrl+S), View Source (Ctrl+U), DevTools (F12, Ctrl+Shift+I/J/C)
      if (
        (isCtrl && e.key.toLowerCase() === 's') ||
        (isCtrl && e.key.toLowerCase() === 'u') ||
        (isCtrl && isShift && (e.key.toLowerCase() === 'i' || e.key.toLowerCase() === 'j' || e.key.toLowerCase() === 'c')) ||
        e.key === 'F12'
      ) {
        e.preventDefault();
        return false;
      }
    };

    const handleDragStart = (e) => {
      // Prevent dragging images or videos to save them or move them
      if (e.target.tagName === 'IMG' || e.target.tagName === 'VIDEO') {
        e.preventDefault();
      }
    };

    // Attach listeners
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('dragstart', handleDragStart);

    // Global CSS injection for deeper protection
    const style = document.createElement('style');
    style.id = 'content-protection-styles';
    style.innerHTML = `
      /* Prevent dragging of media elements */
      img, video {
        -webkit-user-drag: none !important;
        -khtml-user-drag: none !important;
        -moz-user-drag: none !important;
        -o-user-drag: none !important;
        user-drag: none !important;
        pointer-events: auto; /* Allow clicks, but not drags */
      }

      /* Disable text selection across the whole app */
      * {
        -webkit-touch-callout: none !important;
        -webkit-user-select: none !important;
        -khtml-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
      }

      /* Re-enable selection for inputs, textareas, and specific content areas */
      input, textarea, [contenteditable="true"], .selectable {
        -webkit-user-select: text !important;
        -khtml-user-select: text !important;
        -moz-user-select: text !important;
        -ms-user-select: text !important;
        user-select: text !important;
      }

      /* Hide "Save Video As" and other controls in video elements */
      video::-webkit-media-controls-enclosure {
        overflow: hidden !important;
      }
      video::-webkit-media-controls-panel {
        width: calc(100% + 30px) !important; /* Hide the download button in some versions */
      }
    `;
    document.head.appendChild(style);

    return () => {
      // Cleanup
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('dragstart', handleDragStart);
      const injectedStyle = document.getElementById('content-protection-styles');
      if (injectedStyle) injectedStyle.remove();
    };
  }, []);

  return null;
};

export default ContentProtection;
