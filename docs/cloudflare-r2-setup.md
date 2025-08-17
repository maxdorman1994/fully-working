# Cloudflare R2 Photo Storage Setup Guide

This guide walks you through setting up Cloudflare R2 storage for your "A Wee Adventure" journal to enable photo sync across devices.

## 🏗️ Step 1: Create Cloudflare R2 Bucket

### 1.1 Access Cloudflare Dashboard

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Log in to your account (create one if needed)
3. Navigate to **R2 Object Storage** in the sidebar

### 1.2 Create Your Bucket

1. Click **"Create bucket"**
2. **Bucket name**: `wee-adventure-photos` (or your preferred name)
3. **Location**: Choose closest to your users (e.g., "Eastern North America", "Western Europe")
4. Click **"Create bucket"**

### 1.3 Configure Public Access (Optional)

To make photos accessible via direct URLs:

1. Go to your bucket settings
2. Click **"Settings"** tab
3. Under **"Public access"**, click **"Allow Access"**
4. Note the public URL format: `https://pub-xxxxxxxxxxxx.r2.dev`

## 🔐 Step 2: Create API Credentials

### 2.1 Create R2 API Token

1. In Cloudflare dashboard, go to **"My Profile"** (top right)
2. Click **"API Tokens"** tab
3. Click **"Create Token"**
4. Use **"Custom token"** template

### 2.2 Configure Token Permissions

Set these permissions:

- **Zone**: `Zone:Read` (if using custom domain)
- **Account**: `Cloudflare Images:Edit`, `R2:Edit`
- **Account Resources**: Include your account
- **Zone Resources**: Include specific zones (if applicable)

### 2.3 Get Account Information

You'll need:

- **Account ID**: Found on right sidebar of any Cloudflare page
- **Access Key ID**: Generated when creating R2 token
- **Secret Access Key**: Generated when creating R2 token
- **Endpoint URL**: `https://<account-id>.r2.cloudflarestorage.com`

## ⚙️ Step 3: Configure Environment Variables

### 3.1 Production Environment Variables

Set these in your production environment:

```bash
# Required for R2 Storage
CLOUDFLARE_R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
CLOUDFLARE_R2_ACCESS_KEY_ID=your-actual-access-key-id
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your-actual-secret-access-key
CLOUDFLARE_R2_BUCKET_NAME=wee-adventure-photos

# Optional: Custom domain for photos
CLOUDFLARE_R2_PUBLIC_URL=https://photos.your-domain.com
```

### 3.2 Development Environment

For local development, create a `.env` file:

```bash
# .env file (never commit to git!)
CLOUDFLARE_R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
CLOUDFLARE_R2_ACCESS_KEY_ID=your-access-key-here
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your-secret-key-here
CLOUDFLARE_R2_BUCKET_NAME=wee-adventure-photos-dev
CLOUDFLARE_R2_PUBLIC_URL=https://photos.your-domain.com
```

### 3.3 Using Builder.io Environment Variables

In Builder.io projects, set environment variables via:

1. DevServerControl tool (for current session)
2. Project settings (for permanent storage)

```javascript
// Example: Setting via DevServerControl
DevServerControl.set_env_variable(["CLOUDFLARE_R2_ACCESS_KEY_ID", "your-key"]);
```

## 🔄 Step 4: How Cross-Device Sync Works

### 4.1 Photo Upload Flow

```
📱 Device A (iPhone) → 🔄 HEIC Conversion → 📉 Compression → ☁️ R2 Storage
                                                                    ↓
📱 Device B (Android) ← 🔄 Sync & Display ← 📡 Fetch from R2 ← 💾 URL Storage
```

### 4.2 Technical Implementation

#### Photo Processing Pipeline:

1. **Upload**: User selects photos on any device
2. **Convert**: HEIC → JPEG (if needed)
3. **Compress**: Reduce size while maintaining quality
4. **Upload**: Send to Cloudflare R2 storage
5. **Store URL**: Save R2 URL in journal entry
6. **Sync**: Other devices fetch from same R2 URLs

#### File Organization:

```
R2 Bucket: wee-adventure-photos/
├── journal/
│   ├── 2025-08-03/
│   │   ├── uuid1_ben-nevis-summit.jpg
│   │   ├── uuid2_view-from-top.jpg
│   │   └── uuid3_family-photo.jpg
│   ├── 2025-07-28/
│   │   └── uuid4_loch-lomond.jpg
│   └── ...
```

### 4.3 Cross-Device Access

1. **Device Independence**: Photos stored in cloud, not locally
2. **URL-Based Access**: Each photo has unique R2 URL
3. **Automatic Sync**: New entries appear on all devices
4. **Offline Resilience**: Cached photos available offline

## 🌐 Step 5: Custom Domain (Optional)

### 5.1 Set Up Custom Domain

For branded URLs like `https://photos.wee-adventure.com`:

1. **Add Custom Domain** in R2 bucket settings
2. **Configure DNS** in your domain provider:
   ```
   CNAME photos your-bucket.r2.dev
   ```
3. **SSL Certificate**: Cloudflare handles automatically

### 5.2 Update Environment Variable

```bash
CLOUDFLARE_R2_PUBLIC_URL=https://photos.wee-adventure.com
```

## 🔧 Step 6: Testing & Verification

### 6.1 Test Upload

1. Open journal in browser
2. Click "New Entry"
3. Upload a photo (try HEIC if you have iPhone)
4. Check R2 bucket for uploaded file

### 6.2 Test Cross-Device Sync

1. Create entry with photos on Device A
2. Open journal on Device B
3. Verify photos display correctly
4. Check browser Network tab for R2 URLs

### 6.3 Monitor Usage

- **R2 Dashboard**: Monitor storage usage and requests
- **Analytics**: Track upload success rates
- **Costs**: R2 pricing is very competitive

## 💰 Cost Estimation

### Cloudflare R2 Pricing (as of 2024):

- **Storage**: $0.015/GB/month
- **Class A Operations** (uploads): $4.50/million requests
- **Class B Operations** (downloads): $0.36/million requests
- **Egress**: Free (major advantage over AWS S3)

### Example Family Usage:

- **500 photos/month** × 1MB each = 500MB storage
- **Monthly cost**: ~$0.008 (less than 1 penny!)
- **Annual cost**: ~$0.10 for storage + minimal operation costs

## 🛠️ Advanced Configuration

### Environment-Specific Buckets

```bash
# Production
CLOUDFLARE_R2_BUCKET_NAME=wee-adventure-photos

# Staging
CLOUDFLARE_R2_BUCKET_NAME=wee-adventure-photos-staging

# Development
CLOUDFLARE_R2_BUCKET_NAME=wee-adventure-photos-dev
```

### Backup Strategy

1. **Automatic Backup**: R2 has built-in durability
2. **Cross-Region**: Consider multiple regions for global families
3. **Local Backup**: Export feature for local photo backup

## 🔒 Security Best Practices

1. **Least Privilege**: API tokens with minimal required permissions
2. **Token Rotation**: Regularly rotate API keys
3. **Environment Security**: Never commit secrets to git
4. **Access Logs**: Monitor R2 access logs for unusual activity

## 🐛 Troubleshooting

### Common Issues:

#### "Access Denied" Errors

- Check API token permissions
- Verify account ID in endpoint URL
- Ensure bucket name matches exactly

#### Photos Not Loading

- Check CORS configuration
- Verify public access settings
- Test R2 URLs directly in browser

#### Upload Failures

- Check file size limits (50MB max)
- Verify supported file types
- Monitor network connectivity

#### Development vs Production

- Use different bucket names
- Environment variable configuration
- Local fallback when R2 not configured

## 📱 Mobile App Integration (Future)

The current system sets up the foundation for native mobile apps:

1. **Shared R2 URLs**: Same photo URLs work in web and mobile
2. **API Compatibility**: REST endpoints work across platforms
3. **Offline Sync**: Mobile apps can cache and sync later
4. **Push Notifications**: Notify family of new entries

---

## 🎯 Next Steps

1. **Set up your R2 bucket** following steps 1-2
2. **Configure environment variables** in your deployment
3. **Test photo uploads** with the new system
4. **Invite family members** to start documenting adventures!

Your Scottish adventure journal is now ready for unlimited photo storage and seamless cross-device synchronization! 🏴󠁧󠁢󠁳󠁣󠁴󠁿📸
