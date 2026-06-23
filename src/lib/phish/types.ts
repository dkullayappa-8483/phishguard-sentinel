export type RiskTier = "safe" | "low" | "suspicious" | "high" | "critical";

export interface Signal {
  id: string;
  label: string;
  weight: number; // positive = risky, negative = trust
  detail?: string;
}

export interface ProviderResult {
  name: string;
  status: "clean" | "malicious" | "unknown" | "error" | "skipped";
  detail?: string;
  raw?: unknown;
}

export interface DomainBreakdown {
  subdomain: string | null;
  registrable: string | null;
  publicSuffix: string | null;
  isIp: boolean;
  isPunycode: boolean;
}

export interface RedirectHop {
  url: string;
  status: number;
  ms: number;
}

export interface UrlScanResult {
  input: string;
  finalUrl: string;
  score: number;
  tier: RiskTier;
  verdict: string;
  signals: Signal[];
  providers: ProviderResult[];
  domain: DomainBreakdown;
  redirects: RedirectHop[];
  recommendations: string[];
  scannedAt: string;
  source: "live" | "local-fallback";
  error?: string;
}

export interface EmailHeaderCheck {
  spf: "pass" | "fail" | "neutral" | "unknown";
  dkim: "pass" | "fail" | "neutral" | "unknown";
  dmarc: "pass" | "fail" | "neutral" | "unknown";
  fromDomain: string | null;
  replyTo: string | null;
  replyToMismatch: boolean;
  returnPath: string | null;
  subject: string | null;
}

export interface EmailScanResult {
  headers: EmailHeaderCheck;
  urls: UrlScanResult[];
  score: number;
  tier: RiskTier;
  signals: Signal[];
  recommendations: string[];
  scannedAt: string;
}
