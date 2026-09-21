/**
 * A scan saved in the app's library.
 * `pages` and `pdf` are stored relative to the app's private Library directory so they
 * stay valid when the OS moves the app container (e.g. after an iOS update).
 */
export interface ScannedDocument {
  id: string;
  title: string;
  createdAt: number;
  pages: string[];
  pdf: string | null;
  /** Path (relative to the public Documents directory) of the copy visible in Files / file manager. */
  savedToFiles?: string | null;
  /** Whether the page images were also saved to the photo gallery. */
  savedToPhotos?: boolean;
}
