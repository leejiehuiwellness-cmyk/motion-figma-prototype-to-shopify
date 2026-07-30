# Privacy

Motion: Figma Prototype to Shopify does not send Figma file data, user data, images, text, analytics, or generated Shopify code to any external server.

The plugin runs inside Figma and reads only the current file selection needed to generate the export. The manifest declares no network access:

```json
"networkAccess": {
  "allowedDomains": ["none"]
}
```

Generated Liquid, CSS, JavaScript, assets, ZIP files, and reports are created locally in the plugin UI and downloaded by the user.

## Data Read by the Plugin

- Selected Figma node names
- Selected node hierarchy
- Layout and style properties
- Text layer contents
- Image fills and vector export data
- Prototype reactions, triggers, actions, destinations, transitions, duration, and easing

## Data Not Collected

- No account credentials
- No Shopify admin data
- No payment data
- No analytics events
- No external API requests
- No server-side storage

