/**
 * Utility functions for link sanitization and auto-linking in email updates and rich text content.
 */

/**
 * Ensures that all URLs in HTML content are properly hyperlinked and synchronized.
 * 1. If an <a> tag contains a URL as its visible text (e.g. starts with http://, https://, or www.),
 *    its href attribute is automatically synchronized to that exact URL.
 * 2. Any unlinked plain text URLs in text nodes (strictly outside of any HTML tags, attributes, and <a> tags)
 *    are automatically converted into clickable <a> tags.
 * 3. Never modifies HTML tags or their attributes (such as <img src="..."> or <div style="...">).
 */
export function sanitizeAndFixLinks(html: string): string {
  if (!html) return html;

  // Step 1: Synchronize existing <a> tags where the inner text is a URL
  const processed = html.replace(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi, (fullMatch, attrs, innerText) => {
    // Strip HTML tags from inner text to get the actual visible URL text
    const cleanText = innerText.replace(/<[^>]+>/g, '').trim();

    // Check if the visible text is strictly a URL (starts with http://, https://, or www. without internal whitespace)
    if (/^(https?:\/\/|www\.)[^\s]+$/i.test(cleanText)) {
      let targetUrl = cleanText.replace(/[.,;:!?)\]]+$/, '');
      if (!/^https?:\/\//i.test(targetUrl)) {
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

  // Step 2: Auto-link any plain URLs in text nodes (strictly OUTSIDE of any HTML tag and outside <a>...</a>)
  // Tokenize by HTML tags: (<...>)
  const tokens = processed.split(/(<[^>]+>)/g);
  let insideAnchor = false;
  let insideIgnoredTag = false; // e.g., <style>, <script>, <head>

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (!token) continue;

    if (token.startsWith('<')) {
      // It is an HTML tag
      if (/^<a\b/i.test(token)) {
        insideAnchor = true;
      } else if (/^<\/a\s*>/i.test(token)) {
        insideAnchor = false;
      } else if (/^<(style|script|head)\b/i.test(token)) {
        insideIgnoredTag = true;
      } else if (/^<\/(style|script|head)\s*>/i.test(token)) {
        insideIgnoredTag = false;
      }
      // Never alter attributes inside any HTML tag!
      continue;
    }

    // It is a text node
    if (!insideAnchor && !insideIgnoredTag) {
      // Auto-link URLs in plain text:
      tokens[i] = token.replace(/(^|[\s(>])((?:https?:\/\/|www\.)[^\s<>"']+)/gi, (match, prefix, url) => {
        let trailingPunct = '';
        const punctMatch = url.match(/[.,;:!?)\]]+$/);
        if (punctMatch) {
          trailingPunct = punctMatch[0];
          url = url.slice(0, -trailingPunct.length);
        }

        if (!url) return match;

        let href = url;
        if (!/^https?:\/\//i.test(href)) {
          href = 'https://' + href;
        }

        return `${prefix}<a href="${href}" target="_blank" rel="noopener noreferrer">${url}</a>${trailingPunct}`;
      });
    }
  }

  return tokens.join('');
}

/**
 * Repairs email HTML if an earlier version accidentally corrupted the DOCTYPE or <html> tag
 * by turning W3C DTD or xmlns schema URLs into <a> tags.
 */
export function repairCorruptedEmailDoctype(html: string): string {
  if (!html) return html;
  return html.replace(
    /<!DOCTYPE html PUBLIC "[^"]*?" "<a href="[^"]*?"[^>]*?>http:\/\/www\.w3\.org\/TR\/xhtml1\/DTD\/xhtml1-transitional\.dtd<\/a>">\s*<html xmlns="<a href="[^"]*?"[^>]*?>http:\/\/www\.w3\.org\/1999\/xhtml<\/a>"/gi,
    '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">\n<html xmlns="http://www.w3.org/1999/xhtml"'
  );
}
