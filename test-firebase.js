#!/usr/bin/env node

/**
 * Firebase Setup Test Script
 * Run this to verify your Firebase configuration
 */

const fs = require("fs");
const path = require("path");

console.log("🔍 Testing Firebase Setup...\n");

// Check 1: Package.json dependencies
console.log("1. Checking package.json dependencies...");
try {
  const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
  const hasFirebaseApp = packageJson.dependencies["@react-native-firebase/app"];
  const hasFirebaseMessaging =
    packageJson.dependencies["@react-native-firebase/messaging"];

  if (hasFirebaseApp && hasFirebaseMessaging) {
    console.log(
      "✅ Firebase dependencies found:",
      hasFirebaseApp,
      hasFirebaseMessaging
    );
  } else {
    console.log("❌ Firebase dependencies missing");
  }
} catch (error) {
  console.log("❌ Error reading package.json:", error.message);
}

// Check 2: App.json configuration
console.log("\n2. Checking app.json configuration...");
try {
  const appJson = JSON.parse(fs.readFileSync("app.json", "utf8"));
  const hasNotificationsPlugin = appJson.expo.plugins.some(
    (plugin) => Array.isArray(plugin) && plugin[0] === "expo-notifications"
  );

  if (hasNotificationsPlugin) {
    console.log("✅ Expo notifications plugin configured");
  } else {
    console.log("❌ Expo notifications plugin missing");
  }
} catch (error) {
  console.log("❌ Error reading app.json:", error.message);
}

// Check 3: Firebase service file
console.log("\n3. Checking Firebase service implementation...");
try {
  const firebaseService = fs.readFileSync(
    "services/FirebaseMessagingService.ts",
    "utf8"
  );
  const hasRealImplementation =
    firebaseService.includes("messaging().getToken()") &&
    !firebaseService.includes("placeholder");

  if (hasRealImplementation) {
    console.log("✅ Firebase service has real implementation");
  } else {
    console.log("❌ Firebase service is still a placeholder");
  }
} catch (error) {
  console.log("❌ Error reading Firebase service:", error.message);
}

// Check 4: iOS configuration
console.log("\n4. Checking iOS configuration...");
try {
  const appDelegate = fs.readFileSync("ios/azvreact/AppDelegate.swift", "utf8");
  const hasFirebaseImport = appDelegate.includes("import Firebase");
  const hasFirebaseConfigure = appDelegate.includes("FirebaseApp.configure()");

  if (hasFirebaseImport && hasFirebaseConfigure) {
    console.log("✅ iOS AppDelegate configured for Firebase");
  } else {
    console.log("❌ iOS AppDelegate missing Firebase configuration");
  }
} catch (error) {
  console.log("❌ Error reading iOS AppDelegate:", error.message);
}

// Check 5: Android configuration
console.log("\n5. Checking Android configuration...");
try {
  const projectBuildGradle = fs.readFileSync("android/build.gradle", "utf8");
  const appBuildGradle = fs.readFileSync("android/app/build.gradle", "utf8");

  const hasGoogleServicesPlugin = projectBuildGradle.includes(
    "google-services:4.4.0"
  );
  const hasPluginApplied = appBuildGradle.includes(
    "com.google.gms.google-services"
  );

  if (hasGoogleServicesPlugin && hasPluginApplied) {
    console.log("✅ Android build.gradle configured for Firebase");
  } else {
    console.log("❌ Android build.gradle missing Firebase configuration");
  }
} catch (error) {
  console.log("❌ Error reading Android build.gradle:", error.message);
}

// Check 6: Configuration files
console.log("\n6. Checking Firebase configuration files...");
const hasGoogleServicesJson = fs.existsSync("google-services.json");
const hasGoogleServiceInfoPlist = fs.existsSync(
  "ios/azvreact/GoogleService-Info.plist"
);

if (hasGoogleServicesJson) {
  console.log("✅ google-services.json found");
} else {
  console.log(
    "❌ google-services.json missing - Download from Firebase Console"
  );
}

if (hasGoogleServiceInfoPlist) {
  console.log("✅ GoogleService-Info.plist found");
} else {
  console.log(
    "❌ GoogleService-Info.plist missing - Download from Firebase Console"
  );
}

// Summary
console.log("\n📋 Summary:");
console.log("To complete Firebase setup, you need to:");
console.log(
  "1. Create a Firebase project at https://console.firebase.google.com/"
);
console.log(
  '2. Add your app with package name "kz.azv.motors" (Android) and bundle ID "com.example.azvMotor" (iOS)'
);
console.log(
  "3. Download google-services.json and place it in the project root"
);
console.log(
  "4. Download GoogleService-Info.plist and place it in ios/azvreact/"
);
console.log("5. Run: npx expo run:ios or npx expo run:android");

console.log(
  "\n🎉 Once you have the configuration files, your push notifications should work!"
);
