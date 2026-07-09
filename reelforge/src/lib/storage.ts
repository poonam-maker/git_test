import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

// Storage abstraction. The `local` driver writes to disk and serves through the
// /api/files route — zero external deps, great for dev. The `s3` driver is a
// stub showing exactly where to wire an S3/R2/MinIO client for production.

export interface StorageDriver {
  readonly name: string;
  put(key: string, data: Buffer, contentType: string): Promise<void>;
  get(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  /** URL the browser can use to fetch the object. */
  url(key: string): string;
}

function newKey(prefix: string, originalName: string): string {
  const ext = path.extname(originalName) || "";
  const id = crypto.randomBytes(12).toString("hex");
  const safePrefix = prefix.replace(/[^a-z0-9/_-]/gi, "");
  return `${safePrefix}/${id}${ext}`;
}

class LocalStorageDriver implements StorageDriver {
  readonly name = "local";
  private root: string;

  constructor() {
    this.root = path.resolve(process.env.LOCAL_STORAGE_DIR || "./storage");
  }

  private full(key: string): string {
    // prevent path traversal
    const clean = key.replace(/\.\.(\/|\\|$)/g, "");
    return path.join(this.root, clean);
  }

  async put(key: string, data: Buffer): Promise<void> {
    const full = this.full(key);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, data);
  }

  async get(key: string): Promise<Buffer> {
    return fs.readFile(this.full(key));
  }

  async delete(key: string): Promise<void> {
    await fs.rm(this.full(key), { force: true });
  }

  url(key: string): string {
    return `/api/files/${encodeURI(key)}`;
  }
}

// S3-compatible driver. Works with AWS S3, Cloudflare R2, and MinIO — set
// S3_ENDPOINT for the latter two (which also need path-style addressing).
// The AWS SDK is imported lazily so it never loads in local-driver mode.
//
// url() returns the gated /api/files path (streamed via get + auth check) so
// private videos/exports stay private. For heavy traffic you'd swap this for a
// short-lived presigned GET (@aws-sdk/s3-request-presigner) — noted below.
class S3StorageDriver implements StorageDriver {
  readonly name = "s3";
  private bucket: string;
  private clientPromise: Promise<import("@aws-sdk/client-s3").S3Client> | null = null;

  constructor() {
    this.bucket = process.env.S3_BUCKET || "";
    if (!this.bucket) {
      throw new Error("STORAGE_DRIVER=s3 requires S3_BUCKET to be set.");
    }
  }

  private client(): Promise<import("@aws-sdk/client-s3").S3Client> {
    if (!this.clientPromise) {
      this.clientPromise = (async () => {
        const { S3Client } = await import("@aws-sdk/client-s3");
        const endpoint = process.env.S3_ENDPOINT || undefined;
        const creds =
          process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY
            ? {
                accessKeyId: process.env.S3_ACCESS_KEY_ID,
                secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
              }
            : undefined; // fall back to the default AWS credential chain (IAM role)
        return new S3Client({
          region: process.env.S3_REGION || "us-east-1",
          endpoint,
          forcePathStyle: Boolean(endpoint), // required for MinIO / some R2 setups
          credentials: creds,
        });
      })();
    }
    return this.clientPromise;
  }

  async put(key: string, data: Buffer, contentType: string): Promise<void> {
    const { PutObjectCommand } = await import("@aws-sdk/client-s3");
    const client = await this.client();
    await client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: data,
        ContentType: contentType,
      })
    );
  }

  async get(key: string): Promise<Buffer> {
    const { GetObjectCommand } = await import("@aws-sdk/client-s3");
    const client = await this.client();
    const res = await client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key })
    );
    if (!res.Body) throw new Error(`S3 object has no body: ${key}`);
    const bytes = await res.Body.transformToByteArray();
    return Buffer.from(bytes);
  }

  async delete(key: string): Promise<void> {
    const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
    const client = await this.client();
    await client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key })
    );
  }

  url(key: string): string {
    return `/api/files/${encodeURI(key)}`;
  }
}

let cached: StorageDriver | null = null;

export function getStorage(): StorageDriver {
  if (cached) return cached;
  const driver = (process.env.STORAGE_DRIVER || "local").toLowerCase();
  cached = driver === "s3" ? new S3StorageDriver() : new LocalStorageDriver();
  return cached;
}

export { newKey };
