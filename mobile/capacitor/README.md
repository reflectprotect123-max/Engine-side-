# The Engine Android (Capacitor)

Id `com.hybrid.engine` — not Strength (`com.hybrid.athlete`). Debug APK for sideload.

```bash
export ANDROID_HOME="$HOME/android-sdk"
bash scripts/assemble-pages.sh mobile/capacitor/www
cd mobile/capacitor && npx cap sync android
cd android && ./gradlew assembleDebug
```

Output: `android/app/build/outputs/apk/debug/app-debug.apk`
