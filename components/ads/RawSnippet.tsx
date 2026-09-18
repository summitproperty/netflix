"use client";

import { useEffect, useRef } from "react";

interface RawSnippetProps {
  html: string;
}

/**
 * Renders a third-party HTML/JS snippet exactly as given, including any
 * inline <script> tags. Scripts inserted through plain innerHTML never
 * execute in the browser, so each one is recreated as a real <script>
 * element here — this is the standard way to mount a third-party ad/widget
 * embed without a library.
 *
 * `html` only ever comes from operator-supplied configuration
 * (AD_CONFIG.banner.snippet in config/ads.ts), never from viewer input.
 */
export function RawSnippet({ html }: RawSnippetProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = html;

    const scripts = Array.from(container.querySelectorAll("script"));
    for (const oldScript of scripts) {
      const newScript = document.createElement("script");
      for (const attribute of Array.from(oldScript.attributes)) {
        newScript.setAttribute(attribute.name, attribute.value);
      }
      newScript.textContent = oldScript.textContent;
      oldScript.replaceWith(newScript);
    }

    return () => {
      container.innerHTML = "";
    };
  }, [html]);

  return <div ref={containerRef} />;
}

export default RawSnippet;
