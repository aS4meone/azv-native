export const AppConstants = {
  // WebView URLs
  baseUrl: "https://g21z9.azvmotors.kz",

  allowedUrls: [
    "https://g21z9.azvmotors.kz",
    "https://securepayments.fortebank.com", // Forte Bank Payment Gateway
    "192.168.0.112:3000",
    "195.93.152.69:3001",
    "192.168.0.167:3000",
    "192.168.0.170:3000",
    "192.168.0.13:3000",
    "172.20.10.2:3000",
    "https://azv-webview.vercel.app/",
    "192.168.0.166:3000",
    "192.168.0.11:3000",
    "192.168.8.85:3000",
    "172.20.10.5:3000",
    "localhost:3000",
    "127.0.0.1:3000",
  ],

  allowedProtocols: [
    "http://172.20.10.5:3000",
    "http://192.168.0.11:3000",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ],

  // Special URL schemes
  specialSchemes: [
    "tel:",
    "mailto:",
    "sms:",
    "whatsapp:",
    "https://t.me/",
    "tg://",
  ],

  // Camera settings
  defaultMaxPhotos: 10,
  defaultMinPhotos: 1,

  // Location settings
  locationTimeout: 10000, // 10 seconds
  geolocationTimeout: 15000, // 15 seconds
  geolocationMaxAge: 60000, // 1 minute

  // API settings
  apiBaseUrl: "https://api.azvmotors.kz",
  saveTokenEndpoint: "/notifications/save_token",

  // Logging
  progressLogInterval: 25,

  // Helper methods
  isAllowedUrl: (url: string): boolean => {
    return (
      AppConstants.allowedUrls.some((allowedUrl) => url.includes(allowedUrl)) ||
      AppConstants.allowedProtocols.some((protocol) => url.startsWith(protocol))
    );
  },

  isSpecialScheme: (url: string): boolean => {
    return AppConstants.specialSchemes.some((scheme) => url.startsWith(scheme));
  },

  isValidUrl: (url: string): boolean => {
    try {
      const parsedUrl = new URL(url);
      return (
        parsedUrl.protocol === "http:" ||
        parsedUrl.protocol === "https:" ||
        AppConstants.isSpecialScheme(url)
      );
    } catch (e) {
      return false;
    }
  },

  getDomain: (url: string): string | null => {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.hostname;
    } catch (e) {
      return null;
    }
  },

  isLocalUrl: (url: string): boolean => {
    const domain = AppConstants.getDomain(url);
    if (!domain) return false;

    return (
      domain === "localhost" ||
      domain === "127.0.0.1" ||
      domain.startsWith("192.168.") ||
      domain.startsWith("172.20.") ||
      domain.startsWith("10.")
    );
  },
};
