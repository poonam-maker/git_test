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

class S3StorageDriver implements StorageDriver {
  readonly name = "s3";
  // NOTE: install `@aws-sdk/client-s3` and implement these for production.
  // Kept as a clearly-marked stub so `STORAGE_DRIVER=s3` fails loud, not silent.
  async put(): Promise<void> {
    throw new Error("S3 driver not implemented — install @aws-sdk/client-s3 and wire it here.");
  }
  async get(): Promise<Buffer> {
    throw new Error("S3 driver not implemented.");
  }
  async delete(): Promise<void> {
    throw new Error("S3 driver not implemented.");
  }
  url(key: string): string {
    const endpoint = process.env.S3_ENDPOINT || `https://${process.env.S3_BUCKET}.s3.${process.env.S3_REGION}.amazonaws.com`;
    return `${endpoint}/${key}`;
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
