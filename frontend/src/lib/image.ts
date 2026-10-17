import { pb } from "./pocketbase";

export function resolveImageUrl(record: {
  id: string;
  collectionId?: string;
  collectionName?: string;
  image?: string;
  image_url?: string;
}): string {
  if (record.image) {
    return pb.files.getURL(record as any, record.image);
  }
  if (record.image_url) {
    return record.image_url;
  }
  // Default fallback banner
  return "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&auto=format&fit=crop&q=80";
}
