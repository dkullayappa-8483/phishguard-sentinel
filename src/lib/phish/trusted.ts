// Curated registrable domains considered legitimate.
// A URL is only marked Safe when its registrable domain is an EXACT match here
// AND it uses HTTPS AND no risk signals fire.
export const TRUSTED_DOMAINS: ReadonlySet<string> = new Set([
  // Tech giants
  "google.com", "youtube.com", "gmail.com", "googleapis.com", "googleusercontent.com",
  "microsoft.com", "live.com", "outlook.com", "office.com", "office365.com", "microsoftonline.com", "azure.com", "bing.com", "msn.com", "xbox.com", "skype.com",
  "apple.com", "icloud.com", "itunes.com",
  "amazon.com", "amazon.co.uk", "amazon.de", "amazon.in", "amazon.ca", "amazon.fr", "amazon.it", "amazon.es", "amazon.jp", "amazon.com.mx", "amazon.com.br", "aws.amazon.com", "primevideo.com",
  "meta.com", "facebook.com", "instagram.com", "whatsapp.com", "messenger.com",
  "x.com", "twitter.com", "t.co",
  "linkedin.com",
  "tiktok.com", "snapchat.com", "pinterest.com", "reddit.com", "tumblr.com",
  "netflix.com", "spotify.com", "hulu.com", "disney.com", "disneyplus.com",
  "github.com", "gitlab.com", "bitbucket.org", "stackoverflow.com", "stackexchange.com",
  "openai.com", "anthropic.com", "claude.ai", "perplexity.ai", "huggingface.co",
  "lovable.dev", "vercel.com", "netlify.com", "cloudflare.com", "render.com", "fly.io",
  // Finance / Payments
  "paypal.com", "stripe.com", "square.com", "venmo.com", "cashapp.com", "wise.com", "revolut.com",
  "visa.com", "mastercard.com", "americanexpress.com", "discover.com",
  "chase.com", "bankofamerica.com", "wellsfargo.com", "citibank.com", "citi.com", "usbank.com", "capitalone.com", "pnc.com", "tdbank.com",
  "hsbc.com", "barclays.co.uk", "lloydsbank.com", "natwest.com", "santander.com", "bnpparibas.com", "deutsche-bank.de", "credit-suisse.com", "ubs.com", "ing.com",
  "coinbase.com", "kraken.com", "binance.com", "crypto.com",
  // Shipping / Travel
  "ups.com", "fedex.com", "usps.com", "dhl.com", "royalmail.com", "canadapost.ca",
  "uber.com", "lyft.com", "airbnb.com", "booking.com", "expedia.com", "kayak.com", "tripadvisor.com",
  "delta.com", "united.com", "aa.com", "southwest.com", "britishairways.com", "lufthansa.com", "airfrance.com", "emirates.com", "qatarairways.com",
  // Retail
  "ebay.com", "etsy.com", "walmart.com", "target.com", "costco.com", "bestbuy.com", "homedepot.com", "ikea.com", "shopify.com", "alibaba.com", "aliexpress.com", "shein.com", "temu.com",
  // Government / EDU
  "irs.gov", "usa.gov", "ssa.gov", "usps.com", "uscis.gov", "state.gov", "whitehouse.gov", "cdc.gov", "nih.gov", "fbi.gov",
  "gov.uk", "europa.eu",
  // News / Reference
  "wikipedia.org", "wikimedia.org", "bbc.com", "bbc.co.uk", "cnn.com", "nytimes.com", "wsj.com", "reuters.com", "theguardian.com", "ft.com", "bloomberg.com", "economist.com",
  // Productivity / Misc
  "dropbox.com", "box.com", "notion.so", "slack.com", "zoom.us", "discord.com", "telegram.org", "signal.org",
  "adobe.com", "figma.com", "canva.com", "atlassian.com", "trello.com", "asana.com", "monday.com",
  "salesforce.com", "hubspot.com", "zendesk.com", "intercom.com", "mailchimp.com", "sendgrid.com",
  "wordpress.com", "wordpress.org", "wix.com", "squarespace.com", "godaddy.com", "namecheap.com",
  "duckduckgo.com", "yahoo.com", "yandex.com", "baidu.com", "naver.com",
  "quora.com", "medium.com", "substack.com",
  "twitch.tv", "vimeo.com",
]);

// Brand keywords used for impersonation detection (registrable-domain match + split-label).
export const BRAND_KEYWORDS: ReadonlyArray<string> = [
  "paypal", "amazon", "apple", "microsoft", "google", "facebook", "instagram", "whatsapp",
  "netflix", "spotify", "linkedin", "twitter", "tiktok", "snapchat", "ebay", "walmart",
  "chase", "wellsfargo", "bankofamerica", "citibank", "hsbc", "barclays", "santander",
  "coinbase", "binance", "kraken", "metamask", "trustwallet",
  "ups", "fedex", "dhl", "usps", "royalmail",
  "irs", "hmrc", "ssa", "uscis",
  "outlook", "office365", "onedrive", "icloud", "appleid",
  "github", "gitlab", "dropbox", "adobe", "docusign",
  "uber", "airbnb", "booking", "stripe", "venmo", "cashapp", "zelle",
];

export const ABUSED_TLDS: ReadonlySet<string> = new Set([
  "zip", "mov", "xyz", "top", "tk", "ml", "ga", "cf", "gq", "click", "country", "icu",
  "rest", "live", "support", "work", "loan", "men", "stream", "fit", "racing", "review",
]);

export const SUSPICIOUS_KEYWORDS: ReadonlyArray<string> = [
  "secure", "account", "update", "verify", "login", "signin", "confirm", "wallet",
  "bank", "billing", "invoice", "payment", "recovery", "unlock", "suspend", "limited",
  "alert", "security", "auth", "support", "service",
];
