import { S3Client, PutBucketCorsCommand, GetBucketCorsCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";

dotenv.config();

const { B2_APPLICATION_KEY_ID, B2_APPLICATION_KEY, B2_BUCKET_NAME, B2_ENDPOINT, B2_REGION, VITE_APP_URL } = process.env;

if (!B2_APPLICATION_KEY_ID || !B2_APPLICATION_KEY || !B2_BUCKET_NAME || !B2_ENDPOINT) {
  console.error("❌ Missing required environment variables: B2_APPLICATION_KEY_ID, B2_APPLICATION_KEY, B2_BUCKET_NAME, or B2_ENDPOINT");
  process.exit(1);
}

const s3 = new S3Client({
  endpoint: B2_ENDPOINT,
  region: B2_REGION || "auto",
  credentials: {
    accessKeyId: B2_APPLICATION_KEY_ID,
    secretAccessKey: B2_APPLICATION_KEY,
  },
  forcePathStyle: true,
});

async function setCors() {
  const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:4001",
    "https://*.vercel.app",
    "https://*.railway.app"
  ];
  
  if (VITE_APP_URL) {
    allowedOrigins.push(VITE_APP_URL);
  }

  const corsRules = {
    CORSRules: [
      {
        AllowedOrigins: allowedOrigins,
        AllowedMethods: ["GET", "PUT", "HEAD", "POST"],
        AllowedHeaders: ["*"],
        ExposeHeaders: ["ETag", "Content-Length", "Content-Type"],
        MaxAgeSeconds: 3600,
      }
    ]
  };

  try {
    console.log(`Setting CORS for bucket: ${B2_BUCKET_NAME}`);
    await s3.send(new PutBucketCorsCommand({
      Bucket: B2_BUCKET_NAME,
      CORSConfiguration: corsRules,
    }));
    
    console.log("✅ Successfully set CORS rules.");

    console.log("Verifying CORS rules...");
    const getCorsResponse = await s3.send(new GetBucketCorsCommand({
      Bucket: B2_BUCKET_NAME,
    }));
    console.log("Current CORS configuration:", JSON.stringify(getCorsResponse.CORSRules, null, 2));

  } catch (error) {
    console.error("❌ Failed to set or verify CORS rules.");
    console.error("Error Details:", error);
    console.error("\nSuggestion: Please check if the provided credentials (B2_APPLICATION_KEY_ID and B2_APPLICATION_KEY) have required permissions (like writeFiles or bucket management) on the bucket. Also ensure the bucket name is correct.");
    process.exit(1);
  }
}

setCors();
