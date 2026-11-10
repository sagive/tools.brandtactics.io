/**
 * Checks whether HTML or text content is considered empty for an SEO update or message.
 * Strips HTML tags, non-breaking spaces, zero-width characters, and whitespace.
 * Returns true if there is actual printable text, an image (<img), or meaningful content.
 */
export function isUpdateContentEmpty(content: string | null | undefined): boolean {
  if (!content) return true;
  
  // If there is an image embedded, it's not empty
  if (/<img\b[^>]*>/i.test(content)) {
    return false;
  }

  // Remove HTML tags, &nbsp;, &#160;, \u00a0, zero-width spaces, and whitespace
  const clean = content
    .replace(/<[^>]*>/g, ' ')
    .replace(/&(nbsp|#160|#xa0);/gi, ' ')
    .replace(/[\u00a0\u200B\u200C\u200D\uFEFF]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return clean.length === 0;
}

