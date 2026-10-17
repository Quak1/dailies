import PocketBase from 'pocketbase'

export const pb = new PocketBase('/')

export function resolveImageUrl(item: any): string {
  if (!item) return ''
  
  // File upload on PocketBase
  const file = item.image_file || item.banner_file
  if (file && item.id) {
    return pb.files.getURL(item, file)
  }
  
  // URL field
  if (item.image_url) return item.image_url
  if (item.banner_image_url) return item.banner_image_url
  
  // Placeholder gradient
  return 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80'
}
