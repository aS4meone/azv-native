/**
 * Service for monitoring connection status and request loading times
 */
export interface ConnectionStatus {
  isConnected: boolean;
  loadingTime?: number;
  isSlowConnection: boolean;
  requestUrl?: string;
  timestamp: number;
}

export interface ConnectionListener {
  onConnectionChange: (status: ConnectionStatus) => void;
}

export class ConnectionMonitorService {
  private static instance: ConnectionMonitorService;
  private listeners: ConnectionListener[] = [];
  private connectionStatus: ConnectionStatus = {
    isConnected: true,
    isSlowConnection: false,
    timestamp: Date.now(),
  };
  private loadStartTime: number = 0;
  private slowConnectionThreshold: number = 10000; // 10 seconds (10000ms)
  private autoErrorTimeout: NodeJS.Timeout | null = null;
  private autoErrorThreshold: number = 5000; // 5 seconds for auto error screen
  private isInitialLoad: boolean = true; // Track if this is the first app load
  private shouldShowErrorOnTimeout: boolean = true; // Control when to show error screen

  private constructor() {}

  public static getInstance(): ConnectionMonitorService {
    if (!ConnectionMonitorService.instance) {
      ConnectionMonitorService.instance = new ConnectionMonitorService();
    }
    return ConnectionMonitorService.instance;
  }

  /**
   * Add connection listener
   */
  public addListener(listener: ConnectionListener): void {
    this.listeners.push(listener);
  }

  /**
   * Remove connection listener
   */
  public removeListener(listener: ConnectionListener): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Called when a request starts loading
   */
  public onLoadStart(url: string): void {
    console.log('📡 Load start:', url);
    this.loadStartTime = Date.now();
    
    // Clear any existing auto error timeout
    this.clearAutoErrorTimeout();
    
    // Only set auto error timeout on initial load and when allowed
    if (this.isInitialLoad && this.shouldShowErrorOnTimeout) {
      console.log('🔄 Setting auto error timeout for initial app load');
      this.autoErrorTimeout = setTimeout(() => {
        console.log('🚨 Auto error timeout reached (5 seconds) during initial load - showing connection error screen');
        if ((global as any).connectionManager) {
          (global as any).connectionManager.showConnectionError();
        }
      }, this.autoErrorThreshold);
    }
    
    this.updateConnectionStatus({
      isConnected: true,
      isSlowConnection: false,
      requestUrl: url,
      timestamp: this.loadStartTime,
    });
  }

  /**
   * Called when a request finishes loading
   */
  public onLoadEnd(url: string): void {
    const loadEndTime = Date.now();
    const loadingTime = loadEndTime - this.loadStartTime;
    const isSlowConnection = loadingTime > this.slowConnectionThreshold;

    console.log(`📡 Load end: ${url}, Time: ${loadingTime}ms, Slow: ${isSlowConnection}`);

    // Clear auto error timeout since load completed
    this.clearAutoErrorTimeout();

    // Mark initial load as completed
    if (this.isInitialLoad) {
      console.log('✅ Initial app load completed successfully');
      this.isInitialLoad = false;
    }

    this.updateConnectionStatus({
      isConnected: true,
      loadingTime,
      isSlowConnection,
      requestUrl: url,
      timestamp: loadEndTime,
    });
  }

  /**
   * Called when a request fails
   */
  public onLoadError(error: any, url?: string): void {
    console.log('📡 Load error:', error, url);
    const loadEndTime = Date.now();
    const loadingTime = this.loadStartTime > 0 ? loadEndTime - this.loadStartTime : undefined;

    // Clear auto error timeout since we have an explicit error
    this.clearAutoErrorTimeout();

    this.updateConnectionStatus({
      isConnected: false,
      loadingTime,
      isSlowConnection: true,
      requestUrl: url,
      timestamp: loadEndTime,
    });

    // Only show error screen for server down situations
    this.checkIfServerIsDown(error);
  }

  /**
   * Check if error indicates server is down (not client/app issues)
   */
  private checkIfServerIsDown(error: any): void {
    console.log('🔧 Checking if server is down based on WebView error:', error);
    
    // Check for server down indicators in WebView errors
    const isServerDown = 
      error?.nativeEvent?.description?.includes('500') ||
      error?.nativeEvent?.description?.includes('502') ||
      error?.nativeEvent?.description?.includes('503') ||
      error?.nativeEvent?.description?.includes('504') ||
      error?.nativeEvent?.description?.includes('The Internet connection appears to be offline') ||
      error?.nativeEvent?.description?.includes('Could not connect to the server') ||
      error?.nativeEvent?.description?.includes('server is not responding') ||
      error?.nativeEvent?.description?.includes('network connection was lost') ||
      error?.nativeEvent?.code === -1009 || // NSURLErrorNotConnectedToInternet
      error?.nativeEvent?.code === -1001 || // NSURLErrorTimedOut
      error?.nativeEvent?.code === -1004;   // NSURLErrorCannotConnectToHost
    
    if (isServerDown) {
      console.log('🔧 Server appears to be down, showing connection error screen');
      
      // Use global connection manager if available
      if ((global as any).connectionManager) {
        (global as any).connectionManager.showConnectionError();
      }
    } else {
      console.log('🔧 WebView error does not indicate server down, continuing normally');
    }
  }

  /**
   * Get current connection status
   */
  public getConnectionStatus(): ConnectionStatus {
    return { ...this.connectionStatus };
  }

  /**
   * Check if connection is currently slow or failed
   */
  public isSlowOrFailedConnection(): boolean {
    return !this.connectionStatus.isConnected || this.connectionStatus.isSlowConnection;
  }

  /**
   * Set slow connection threshold (in milliseconds)
   */
  public setSlowConnectionThreshold(threshold: number): void {
    this.slowConnectionThreshold = threshold;
  }

  /**
   * Enable or disable showing error screen on timeout
   */
  public setShouldShowErrorOnTimeout(shouldShow: boolean): void {
    this.shouldShowErrorOnTimeout = shouldShow;
    console.log(`🔧 Error screen on timeout ${shouldShow ? 'enabled' : 'disabled'}`);
  }

  /**
   * Check if this is the initial load
   */
  public isInitialAppLoad(): boolean {
    return this.isInitialLoad;
  }

  /**
   * Reset initial load flag (for testing purposes)
   */
  public resetInitialLoad(): void {
    this.isInitialLoad = true;
    console.log('🔄 Initial load flag reset');
  }

  /**
   * Update connection status and notify listeners
   */
  private updateConnectionStatus(status: Partial<ConnectionStatus>): void {
    this.connectionStatus = {
      ...this.connectionStatus,
      ...status,
    };

    // Notify all listeners
    this.listeners.forEach(listener => {
      try {
        listener.onConnectionChange(this.connectionStatus);
      } catch (error) {
        console.error('Error notifying connection listener:', error);
      }
    });
  }

  /**
   * Clear auto error timeout
   */
  private clearAutoErrorTimeout(): void {
    if (this.autoErrorTimeout) {
      clearTimeout(this.autoErrorTimeout);
      this.autoErrorTimeout = null;
    }
  }

  /**
   * Reset connection status
   */
  public reset(): void {
    this.loadStartTime = 0;
    this.clearAutoErrorTimeout();
    this.connectionStatus = {
      isConnected: true,
      isSlowConnection: false,
      timestamp: Date.now(),
    };
    // Don't reset isInitialLoad here - it should persist across resets
  }

  /**
   * Dispose of the service
   */
  public dispose(): void {
    this.listeners = [];
    this.clearAutoErrorTimeout();
    this.reset();
  }
}
