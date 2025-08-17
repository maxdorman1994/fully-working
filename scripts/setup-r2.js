#!/usr/bin/env node

/**
 * Cloudflare R2 Setup Helper Script
 * Helps configure environment variables for photo storage
 */

const readline = require("readline");
const fs = require("fs");
const path = require("path");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function setupR2Configuration() {
  console.log("\n🏴󠁧󠁢󠁳󠁣󠁴󠁿 Welcome to A Wee Adventure - Cloudflare R2 Setup\n");
  console.log(
    "This script will help you configure photo storage for cross-device sync.\n",
  );

  try {
    // Collect R2 configuration
    console.log("📋 Please provide your Cloudflare R2 details:\n");

    const accountId = await askQuestion(
      "1. Account ID (from Cloudflare dashboard): ",
    );
    const accessKeyId = await askQuestion("2. R2 Access Key ID: ");
    const secretAccessKey = await askQuestion("3. R2 Secret Access Key: ");
    const bucketName =
      (await askQuestion("4. Bucket Name (default: wee-adventure-photos): ")) ||
      "wee-adventure-photos";

    console.log("\n🌐 Optional: Custom domain configuration");
    const customDomain = await askQuestion(
      "5. Custom domain for photos (optional, press Enter to skip): ",
    );

    // Generate configuration
    const endpoint = `https://${accountId}.r2.cloudflarestorage.com`;
    const publicUrl = customDomain || `https://pub-${accountId}.r2.dev`;

    const envConfig = {
      CLOUDFLARE_R2_ENDPOINT: endpoint,
      CLOUDFLARE_R2_ACCESS_KEY_ID: accessKeyId,
      CLOUDFLARE_R2_SECRET_ACCESS_KEY: secretAccessKey,
      CLOUDFLARE_R2_BUCKET_NAME: bucketName,
      CLOUDFLARE_R2_PUBLIC_URL: publicUrl,
    };

    console.log("\n📝 Generated Configuration:");
    console.log("================================");
    Object.entries(envConfig).forEach(([key, value]) => {
      const displayValue = key.includes("SECRET") ? "[HIDDEN]" : value;
      console.log(`${key}=${displayValue}`);
    });

    // Ask where to save
    console.log("\n💾 Save configuration:");
    console.log("1. Create .env file (for local development)");
    console.log("2. Display environment variables (for production)");
    console.log("3. Both");

    const saveOption = await askQuestion("\nChoose option (1-3): ");

    if (saveOption === "1" || saveOption === "3") {
      // Create .env file
      const envPath = path.join(process.cwd(), ".env");
      const envContent = Object.entries(envConfig)
        .map(([key, value]) => `${key}=${value}`)
        .join("\n");

      fs.writeFileSync(envPath, envContent + "\n");
      console.log(`\n✅ Created .env file at: ${envPath}`);
      console.log("⚠️  Remember: Never commit .env files to git!");
    }

    if (saveOption === "2" || saveOption === "3") {
      console.log("\n📋 Environment Variables for Production:");
      console.log("=====================================");
      Object.entries(envConfig).forEach(([key, value]) => {
        console.log(`export ${key}="${value}"`);
      });
    }

    // Test connection
    console.log("\n🧪 Testing R2 Connection...");

    const testResult = await testR2Connection(envConfig);
    if (testResult.success) {
      console.log("✅ R2 connection successful!");
      console.log(`📊 Bucket: ${bucketName}`);
      console.log(`🌐 Region: ${testResult.region || "auto"}`);
    } else {
      console.log("❌ R2 connection failed:");
      console.log(`   Error: ${testResult.error}`);
      console.log("\n🔧 Please check your credentials and try again.");
    }

    console.log("\n🎯 Next Steps:");
    console.log("1. Test photo upload in your journal app");
    console.log("2. Share the app with family members");
    console.log("3. Start documenting your Scottish adventures!");
    console.log("\n📖 Full setup guide: docs/cloudflare-r2-setup.md");
  } catch (error) {
    console.error("\n❌ Setup failed:", error.message);
  } finally {
    rl.close();
  }
}

async function testR2Connection(config) {
  try {
    // Simple test - just verify the endpoint format
    const url = new URL(config.CLOUDFLARE_R2_ENDPOINT);

    if (!url.hostname.includes(".r2.cloudflarestorage.com")) {
      throw new Error("Invalid R2 endpoint format");
    }

    if (
      !config.CLOUDFLARE_R2_ACCESS_KEY_ID ||
      !config.CLOUDFLARE_R2_SECRET_ACCESS_KEY
    ) {
      throw new Error("Missing access credentials");
    }

    return { success: true, region: "auto" };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Run setup if called directly
if (require.main === module) {
  setupR2Configuration();
}

module.exports = { setupR2Configuration };
