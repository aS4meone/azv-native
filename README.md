# AZV React Native WebView App

This is a React Native application that implements the same functionality as the Flutter AZV WebView app. It provides a native wrapper around the AZV Motors web application with enhanced mobile capabilities.

## Features

### Core Functionality
- **WebView Integration**: Seamless integration with the AZV Motors web application
- **JavaScript Bridge**: Two-way communication between React Native and web content
- **Splash Screen**: Animated loading screen during app initialization
- **Navigation Handling**: Smart URL handling for external links and deep linking

### Device Capabilities
- **Camera Integration**: Photo capture with front/back camera selection
- **Gallery Access**: Single and multiple photo selection from device gallery
- **Location Services**: GPS location access with permission handling
- **Push Notifications**: Firebase Cloud Messaging integration (placeholder)
- **Permission Management**: Comprehensive permission handling for all device features

### Services Architecture

#### 1. WebViewService
- Main coordinator for all WebView operations
- Handles JavaScript message passing
- Manages WebView lifecycle and optimization
- Coordinates with other services

#### 2. CameraService
- Photo capture functionality
- Gallery photo selection
- Support for single and multiple photo operations
- Automatic image processing and base64 encoding

#### 3. LocationService
- GPS location access
- High-accuracy positioning
- Location permission management
- Error handling and timeout management

#### 4. UrlService
- URL validation and categorization
- External link handling
- Deep link support
- Special URL scheme handling (tel:, mailto:, etc.)

#### 5. ApiService
- HTTP client for backend communication
- Token management
- Request/response interceptors
- Error handling

#### 6. PermissionService
- Device permission management
- Permission request workflows
- Settings navigation
- Permission rationale dialogs

#### 7. FirebaseMessagingService
- Push notification handling (placeholder)
- Token management
- Message processing
- Background/foreground message handling

## Technical Implementation

### JavaScript Bridge Communication
The app uses a sophisticated JavaScript bridge system that mirrors the Flutter implementation:

```javascript
// Web to Native Communication
window.flutter_channels = {
  capturePhoto: function(cameraType) { /* ... */ },
  pickSinglePhoto: function() { /* ... */ },
  pickMultiplePhotos: function(maxImages) { /* ... */ },
  getCurrentPosition: function() { /* ... */ },
  logout: function() { /* ... */ }
};
```

### WebView Optimizations
- Touch event optimization
- Zoom and scroll control
- Context menu disabling
- Selection prevention
- Keyboard shortcut blocking

### State Management
- Singleton pattern for service instances
- React hooks for component state
- AsyncStorage for persistent data
- Callback-based service communication

## File Structure

```
azv-react/
├── app/
│   ├── _layout.tsx          # Root layout with navigation
│   ├── index.tsx            # Main app screen
│   └── +not-found.tsx       # 404 page
├── components/
│   ├── AZVWebView.tsx       # Main WebView component
│   └── SplashScreen.tsx     # Loading screen
├── constants/
│   ├── AppConstants.ts      # App configuration
│   └── JavaScriptConstants.ts # JS injection scripts
├── services/
│   ├── WebViewService.ts    # WebView coordination
│   ├── CameraService.ts     # Camera operations
│   ├── LocationService.ts   # Location services
│   ├── UrlService.ts        # URL handling
│   ├── ApiService.ts        # API communication
│   ├── PermissionService.ts # Permission management
│   └── FirebaseMessagingService.ts # Push notifications
└── hooks/
    └── useColorScheme.ts    # Theme detection
```

## Configuration

### App Constants
The app is configured through `AppConstants.ts`:
- Base URL for the web application
- Allowed URLs for navigation
- Special URL schemes
- Timeout values
- API endpoints

### JavaScript Constants
WebView optimizations and bridge setup in `JavaScriptConstants.ts`:
- Touch optimization scripts
- Bridge function definitions
- Error handling callbacks
- Location service integration

## Platform Support

### iOS
- Full native integration
- Proper permission handling
- Background app refresh support
- Push notification support

### Android
- Native WebView implementation
- Permission request dialogs
- Hardware back button support
- Notification channels

## Security Features

- URL validation and whitelisting
- XSS protection through CSP
- Secure token storage
- Permission-based access control

## Development

### Prerequisites
- Node.js 18+
- React Native development environment
- Expo CLI

### Installation
```bash
npm install
```

### Running the App
```bash
npm start
```

### Building for Production
```bash
npm run build
```

## Notes

### Firebase Integration
The Firebase messaging service is implemented as a placeholder. To enable full functionality:
1. Install `@react-native-firebase/app` and `@react-native-firebase/messaging`
2. Configure Firebase project
3. Update `FirebaseMessagingService.ts` with actual Firebase implementation

### Performance Optimizations
- Lazy loading of services
- Efficient WebView communication
- Minimal re-renders through useCallback
- Proper cleanup on unmount

### Error Handling
- Comprehensive error catching
- User-friendly error messages
- Automatic retry mechanisms
- Graceful degradation

## Migration from Flutter

This React Native implementation maintains 100% feature parity with the Flutter version:
- Same JavaScript bridge interface
- Identical service architecture
- Matching error handling
- Equivalent performance characteristics

The migration provides better React Native ecosystem integration while preserving all existing functionality.

## License

This project is proprietary software for AZV Motors.
