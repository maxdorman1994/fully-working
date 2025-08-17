# Setup Guide: Cloudflare Images + Supabase for "A Wee Adventure"

This guide sets up the perfect combination for your Scottish adventure journal:
- **Cloudflare Images**: Automatic optimization, resizing, global CDN for photos
- **Supabase**: Real-time database, authentication, and cross-device sync

## 🖼️ Step 1: Setup Cloudflare Images

### 1.1 Enable Cloudflare Images
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Select your account
3. Navigate to **Images** in the sidebar
4. Click **"Get Started"** to enable Cloudflare Images

### 1.2 Get Account Information
1. **Account ID**: Found on the right sidebar of any Cloudflare page
2. **Images API Token**: 
   - Go to **My Profile** > **API Tokens**
   - Click **"Create Token"**
   - Use **"Cloudflare Images"** template or create custom with:
     - **Permissions**: `Cloudflare Images:Edit`
     - **Account Resources**: Include your account

### 1.3 Configure Image Variants (Optional)
Cloudflare Images automatically creates optimized variants:
- **Public**: Original size, optimized format
- **Thumbnail**: 200x200px for previews
- **Mobile**: 800px width for mobile devices

## 🗄️ Step 2: Setup Supabase

### 2.1 Create Supabase Project
1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Click **"New Project"**
3. Choose your organization
4. Set project details:
   - **Name**: "A Wee Adventure" or your preferred name
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to your family

### 2.2 Run Database Schema
1. In Supabase dashboard, go to **SQL Editor**
2. Copy and paste the contents of `supabase/schema.sql`
3. Click **"Run"** to create all tables and functions

### 2.3 Get Supabase Credentials
1. Go to **Settings** > **API**
2. Copy these values:
   - **Project URL**
   - **Project API Key** (anon/public key)

## ⚙️ Step 3: Environment Variables

### 3.1 Required Environment Variables
Set these in your production environment:

```bash
# Cloudflare Images
CLOUDFLARE_ACCOUNT_ID=your-account-id-here
CLOUDFLARE_IMAGES_TOKEN=your-images-token-here

# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3.2 Development Setup
For local development, create a `.env` file:

```bash
# .env file (never commit to git!)
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_IMAGES_TOKEN=your-images-token

VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 🔄 Step 4: How Cross-Device Sync Works

### 4.1 Complete Data Flow
```
📱 Device A → 📸 Photo Processing → ☁️ Cloudflare Images
                ↓
            📝 Journal Entry → 🗄️ Supabase Database
                ↓
📱 Device B ← 🔄 Real-time Sync ← 📡 Supabase Realtime
```

### 4.2 Technical Architecture

#### Photo Pipeline:
1. **Upload**: HEIC → JPEG conversion → Compression
2. **Store**: Upload to Cloudflare Images
3. **Optimize**: Automatic format conversion (WebP, AVIF)
4. **Deliver**: Global CDN with optimal format per device

#### Data Sync:
1. **Create Entry**: Store journal data in Supabase
2. **Real-time**: Supabase broadcasts changes
3. **Cross-Device**: All devices receive updates instantly
4. **Offline**: Changes sync when back online

### 4.3 URL Structure
```
Cloudflare Images URL:
https://imagedelivery.net/<account-hash>/<image-id>/<variant>

Example:
https://imagedelivery.net/abc123/wee-adventure-2025-08-03-uuid/public
```

## 💰 Cost Breakdown

### Cloudflare Images Pricing:
- **Storage**: $5/month for up to 100,000 images
- **Delivery**: $1 per 100,000 requests
- **Transformations**: Included (automatic optimization)

### Supabase Pricing:
- **Free Tier**: 500MB database, 1GB bandwidth, 50MB file uploads
- **Pro Plan**: $25/month for 8GB database, 250GB bandwidth

### Family Usage Estimate:
- **500 photos/month**: ~$0.10 in delivery costs
- **Database**: Fits comfortably in free tier
- **Total**: ~$5-6/month for heavy usage

## 🚀 Step 5: Testing Your Setup

### 5.1 Test Cloudflare Images
```bash
# Test upload (replace with your credentials)
curl -X POST \
  "https://api.cloudflare.com/client/v4/accounts/{account_id}/images/v1" \
  -H "Authorization: Bearer {token}" \
  -F "file=@test-photo.jpg"
```

### 5.2 Test Supabase Connection
1. Open your journal app
2. Try creating a new entry
3. Check Supabase dashboard for data
4. Open app on second device to test sync

### 5.3 Full Integration Test
1. **Upload Photo**: Add photos to journal entry
2. **Create Entry**: Submit complete journal entry  
3. **Verify Storage**: Check Cloudflare Images dashboard
4. **Verify Database**: Check Supabase tables
5. **Test Sync**: View entry on different device

## 🛠️ Step 6: Advanced Configuration

### 6.1 Custom Image Variants
Add custom variants for different use cases:

```javascript
// In Cloudflare Images dashboard, create variants:
{
  "thumbnail": { "width": 200, "height": 200, "fit": "cover" },
  "gallery": { "width": 800, "height": 600, "fit": "scale-down" },
  "fullscreen": { "width": 1920, "height": 1080, "fit": "scale-down" }
}
```

### 6.2 Supabase Row Level Security
For family sharing with privacy:

```sql
-- Allow family members to read all entries
CREATE POLICY "Family can read entries" ON journal_entries
  FOR SELECT USING (true);

-- Only allow authenticated users to create/edit
CREATE POLICY "Auth users can manage entries" ON journal_entries
  FOR ALL USING (auth.role() = 'authenticated');
```

### 6.3 Backup Strategy
- **Cloudflare Images**: Built-in redundancy and global replication
- **Supabase**: Automatic daily backups (Pro plan)
- **Export Function**: Download all data as JSON

## 🔧 Troubleshooting

### Common Issues:

#### Photos Not Uploading
- Check Cloudflare Images API token permissions
- Verify account ID is correct
- Check file size limits (10MB for Cloudflare Images)

#### Database Connection Errors
- Verify Supabase URL and API key
- Check if RLS policies are blocking access
- Ensure tables were created correctly

#### Real-time Sync Not Working
- Check if Supabase Realtime is enabled
- Verify network connectivity
- Check browser console for WebSocket errors

## 📱 Mobile App Ready

This setup provides the foundation for native mobile apps:

1. **Shared API**: Same endpoints work for web and mobile
2. **Optimized Images**: Cloudflare delivers optimal formats per device
3. **Offline Sync**: Supabase handles offline queuing
4. **Real-time**: Push notifications via Supabase Edge Functions

## 🎯 Next Steps

1. **Configure your accounts** using the steps above
2. **Run the schema** in Supabase SQL Editor
3. **Set environment variables** in your deployment
4. **Test photo upload** in the journal
5. **Invite family members** to start documenting adventures!

Your Scottish adventure journal now has enterprise-grade photo storage with automatic optimization and real-time family sync! 🏴󠁧󠁢󠁳󠁣󠁴󠁿📸✨

---

## 🔗 Quick Links

- [Cloudflare Images Docs](https://developers.cloudflare.com/images/)
- [Supabase Docs](https://supabase.com/docs)
- [Database Schema](./supabase/schema.sql)
- [Photo Upload API](../server/routes/photos.ts)
- [Journal Service](../client/lib/journalService.ts)
