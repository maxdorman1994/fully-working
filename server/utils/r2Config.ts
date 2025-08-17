/**
 * Cloudflare Images Configuration Validator
 * Validates and provides helpful error messages for Cloudflare Images setup
 */

export interface CloudflareImagesConfig {
  accountId: string;
  token: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  config?: CloudflareImagesConfig;
}

/**
 * Validate Cloudflare Images configuration from environment variables
 */
export function validateCloudflareImagesConfig(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required environment variables
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_IMAGES_TOKEN;

  // Check required fields
  if (!accountId) {
    errors.push('CLOUDFLARE_ACCOUNT_ID is required. Get this from your Cloudflare dashboard.');
  } else if (accountId === 'your-cloudflare-account-id') {
    errors.push('CLOUDFLARE_ACCOUNT_ID contains placeholder value - please set your actual account ID');
  }

  if (!token) {
    errors.push('CLOUDFLARE_IMAGES_TOKEN is required. Create an API token with Cloudflare Images permissions.');
  } else if (token === 'your-cloudflare-images-token') {
    errors.push('CLOUDFLARE_IMAGES_TOKEN contains placeholder value - please set your actual API token');
  }

  const valid = errors.length === 0;
  const config = valid ? {
    accountId: accountId!,
    token: token!
  } : undefined;

  return {
    valid,
    errors,
    warnings,
    config
  };
}

/**
 * Get Cloudflare Images configuration status for debugging
 */
export function getImagesStatus(): {
  configured: boolean;
  message: string;
  helpUrl: string;
} {
  const validation = validateCloudflareImagesConfig();

  if (validation.valid) {
    return {
      configured: true,
      message: `Cloudflare Images configured successfully. Account: ${validation.config!.accountId}`,
      helpUrl: '/docs/setup-guide.md'
    };
  }

  if (validation.errors.length > 0) {
    return {
      configured: false,
      message: `Cloudflare Images configuration errors: ${validation.errors.join(', ')}`,
      helpUrl: '/docs/setup-guide.md'
    };
  }

  return {
    configured: false,
    message: 'Cloudflare Images not configured - photos will use local placeholders',
    helpUrl: '/docs/setup-guide.md'
  };
}

/**
 * Log Cloudflare Images configuration status on server start
 */
export function logImagesStatus(): void {
  const validation = validateCloudflareImagesConfig();

  console.log('\n📸 Photo Storage Configuration:');
  console.log('================================');

  if (validation.valid) {
    console.log('✅ Cloudflare Images configured successfully');
    console.log(`🏢 Account: ${validation.config!.accountId}`);
    console.log('🌐 Global CDN with automatic optimization enabled');
    console.log('📱 HEIC support with automatic conversion');

    if (validation.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      validation.warnings.forEach(warning => console.log(`   ${warning}`));
    }
  } else {
    console.log('❌ Cloudflare Images not configured');
    console.log('📝 Photos will use local placeholders');
    console.log('\n🔧 Configuration errors:');
    validation.errors.forEach(error => console.log(`   • ${error}`));
    console.log('\n📖 Setup guide: docs/setup-guide.md');
    console.log('🛠️  Environment variables needed:');
    console.log('   CLOUDFLARE_ACCOUNT_ID=your-account-id');
    console.log('   CLOUDFLARE_IMAGES_TOKEN=your-images-token');
  }
  console.log('================================\n');
}

// Keep old function names for compatibility
export const logR2Status = logImagesStatus;
export const getR2Status = getImagesStatus;

/**
 * Generate example environment variables
 */
export function generateExampleEnv(): string {
  return `
# Cloudflare Images Photo Storage Configuration
# Get these values from your Cloudflare dashboard

# Required: Your Cloudflare Account ID
CLOUDFLARE_ACCOUNT_ID=your-account-id

# Required: Cloudflare Images API token
CLOUDFLARE_IMAGES_TOKEN=your-images-token

# Supabase Configuration (for database)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Setup Guide: docs/setup-guide.md
`.trim();
}
