import { Linking } from "react-native";
import { AppConstants } from "../constants/AppConstants";

export enum UrlType {
  WEBVIEW = "webview",
  EXTERNAL = "external",
  BROWSER = "browser",
}

export class UrlService {
  private static instance: UrlService;

  private constructor() {}

  public static getInstance(): UrlService {
    if (!UrlService.instance) {
      UrlService.instance = new UrlService();
    }
    return UrlService.instance;
  }

  /**
   * Handle special URLs (phone, Telegram, WhatsApp, etc.)
   */
  public async handleSpecialUrls(url: string): Promise<boolean> {
    try {
      if (AppConstants.isSpecialScheme(url)) {
        console.log("Handling special URL:", url);

        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
          await Linking.openURL(url);
          return true;
        } else {
          console.log("Cannot open URL:", url);
        }
      }
    } catch (error) {
      console.error("Error handling URL:", url, error);
    }
    return false;
  }

  /**
   * Open URL in external browser
   */
  public async openInExternalBrowser(url: string): Promise<void> {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        console.log("Opened external URL:", url);
      } else {
        console.log("Cannot open external URL:", url);
      }
    } catch (error) {
      console.error("Error opening external link:", error);
    }
  }

  /**
   * Check if URL is allowed for WebView navigation
   */
  public isAllowedForWebView(url: string): boolean {
    return AppConstants.isAllowedUrl(url);
  }

  /**
   * Get URL type based on configuration
   */
  public getUrlType(url: string): UrlType {
    if (AppConstants.isAllowedUrl(url)) {
      return UrlType.WEBVIEW;
    } else if (AppConstants.isSpecialScheme(url)) {
      return UrlType.EXTERNAL;
    } else {
      return UrlType.BROWSER;
    }
  }

  /**
   * Format URL for logging (truncate if too long)
   */
  public formatUrlForLogging(url: string): string {
    if (url.length > 100) {
      return `${url.substring(0, 100)}...`;
    }
    return url;
  }

  /**
   * Validate URL format
   */
  public isValidUrl(url: string): boolean {
    return AppConstants.isValidUrl(url);
  }

  /**
   * Get domain from URL
   */
  public getDomain(url: string): string | null {
    return AppConstants.getDomain(url);
  }

  /**
   * Check if URL is local (localhost, internal network)
   */
  public isLocalUrl(url: string): boolean {
    return AppConstants.isLocalUrl(url);
  }

  /**
   * Check if URL should be handled by the app
   */
  public shouldHandleUrl(url: string): boolean {
    // Handle special schemes
    if (AppConstants.isSpecialScheme(url)) {
      return true;
    }

    // Handle allowed URLs in WebView
    if (AppConstants.isAllowedUrl(url)) {
      return true;
    }

    // Everything else goes to external browser
    return false;
  }

  /**
   * Process navigation request
   */
  public async processNavigationRequest(url: string): Promise<{
    shouldContinue: boolean;
    handled: boolean;
  }> {
    try {
      console.log(
        "Processing navigation request:",
        this.formatUrlForLogging(url)
      );

      // Handle special URLs
      if (AppConstants.isSpecialScheme(url)) {
        const handled = await this.handleSpecialUrls(url);
        return {
          shouldContinue: false,
          handled,
        };
      }

      // Allow navigation for allowed URLs
      if (AppConstants.isAllowedUrl(url)) {
        return {
          shouldContinue: true,
          handled: true,
        };
      }

      // Open external URLs in browser
      await this.openInExternalBrowser(url);
      return {
        shouldContinue: false,
        handled: true,
      };
    } catch (error) {
      console.error("Error processing navigation request:", error);
      return {
        shouldContinue: false,
        handled: false,
      };
    }
  }

  /**
   * Extract query parameters from URL
   */
  public getQueryParams(url: string): Record<string, string> {
    try {
      const urlObj = new URL(url);
      const params: Record<string, string> = {};

      urlObj.searchParams.forEach((value, key) => {
        params[key] = value;
      });

      return params;
    } catch (error) {
      console.error("Error extracting query params:", error);
      return {};
    }
  }

  /**
   * Build URL with query parameters
   */
  public buildUrlWithParams(
    baseUrl: string,
    params: Record<string, string>
  ): string {
    try {
      const urlObj = new URL(baseUrl);

      Object.entries(params).forEach(([key, value]) => {
        urlObj.searchParams.set(key, value);
      });

      return urlObj.toString();
    } catch (error) {
      console.error("Error building URL with params:", error);
      return baseUrl;
    }
  }

  /**
   * Check if URL is secure (HTTPS)
   */
  public isSecureUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === "https:";
    } catch (error) {
      return false;
    }
  }

  /**
   * Get URL without query parameters
   */
  public getBaseUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      return `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;
    } catch (error) {
      return url;
    }
  }

  /**
   * Check if two URLs are from the same domain
   */
  public isSameDomain(url1: string, url2: string): boolean {
    const domain1 = this.getDomain(url1);
    const domain2 = this.getDomain(url2);
    return domain1 !== null && domain2 !== null && domain1 === domain2;
  }

  /**
   * Handle deep links
   */
  public async handleDeepLink(url: string): Promise<boolean> {
    try {
      console.log("Handling deep link:", url);

      // Check if app can handle this URL
      const canHandle = await Linking.canOpenURL(url);
      if (canHandle) {
        await Linking.openURL(url);
        return true;
      }

      return false;
    } catch (error) {
      console.error("Error handling deep link:", error);
      return false;
    }
  }

  /**
   * Get app URL scheme
   */
  public getAppUrlScheme(): string {
    return "azv://";
  }

  /**
   * Build app deep link
   */
  public buildAppDeepLink(
    path: string,
    params?: Record<string, string>
  ): string {
    let url = `${this.getAppUrlScheme()}${path}`;

    if (params && Object.keys(params).length > 0) {
      const queryString = Object.entries(params)
        .map(
          ([key, value]) =>
            `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
        )
        .join("&");
      url += `?${queryString}`;
    }

    return url;
  }
}
