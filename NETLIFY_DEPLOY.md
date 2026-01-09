# Netlify Deployment Guide

## Problem Fixed
✅ **MIME Type Error** - Fixed with `netlify.toml` and `_headers` file

## Files Created
- `netlify.toml` - Netlify configuration
- `public/_headers` - HTTP headers for correct MIME types

## Deployment Steps

### Option 1: Deploy via Netlify Dashboard

1. **Build your project locally first** (to test):
   ```bash
   npm run build
   ```

2. **Go to Netlify Dashboard**:
   - Visit: https://app.netlify.com
   - Click "Add new site" → "Deploy manually"

3. **Drag and drop** the `dist` folder

4. **Done!** Your site should work now.

---

### Option 2: Connect GitHub Repository

1. **Push to GitHub** (if not already):
   ```bash
   git add .
   git commit -m "Add Netlify config"
   git push
   ```

2. **In Netlify Dashboard**:
   - Click "Add new site" → "Import an existing project"
   - Connect to GitHub
   - Select your repository
   - **Build settings** (auto-detected):
     - Build command: `npm run build`
     - Publish directory: `dist`
   - Click "Deploy site"

---

### Option 3: Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod
```

---

## Build Settings (Auto-configured)

The `netlify.toml` file automatically configures:

- ✅ **Build command**: `npm run build`
- ✅ **Publish directory**: `dist`
- ✅ **SPA redirects**: All routes → `index.html`
- ✅ **MIME types**: Correct headers for `.js`, `.mjs`, `.wasm` files

---

## Environment Variables

If you need to set environment variables in Netlify:

1. Go to **Site settings** → **Environment variables**
2. Add your variables (they must start with `VITE_`):
   ```
   VITE_LIVEKIT_URL=wss://your-server.livekit.cloud
   VITE_LIVEKIT_API_KEY=your_key
   VITE_LIVEKIT_API_SECRET=your_secret
   ```

3. **Redeploy** after adding variables

---

## Troubleshooting

### Still getting MIME type errors?

1. **Clear Netlify cache**:
   - Site settings → Build & deploy → Clear cache and retry deploy

2. **Check build output**:
   - Make sure `dist` folder contains:
     - `index.html`
     - `assets/` folder with JS/CSS files

3. **Verify headers**:
   - After deploy, check Network tab in browser
   - JS files should have `Content-Type: application/javascript`

### Build fails?

1. **Check Node version**:
   - Netlify uses Node 18 by default
   - Add `.nvmrc` file if you need specific version:
     ```
     18
     ```

2. **Check build logs**:
   - Go to Deploys → Click on failed deploy → View logs

---

## Quick Test

After deployment, test these:

1. ✅ Home page loads
2. ✅ Can join room (Simple mode)
3. ✅ Whiteboard works
4. ✅ Video works (if using Simple WebRTC)
5. ✅ PDF export works

---

## What Was Fixed

The error `Expected a JavaScript-or-Wasm module script but the server responded with a MIME type of "application/octet-stream"` was caused by:

- Netlify serving JS files with wrong MIME type
- **Solution**: Added `netlify.toml` with proper headers
- **Solution**: Added `public/_headers` file for MIME type enforcement

Now Netlify will serve:
- `.js` files as `application/javascript`
- `.mjs` files as `application/javascript`
- `.wasm` files as `application/wasm`

✅ **Fixed!**
