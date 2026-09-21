/** Raw output of a native scan: absolute file:// URIs in the cache directory. */
export interface ScanResult {
  images: string[];
  pdf: string | null;
}
