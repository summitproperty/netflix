import { RawSnippet } from "@/components/ads/RawSnippet";
import { AD_CONFIG } from "@/config/ads";

/**
 * Provider ad area, between the 3 stacked video slots and the 3 bottom
 * banners in the Browse Mode dock.
 *
 * This renders ONLY an existing, legitimate, provider-issued snippet pasted
 * into AD_CONFIG.browseDock.providerArea.snippet (e.g. an ExoClick
 * popup/popunder or native tag the site's account is actually eligible for).
 * It does not implement a popup/popunder mechanism of its own, does not open
 * multiple windows at once, and does not synthesize any interaction — those
 * behaviors, if used at all, belong entirely to the provider's own script,
 * governed by the provider's own frequency/eligibility rules. Renders
 * nothing until a real snippet is configured; nothing is invented here.
 */
export function ProviderAdArea() {
  const snippet = AD_CONFIG.browseDock.providerArea.snippet.trim();
  if (!AD_CONFIG.browseDock.enabled || !snippet) return null;

  return (
    <div
      role="group"
      aria-label="Advertisement, provider area"
      className="flex max-h-16 w-full items-center justify-center overflow-hidden rounded-md border border-white/5 bg-ink-900/60"
    >
      <RawSnippet html={snippet} />
    </div>
  );
}

export default ProviderAdArea;
