# Native notifications

The mobile app uses the Expo Notifications API for native Android and iOS push delivery.

Install the Expo packages from the `mobile` directory before creating a development or release build:

```bash
npx expo install expo-notifications expo-constants
```

Then create an EAS project and configure the project ID in Expo app configuration. A development build is required for remote push notifications; Expo Go is not sufficient for Android remote push on recent Expo SDK versions.

The app stores the Expo device address in the `mobile_devices` table so the backend can associate a device with the signed-in account.
