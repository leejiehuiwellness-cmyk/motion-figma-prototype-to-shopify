# Today Ship Checklist

Use this checklist to get Motion: Figma Prototype to Shopify running locally today and ready for Figma Community submission.

## A. Already Prepared in This Repo

- Local Figma plugin manifest: `manifest.json`
- Plugin main code: `code.js`
- Plugin UI: `ui.html`
- Runtime validation: `npm run validate`
- Marketplace PNG icon: `marketplace-assets/icon.png`
- Marketplace PNG cover: `marketplace-assets/cover.png`
- Privacy note: `PRIVACY.md`
- Listing copy: `MARKETPLACE_SUBMISSION.md`
- Copy-ready Figma marketplace fields: `FIGMA_MARKETPLACE_COPY_READY.md`
- Onboarding guide: `ONBOARDING.md`
- Shopify copy/paste guide: `SHOPIFY_COPY_PASTE_GUIDE.md`
- Example Shopify section: `examples/example-shopify-section.liquid`
- Packaged project ZIP: `dist/motion-figma-prototype-to-shopify-plugin.zip`
- Export report includes raw Figma prototype reactions for animation handoff fidelity
- GitHub repo created: https://github.com/leejiehuiwellness-cmyk/motion-figma-prototype-to-shopify

## B. Run Locally in Figma Desktop

1. Open Figma Desktop on Windows.
2. Open a Figma Design file.
3. Right-click the canvas.
4. Choose Plugins > Development > Import plugin from manifest.
5. Select:

```text
C:\Users\User\Documents\Figma Prototype to Shopify - Motion\manifest.json
```

6. In Figma, select the desktop frame, section, component, component set, instance, group, or a layer inside a component/instance.
7. Run Plugins > Development > Motion: Figma Prototype to Shopify.
8. Click Set Desktop.
9. Optional: select the mobile frame/section and click Set Mobile.
10. Choose Language label.
11. Click Generate export.
12. Open the Copy Code tab.
13. Click Copy Code.

## C. Paste into Shopify

1. Open Shopify Admin.
2. Go to Online Store > Themes.
3. Open the development theme's Edit code screen.
4. In Sections, add a new section.
5. Name it:

```text
motion-figma-prototype-to-shopify
```

6. Paste the full Liquid copied from the plugin.
7. Save.
8. Go to Customize theme.
9. Add Motion: Figma Prototype to Shopify to a page.
10. Configure product, collection, and menu settings if shown.
11. Save and preview desktop/mobile.

## D. Submit to Figma Community

Figma requires this part to happen inside your Figma Desktop account.

1. Enable two-factor authentication on your Figma account if not already enabled.
2. In Figma Desktop, go to Plugins > Manage plugins.
3. Find Motion: Figma Prototype to Shopify under Development.
4. Click Publish.
5. If Figma asks for a plugin ID or says the current ID is invalid, let Figma generate one and update `manifest.json`.
6. Use listing copy from `MARKETPLACE_SUBMISSION.md`.
7. Upload:

```text
marketplace-assets/icon.png
marketplace-assets/cover.png
```

8. Use `PRIVACY.md` for the data/security disclosure.
9. Add your real support contact.
10. Submit for review.

## E. Push Source to GitHub

The GitHub repository exists, but pushing the project files publishes this local payload externally. After explicit approval, run:

```bash
git push -u origin main
```

## F. Reality Check

Local development plugin visibility is immediate under Plugins > Development after importing `manifest.json`.

Public marketplace visibility is not immediate. Figma's review process is required before the plugin appears publicly in Figma Community search.
