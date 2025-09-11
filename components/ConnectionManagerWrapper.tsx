import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ConnectionListener, ConnectionMonitorService, ConnectionStatus } from '../services/ConnectionMonitorService';
import { ConnectionErrorScreen } from './ConnectionErrorScreen';
import { ManualCarLockScreen } from './ManualCarLockScreen';

export type ScreenType = 'webview' | 'connection-error' | 'manual-instructions';

interface ConnectionManagerWrapperProps {
  children: React.ReactNode;
  onWebViewReload?: () => void;
}

export const ConnectionManagerWrapper: React.FC<ConnectionManagerWrapperProps> = ({
  children,
  onWebViewReload,
}) => {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('webview');
  const [connectionMonitor] = useState(() => ConnectionMonitorService.getInstance());
  const [isRetrying, setIsRetrying] = useState(false);
  const [isConnected, setIsConnected] = useState(true);

  // Connection status listener
  const connectionListener: ConnectionListener = React.useMemo(() => ({
    onConnectionChange: (status: ConnectionStatus) => {
      console.log('Connection status changed:', status);
      
      // Update connection state
      setIsConnected(status.isConnected);
      
      // Only show connection error screen during initial app load and if enabled
      const isInitialLoad = connectionMonitor.isInitialAppLoad();
      console.log('🔧 Connection change - Initial load:', isInitialLoad, 'Connected:', status.isConnected);
      
      // Show connection error screen only on initial load if connection is slow (>5 seconds) or failed
      if (isInitialLoad && (!status.isConnected || (status.loadingTime && status.loadingTime > 5000))) {
        console.log('Showing connection error screen due to slow/failed connection during initial load');
        setCurrentScreen('connection-error');
      } else if (status.isConnected && status.loadingTime && status.loadingTime <= 5000) {
        // Connection is good, go back to webview
        setCurrentScreen('webview');
      }
    },
  }), [connectionMonitor]);

  useEffect(() => {
    // Add connection listener
    connectionMonitor.addListener(connectionListener);

    // Set threshold to 5 seconds (5000ms) 
    connectionMonitor.setSlowConnectionThreshold(5000);

    return () => {
      connectionMonitor.removeListener(connectionListener);
    };
  }, [connectionMonitor, connectionListener]);

  const handleTryAgain = useCallback(async () => {
    console.log('Try again pressed, testing backend connection...');
    setIsRetrying(true);
    
    try {
      // Test backend connection
      const backendUrl = 'https://api.azvmotors.kz/';
      
      console.log('🔄 Testing connection to:', backendUrl);
      
      // Create timeout using Promise.race - reduced to 3 seconds
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 3000)
      );
      
      const fetchPromise = fetch(backendUrl, {
        method: 'GET',
      });
      
      const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;
      
      if (response.ok) {
        console.log('✅ Backend connection successful, reloading WebView');
        // Re-enable error screen for future loads and reset connection state
        connectionMonitor.setShouldShowErrorOnTimeout(true);
        connectionMonitor.reset();
        setCurrentScreen('webview');
        onWebViewReload?.();
      } else {
        console.log('❌ Backend responded with error status:', response.status);
        // Stay on connection error screen
      }
      
    } catch (error) {
      console.log('❌ Backend connection test failed:', error);
      // Stay on connection error screen - user can try again
    } finally {
      setIsRetrying(false);
    }
  }, [connectionMonitor, onWebViewReload]);

  const handleManualInstructions = useCallback(() => {
    console.log('Manual instructions pressed');
    setCurrentScreen('manual-instructions');
  }, []);


  const handleBackToError = useCallback(() => {
    console.log('Back to connection error screen');
    setCurrentScreen('connection-error');
  }, []);


  // Public methods to control screens externally
  const showConnectionError = useCallback(() => {
    setCurrentScreen('connection-error');
  }, []);

  const showManualInstructions = useCallback(() => {
    setCurrentScreen('manual-instructions');
  }, []);

  const showWebView = useCallback(() => {
    setCurrentScreen('webview');
  }, []);

  // Expose methods to parent components if needed
  React.useEffect(() => {
    // You can expose these methods to global scope or pass them up if needed
    (global as any).connectionManager = {
      showConnectionError,
      showManualInstructions,
      showWebView,
      getConnectionStatus: () => connectionMonitor.getConnectionStatus(),
      isConnected,
      isOnErrorScreen: currentScreen === 'connection-error',
    };
  }, [showConnectionError, showManualInstructions, showWebView, connectionMonitor, isConnected, currentScreen]);

  if (currentScreen === 'connection-error') {
    return (
      <View style={styles.container}>
        <ConnectionErrorScreen
          onTryAgain={handleTryAgain}
          onManualInstructions={handleManualInstructions}
          isRetrying={isRetrying}
        />
      </View>
    );
  }

  if (currentScreen === 'manual-instructions') {
    return (
      <View style={styles.container}>
        <ManualCarLockScreen
          onBack={handleBackToError}
        />
      </View>
    );
  }

  // Default: show webview
  return (
    <View style={styles.container}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default ConnectionManagerWrapper;
