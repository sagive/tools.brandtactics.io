/**
 * Completely removes any <img> tags containing base64 (data:image/...) URIs from HTML content.
 */
export function removeBase64Images(htmlContent: string): string {
  if (!htmlContent || typeof htmlContent !== 'string') return htmlContent || '';
  if (!htmlContent.includes('data:image/')) return htmlContent;

  // Match and remove <img> tags containing base64 data URIs
  return htmlContent.replace(/<img[^>]*src=["']data:image\/[^"']+["'][^>]*\s*\/?>/gi, '');
}

/**
 * Legacy alias / wrapper to ensure compatibility across existing calls
 */
export async function uploadAndReplaceBase64Images(
  htmlContent: string, 
  clientId: string = 'general'
): Promise<string> {
  return removeBase64Images(htmlContent);
}
