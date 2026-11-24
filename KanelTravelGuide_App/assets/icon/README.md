# Karnel Travels branding

Generated with the built-in image_gen tool on 21 November 2026, using the supplied tourism-logo image as a visual reference.

- `karnel_travels_logo.png`: full logo and KARNEL TRAVELS wordmark; used for legacy Android and iOS icons.
- `app_icon_foreground.png`: transparent symbol without lettering; used for Android adaptive icons on a white background. The foreground is inset to protect it from launcher masks.

Regenerate the platform icons from this app folder:

```powershell
flutter pub get
dart run flutter_launcher_icons
```

Stop and run the app again to install changed launcher resources. Hot Reload does not replace launcher icons.

## Generation prompts

### Logo

Use case: logo-brand. Design a polished original tourism logo for the existing mobile travel app brand KARNEL TRAVELS, using the attached image solely as a visual reference for the motif and general arrangement. A bright golden yellow rising sun with restrained coral-red triangular rays, rounded blue cloud outlines arching above it, balanced green coconut palms at left and right, sweeping green land and a blue river arc underneath. Beneath the emblem, render exact text "KARNEL TRAVELS" in crisp elegant dark navy uppercase lettering, centered, professionally kerned. Similar friendly tropical tourism character as the reference, but sharp simplified original vector-style illustration with coherent line weights and excellent symmetry. Single centered logo on a plain clean white square background, generous clean margins. Large emblem filling around 65% of canvas width, wordmark easy to read. No watermark, no extra words, no mockup, no gradients, no photographic scenery, no app device frame. Produce a production-ready high-resolution square PNG.

### Adaptive-icon foreground

Use case: logo-brand. Create the mobile launcher-icon foreground variant of the provided KARNEL TRAVELS logo. Preserve its golden rising sun, coral-red triangular sun rays, blue rounded cloud outline, green coconut palms at both sides, sweeping green land and blue river arc. Remove the KARNEL TRAVELS wordmark entirely: this asset is symbol only, with no text. Simplify very fine details and remove tiny decorative birds for recognizability at small launcher-icon sizes. Crisp coherent clean flat vector-style shapes, original tourism logo, no shadows, no mockup, no device frame. Center the entire symbol within the middle 60 percent of a square canvas, leaving wide genuinely transparent margins on all sides for Android adaptive-icon masking. Transparent background; no white rectangular tile baked into the image. All parts of the sun and palm canopy must remain inside that central safe region. Maintain exactly the reference brand colors and overall motif. Output high-resolution square PNG with alpha.
