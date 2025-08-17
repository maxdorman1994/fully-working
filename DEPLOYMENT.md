# Deployment Instructions

## The Problem

Your deployment was running `npm run dev` (Vite development server) instead of `npm run start` (production server), causing React useState errors.

## Quick Fix Applied

1. ✅ **Removed TooltipProvider** temporarily to stop immediate errors
2. ✅ **Added production start script** with environment checks
3. ✅ **Created deployment configs** (Dockerfile, fly.toml)

## Deploy Commands

### For Fly.io Deployment:

```bash
# Build the application
npm run build

# Deploy to Fly.io (this will use the new configs)
fly deploy

# Or if using Dockerfile:
fly deploy --dockerfile Dockerfile
```

### For Other Platforms:

```bash
# 1. Build the application
npm run build

# 2. Set environment variable
export NODE_ENV=production

# 3. Start production server
npm run start
```

## Verification

After deployment, check:

1. ✅ **No more `.vite/deps/` URLs** in browser network tab
2. ✅ **Assets load from `/assets/`** instead
3. ✅ **App loads without React errors**

## Files Created:

- `Dockerfile` - Production container setup
- `fly.toml` - Fly.io deployment config
- `start-production.js` - Production start script with checks
- `DEPLOYMENT.md` - This file

## Next Steps:

1. **Deploy using the above commands**
2. **Verify the fix works**
3. **Re-add TooltipProvider** later if needed (once deployment is fixed)
