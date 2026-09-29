/**
 * Utility functions for link sanitization and auto-linking in email updates and rich text content.
 */

/**
 * Ensures that all URLs in HTML content are properly hyperlinked and synchronized.
 * 1. If an <a> tag contains a URL as its text (e.g. starts with http://, https://, or www.),
 *    its href attribute is automatically synchronized to that exact URL.
 * 2. Any unlinked plain text URLs (not inside an <a> tag) are automatically converted into clickable <a> tags.
 */
export function sanitizeAndFixLinks(html: string): string {
  if (!html) return html;

  // Step 1: Synchronize existing <a> tags where the inner text is a URL
  let processed = html.replace(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi, (fullMatch, attrs, innerText) => {
    // Strip HTML tags from inner text to get the actual visible URL text
    const cleanText = innerText.replace(/<[^>]*>?/gm, '').trim();

    // Check if the visible text is a URL
    const urlMatch = cleanText.match(/^((https?:\/\/)|(www\.))[^\s<]+/i);
    if (urlMatch) {
      let targetUrl = urlMatch[0];
      if (!targetUrl.toLowerCase().startsWith('http')) {
        targetUrl = 'https://' + targetUrl;
      }

      // Replace or set href attribute to match the target URL
      let newAttrs = attrs;
      if (/href=["'][^"']*["']/i.test(newAttrs)) {
        newAttrs = newAttrs.replace(/href=["'][^"']*["']/i, `href="${targetUrl}"`);
      } else {
        newAttrs = ` href="${targetUrl}"` + newAttrs;
      }

      // Ensure target="_blank" and rel="noopener noreferrer"
      if (!/target=["'][^"']*["']/i.test(newAttrs)) {
        newAttrs += ' target="_blank"';
      }
      if (!/rel=["'][^"']*["']/i.test(newAttrs)) {
        newAttrs += ' rel="noopener noreferrer"';
      }

      return `<a${newAttrs}>${innerText}</a>`;
    }

    return fullMatch;
  });

  // Step 2: Auto-link any plain URLs not already inside an <a> tag
  const parts = processed.split(/(<a\b[^>]*>[\s\S]*?<\/a>)/gi);
  for (let i = 0; i < parts.length; i += 2) {
    // Even indices are text outside of <a> tags
    parts[i] = parts[i].replace(/(((https?:\/\/)|(www\.))[^\s<"']+)/gi, (url) => {
      let href = url;
      if (!href.toLowerCase().startsWith('http')) {
        href = 'https://' + href;
      }
      return `<a href="${href}" target="_blank" rel="noopener noreferrer">${url}</a>`;
    });
  }

  return parts.join('');
}
