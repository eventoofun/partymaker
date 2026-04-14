/**
 * Affiliate tag injection system.
 *
 * HOW TO ADD A NEW PROVIDER:
 * 1. Add an entry to PROVIDERS below.
 * 2. Set the corresponding env var in .env.local.
 * 3. That's it — tags are injected automatically on every gift item save.
 *
 * ENV VARS:
 *   AFFILIATE_TAG_AMAZON          Amazon Associates tag (e.g. "cumplefy-21")
 *   AFFILIATE_AWIN_PUBLISHER_ID   Your Awin publisher/affiliate ID
 *   AFFILIATE_AWIN_MID_ECI        Awin merchant ID for El Corte Inglés
 *   AFFILIATE_AWIN_MID_FNAC       Awin merchant ID for Fnac
 *   AFFILIATE_AWIN_MID_PCCOMP     Awin merchant ID for PcComponentes
 *   AFFILIATE_AWIN_MID_ZARA       Awin merchant ID for Zara
 *   AFFILIATE_AWIN_MID_MEDIAMARKT Awin merchant ID for MediaMarkt
 *   AFFILIATE_AWIN_MID_IKEA       Awin merchant ID for IKEA
 *   AFFILIATE_TRADEDOUBLER_ID     TradeDoubler publisher ID (for some ES retailers)
 */

interface Provider {
  key: string;
  name: string;
  domains: string[];
  /** Returns modified URL or null if env vars missing */
  injectTag: (url: URL) => URL | null;
}

function env(key: string) {
  return process.env[key];
}

/** Build an Awin deeplink redirect for the given merchant + destination URL */
function awinDeeplink(url: URL, merchantId: string): URL | null {
  const publisherId = env("AFFILIATE_AWIN_PUBLISHER_ID");
  if (!publisherId) return null;
  const deep = new URL("https://www.awin1.com/cread.php");
  deep.searchParams.set("awinmid", merchantId);
  deep.searchParams.set("awinaffid", publisherId);
  deep.searchParams.set("ued", url.toString());
  return deep;
}

const PROVIDERS: Provider[] = [
  // ── Amazon ────────────────────────────────────────────────────────────────
  {
    key: "amazon",
    name: "Amazon",
    domains: [
      "amazon.es", "amazon.com", "amazon.co.uk", "amazon.de",
      "amazon.fr", "amazon.it", "amzn.to", "amzn.eu",
    ],
    injectTag: (url) => {
      const tag = env("AFFILIATE_TAG_AMAZON");
      if (!tag) return null;
      const u = new URL(url.toString());
      u.searchParams.set("tag", tag);
      // Strip conflicting params that Amazon adds on copy
      u.searchParams.delete("linkCode");
      u.searchParams.delete("linkId");
      u.searchParams.delete("ref");
      return u;
    },
  },

  // ── El Corte Inglés (Awin) ────────────────────────────────────────────────
  {
    key: "elcorteingles",
    name: "El Corte Inglés",
    domains: ["elcorteingles.es"],
    injectTag: (url) => {
      const mid = env("AFFILIATE_AWIN_MID_ECI");
      return mid ? awinDeeplink(url, mid) : null;
    },
  },

  // ── Fnac (Awin) ───────────────────────────────────────────────────────────
  {
    key: "fnac",
    name: "Fnac",
    domains: ["fnac.es"],
    injectTag: (url) => {
      const mid = env("AFFILIATE_AWIN_MID_FNAC");
      return mid ? awinDeeplink(url, mid) : null;
    },
  },

  // ── PcComponentes (Awin) ──────────────────────────────────────────────────
  {
    key: "pccomponentes",
    name: "PcComponentes",
    domains: ["pccomponentes.com"],
    injectTag: (url) => {
      const mid = env("AFFILIATE_AWIN_MID_PCCOMP");
      return mid ? awinDeeplink(url, mid) : null;
    },
  },

  // ── MediaMarkt (Awin) ─────────────────────────────────────────────────────
  {
    key: "mediamarkt",
    name: "MediaMarkt",
    domains: ["mediamarkt.es"],
    injectTag: (url) => {
      const mid = env("AFFILIATE_AWIN_MID_MEDIAMARKT");
      return mid ? awinDeeplink(url, mid) : null;
    },
  },

  // ── Zara (Awin) ───────────────────────────────────────────────────────────
  {
    key: "zara",
    name: "Zara",
    domains: ["zara.com"],
    injectTag: (url) => {
      const mid = env("AFFILIATE_AWIN_MID_ZARA");
      return mid ? awinDeeplink(url, mid) : null;
    },
  },

  // ── IKEA (Awin) ───────────────────────────────────────────────────────────
  {
    key: "ikea",
    name: "IKEA",
    domains: ["ikea.com"],
    injectTag: (url) => {
      const mid = env("AFFILIATE_AWIN_MID_IKEA");
      return mid ? awinDeeplink(url, mid) : null;
    },
  },

  // ── Aliexpress (own program) ──────────────────────────────────────────────
  {
    key: "aliexpress",
    name: "AliExpress",
    domains: ["aliexpress.com", "es.aliexpress.com"],
    injectTag: (url) => {
      const tag = env("AFFILIATE_TAG_ALIEXPRESS");
      if (!tag) return null;
      const u = new URL(url.toString());
      u.searchParams.set("aff_trace_key", tag);
      return u;
    },
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function matchProvider(hostname: string): Provider | null {
  const clean = hostname.replace(/^www\./, "").toLowerCase();
  return (
    PROVIDERS.find((p) =>
      p.domains.some((d) => clean === d || clean.endsWith(`.${d}`))
    ) ?? null
  );
}

/**
 * Injects the platform affiliate tag into a product URL.
 * Returns the original URL unchanged when:
 *  - Provider not recognized
 *  - Env vars for that provider are not yet configured
 *  - URL is malformed
 */
export function injectAffiliateTag(rawUrl: string): string {
  if (!rawUrl) return rawUrl;
  try {
    const url = new URL(rawUrl);
    const provider = matchProvider(url.hostname);
    if (!provider) return rawUrl;
    const modified = provider.injectTag(new URL(rawUrl));
    return modified ? modified.toString() : rawUrl;
  } catch {
    return rawUrl;
  }
}

/** Returns the provider key for a URL (e.g. "amazon"), or null. */
export function detectProvider(rawUrl: string): string | null {
  try {
    return matchProvider(new URL(rawUrl).hostname)?.key ?? null;
  } catch {
    return null;
  }
}

/** Whether a URL belongs to a supported provider. */
export function isAffiliateable(rawUrl: string): boolean {
  return detectProvider(rawUrl) !== null;
}

/** All supported providers (for UI display / admin). */
export function getSupportedProviders() {
  return PROVIDERS.map((p) => ({ key: p.key, name: p.name, domains: p.domains }));
}
