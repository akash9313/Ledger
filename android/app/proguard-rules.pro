# Add project specific ProGuard rules here.

# React Native & Native Bridge
-keep class com.facebook.react.** { *; }
-keepclassmembers class * {
    @com.facebook.react.bridge.ReactMethod <methods>;
    @com.facebook.react.bridge.ReactProp <methods>;
}

# Custom Application & Native Widget Module
-keep class com.trustosapp.** { *; }

# Community & UI Libraries
-keep class com.reactnativecommunity.** { *; }
-keep class com.horcrux.svg.** { *; }
-keep class com.oblador.vectoricons.** { *; }
-keep class com.swmansion.** { *; }

# Firebase Cloud Firestore & Auth
-keep class com.google.firebase.** { *; }
-dontwarn com.google.firebase.**
