/**
 * deploy-lambda.mjs
 *
 * Despliega la función Remotion Lambda y el site en S3.
 * Ejecuta UNA SOLA VEZ (o cuando cambies la composición).
 *
 * Uso:
 *   node scripts/deploy-lambda.mjs
 *
 * Variables de entorno necesarias (en .env.local):
 *   AWS_ACCESS_KEY_ID
 *   AWS_SECRET_ACCESS_KEY
 *   AWS_REGION  (p.ej. eu-west-1)
 */

import { deployFunction, deploySite, getOrCreateBucket } from "@remotion/lambda";
import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../.env.local") });

const REGION = process.env.AWS_REGION ?? "eu-west-1";
const MEMORY_MB = 2048;
const TIMEOUT_SECONDS = 300; // 5 min max para vídeos largos
const DISK_MB = 2048;

async function main() {
  console.log("🚀 Desplegando Remotion Lambda...");
  console.log(`   Región: ${REGION}`);

  // 1. Crear / obtener bucket S3
  console.log("\n1️⃣  Bucket S3...");
  const { bucketName } = await getOrCreateBucket({ region: REGION });
  console.log(`   ✅ Bucket: ${bucketName}`);

  // 2. Deploy del site (archivos estáticos de la composición)
  console.log("\n2️⃣  Desplegando site en S3...");
  const { serveUrl } = await deploySite({
    bucketName,
    entryPoint: join(__dirname, "../src/remotion/Root.tsx"),
    region: REGION,
    siteName: "eventoo-invitaciones",
    options: { onBundleProgress: (p) => process.stdout.write(`\r   Bundling… ${p}%`) },
  });
  console.log(`\n   ✅ Serve URL: ${serveUrl}`);

  // 3. Deploy de la función Lambda
  console.log("\n3️⃣  Desplegando función Lambda...");
  const { functionName, alreadyExisted } = await deployFunction({
    region: REGION,
    timeoutInSeconds: TIMEOUT_SECONDS,
    memorySizeInMb: MEMORY_MB,
    diskSizeInMb: DISK_MB,
    createCloudWatchLogGroup: true,
  });
  console.log(`   ✅ Función: ${functionName} (${alreadyExisted ? "ya existía" : "creada"})`);

  // 4. Guardar los valores en .env.local
  console.log("\n4️⃣  Guardando variables de entorno...");
  const envPath = join(__dirname, "../.env.local");
  let envContent = readFileSync(envPath, "utf-8");

  const vars = {
    REMOTION_AWS_REGION: REGION,
    REMOTION_BUCKET_NAME: bucketName,
    REMOTION_SERVE_URL: serveUrl,
    REMOTION_FUNCTION_NAME: functionName,
  };

  for (const [key, value] of Object.entries(vars)) {
    const regex = new RegExp(`^${key}=.*$`, "m");
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, `${key}=${value}`);
    } else {
      envContent += `\n${key}=${value}`;
    }
  }

  writeFileSync(envPath, envContent);
  console.log("   ✅ .env.local actualizado");

  console.log("\n✅ Deploy completado:");
  for (const [k, v] of Object.entries(vars)) {
    console.log(`   ${k}=${v}`);
  }
  console.log("\n⚠️  Añade estas variables también en Vercel (Settings → Environment Variables)\n");
}

main().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
