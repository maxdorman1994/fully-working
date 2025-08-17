# Mapbox Setup Instructions

## Current Status

✅ Your map is working with a demo Mapbox token that allows limited usage.

## For Production Use

To use your own Mapbox token (recommended for production):

1. **Sign up for Mapbox** (free tier available):

   - Go to https://account.mapbox.com/auth/signup/
   - Create a free account

2. **Get your access token**:

   - Visit https://account.mapbox.com/access-tokens/
   - Copy your "Default public token"

3. **Update the token in your app**:

   - Open `client/pages/Map.tsx`
   - Replace the `MAPBOX_TOKEN` constant with your token:

   ```typescript
   const MAPBOX_TOKEN = "your-token-here";
   ```

4. **Alternative: Use environment variable** (recommended):
   - Add to your `.env` file: `VITE_MAPBOX_TOKEN=your-token-here`
   - Update the code to use: `import.meta.env.VITE_MAPBOX_TOKEN`

## Free Tier Limits

- 50,000 map loads per month
- 50,000 requests per month
- Perfect for personal/family projects

## Features Included

- ✅ Interactive Scotland map
- ✅ Outdoor/satellite map styles
- ✅ Click to add pins
- ✅ Zoom, pan, and explore
- ✅ Professional map quality
- ✅ Mobile responsive
- ✅ Fly-to locations from sidebar
