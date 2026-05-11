import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export function linkifyHtml(html: string): string {
  if (typeof document === "undefined") return html;
  const div = document.createElement("div");
  div.innerHTML = html;

  const walk = (node: Node) => {
    if (node.nodeType === 3) {
      // Text node
      const parent = node.parentElement;
      if (parent && (parent.tagName === "A" || parent.closest("a"))) return;

      const text = node.textContent || "";
      const urlRegex = /(((https?:\/\/)|(www\.))[^\s<]+)/gi;
      if (urlRegex.test(text)) {
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = text.replace(urlRegex, (url) => {
          let href = url;
          if (!href.toLowerCase().startsWith("http")) {
            href = "https://" + href;
          }
          return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline underline-offset-4 hover:text-blue-800 transition-colors font-medium cursor-pointer">${url}</a>`;
        });

        while (tempDiv.firstChild) {
          node.parentNode?.insertBefore(tempDiv.firstChild, node);
        }
        node.parentNode?.removeChild(node);
      }
    } else if (node.nodeType === 1) {
      // Element node
      const el = node as HTMLElement;
      if (el.tagName === "A") {
        el.setAttribute("target", "_blank");
        el.setAttribute("rel", "noopener noreferrer");
        el.classList.add("text-blue-600", "underline", "underline-offset-4", "hover:text-blue-800", "transition-colors", "font-medium");
      } else {
        Array.from(node.childNodes).forEach(walk);
      }
    }
  };

  Array.from(div.childNodes).forEach(walk);
  return div.innerHTML;
}
