export const JavaScriptConstants = {
  disableBrowserFeatures: `
    // Disable text selection
    document.documentElement.style.webkitUserSelect = 'none';
    document.documentElement.style.webkitTouchCallout = 'none';
    document.documentElement.style.mozUserSelect = 'none';
    document.documentElement.style.msUserSelect = 'none';
    document.documentElement.style.userSelect = 'none';
    
    // Disable drag and drop
    document.documentElement.style.webkitUserDrag = 'none';
    
    // Allow scroll but prevent zoom
    document.documentElement.style.touchAction = 'pan-y pan-x';
    document.body.style.touchAction = 'pan-y pan-x';
    document.body.style.overscrollBehaviorY = 'none';
    document.body.style.overscrollBehaviorX = 'auto';
  `,

  disableContextMenu: `
    document.addEventListener('contextmenu', function(e) {
      e.preventDefault();
      return false;
    });
  `,

  disablePinchZoom: `
    document.addEventListener('touchstart', function(e) {
      if (e.touches.length === 2) {
        const target = e.target;
        const isInteractive = target.closest('button, [role="button"], .cursor-pointer, a, [onclick], input, select, textarea') !== null;
        
        // Don't block zoom on interactive elements
        if (!isInteractive) {
          e.preventDefault();
        }
      }
    }, { passive: false });
    
    document.addEventListener('touchmove', function(e) {
      if (e.touches.length === 2) {
        const target = e.target;
        const isInteractive = target.closest('button, [role="button"], .cursor-pointer, a, [onclick], input, select, textarea') !== null;
        
        if (!isInteractive) {
          e.preventDefault();
        }
      }
    }, { passive: false });
  `,

  disableTextSelection: `
    document.addEventListener('selectstart', function(e) {
      e.preventDefault();
      return false;
    });
  `,

  disableKeyboardShortcuts: `
    document.addEventListener('keydown', function(e) {
      if (e.ctrlKey && (e.keyCode === 67 || e.keyCode === 65 || e.keyCode === 88)) {
        e.preventDefault();
        return false;
      }
      if (e.ctrlKey && (e.key === '+' || e.key === '-' || e.key === '0' || e.key === '=' || e.key === '_')) {
        e.preventDefault();
        return false;
      }
    });
  `,

  disableDoubleTapZoom: `
    let lastTouchEnd = 0;
    let lastTouchCount = 0;
    
    document.addEventListener('touchend', function(e) {
      const now = Date.now();
      const touchCount = e.changedTouches.length;
      const target = e.target;
      
      // Don't block clicks on interactive elements
      const isInteractive = target.closest('button, [role="button"], .cursor-pointer, a, [onclick], input, select, textarea, [data-azv-optimized]') !== null;
      
      if (!isInteractive && touchCount === 1 && lastTouchCount === 1 && now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      
      lastTouchEnd = now;
      lastTouchCount = touchCount;
    }, { passive: false });
  `,

  enhanceGeolocation: `
    if (navigator.geolocation) {
      console.log('📍 Geolocation is supported');
      
      const originalGetCurrentPosition = navigator.geolocation.getCurrentPosition;
      navigator.geolocation.getCurrentPosition = function(success, error, options) {
        console.log('📍 Geolocation request');
        
        originalGetCurrentPosition.call(this, 
          function(position) {
            console.log('📍 Geolocation received:', position.coords.latitude, position.coords.longitude);
            success(position);
          },
          function(err) {
            console.error('📍 Geolocation error:', err);
            error(err);
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 60000,
            ...options
          }
        );
      };
    } else {
      console.log('📍 Geolocation is not supported');
    }
  `,

  get allOptimizations(): string {
    return `
      ${this.disableBrowserFeatures}
      ${this.disableContextMenu}
      ${this.disablePinchZoom}
      ${this.disableTextSelection}
      ${this.disableKeyboardShortcuts}
      ${this.disableDoubleTapZoom}
      ${this.enhanceGeolocation}
      console.log('🔒 Browser features disabled, scroll enabled');
    `;
  },

  setupFlutterChannels: `
    // Setup global channels for React Native communication
    window.flutter_channels = {
      capturePhoto: function(cameraType) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          action: 'capturePhoto',
          data: cameraType || 'back'
        }));
      },
      pickSinglePhoto: function() {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          action: 'pickSinglePhoto',
          data: 'pick'
        }));
      },
      pickMultiplePhotos: function(maxImages) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          action: 'pickMultiplePhotos',
          data: { maxImages: maxImages || 10 }
        }));
      },
      captureMultiplePhotos: function(minPhotos, maxPhotos, cameraType) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          action: 'captureMultiplePhotos',
          data: {
            minPhotos: minPhotos || 1,
            maxPhotos: maxPhotos || 10,
            cameraType: cameraType || 'back'
          }
        }));
      },
      getCurrentPosition: function() {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          action: 'getCurrentPosition',
          data: 'get_location'
        }));
      },
      logout: function() {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          action: 'logout',
          data: 'logout'
        }));
      },
      sendAccessToken: function() {
        const token = localStorage.getItem('access_token');
        console.log('🔑 Sending access token to React Native:', token);
        window.ReactNativeWebView.postMessage(JSON.stringify({
          action: 'accessToken',
          data: token
        }));
      }
    };
  `,

  successCallback: (data: string, type: string): string => `
    window.reactNativeCameraResult && window.reactNativeCameraResult({
      success: true,
      data: '${data}',
      type: '${type}'
    });
  `,

  successCallbackMultiple: (
    photosJson: string,
    type: string,
    count: number
  ): string => `
    window.reactNativeCameraResult && window.reactNativeCameraResult({
      success: true,
      data: [${photosJson}],
      type: '${type}',
      count: ${count}
    });
  `,

  errorCallback: (error: string): string => `
    window.reactNativeCameraResult && window.reactNativeCameraResult({
      success: false,
      error: '${error}'
    });
  `,

  locationSuccessCallback: (
    latitude: number,
    longitude: number,
    accuracy: number
  ): string => `
    window.flutterLocationResult && window.flutterLocationResult({
      success: true,
      latitude: ${latitude},
      longitude: ${longitude},
      accuracy: ${accuracy}
    });
  `,

  locationErrorCallback: (error: string): string => `
    window.flutterLocationResult && window.flutterLocationResult({
      success: false,
      error: '${error}'
    });
  `,

  get injectionScript(): string {
    return `
      (function() {
        // Reset all previous event listeners
        if (window.azvOptimizationsApplied) {
          console.log('🔄 Optimizations already applied, skipping');
          return;
        }

        console.log('🚀 Applying AZV touch optimizations...');

        // CSS FIXES: pointer-events, z-index, tap-highlight
        const fixCSSIssues = () => {
          const clickableElements = document.querySelectorAll('button, [role="button"], .cursor-pointer, a, [onclick]');
          let fixedCount = 0;

          clickableElements.forEach(element => {
            const computedStyle = window.getComputedStyle(element);

            // Fix pointer-events
            if (computedStyle.pointerEvents === 'none') {
              element.style.pointerEvents = 'auto';
              console.log('🔧 Fixed pointer-events on:', element.tagName);
              fixedCount++;
            }

            // Fix touch-action
            element.style.touchAction = 'manipulation';
            element.style.webkitTouchCallout = 'none';
            element.style.webkitTapHighlightColor = 'transparent';

            // Force position for z-index issues
            if (computedStyle.position === 'static') {
              element.style.position = 'relative';
            }

            element.setAttribute('data-azv-optimized', 'true');
          });

          console.log('✅ CSS fixes:', fixedCount, 'elements processed');
          return fixedCount;
        };

        // Check viewport meta
        const checkViewport = () => {
          const viewport = document.querySelector('meta[name="viewport"]');
          if (!viewport) {
            console.warn('⚠️ Meta viewport missing!');
            const meta = document.createElement('meta');
            meta.name = 'viewport';
            meta.content = 'width=device-width, initial-scale=1, maximum-scale=1';
            document.head.appendChild(meta);
            console.log('🔧 Meta viewport added');
          } else {
            console.log('✅ Meta viewport:', viewport.getAttribute('content'));
          }
        };

        // Run optimizations
        fixCSSIssues();
        checkViewport();

        // Apply all optimizations
        ${this.allOptimizations}

        // Setup Flutter channels
        ${this.setupFlutterChannels}

        // Mark optimizations as applied
        window.azvOptimizationsApplied = true;
        console.log('✅ AZV optimizations applied successfully');
      })();
    `;
  },
};
