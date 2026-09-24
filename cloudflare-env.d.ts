declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    VAPID_PRIVATE_JWK?: string;
    VAPID_PUBLIC_KEY?: string;
  }
}
