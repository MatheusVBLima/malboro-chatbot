import { marked } from "marked";
import DOMPurify from "isomorphic-dompurify";

/**
 * Converts markdown text to HTML with proper syntax highlighting
 * This preserves all formatting: bold, italic, code, links, lists, tables, etc.
 *
 * @param markdown - Markdown text to convert
 * @returns Sanitized HTML string
 */
export function markdownToHTML(markdown: string): string {
  if (!markdown || typeof markdown !== "string") {
    return "";
  }

  // Configure marked options
  marked.setOptions({
    breaks: true, // Convert \n to <br>
    gfm: true, // GitHub Flavored Markdown
    mangle: false, // Don't mangle email addresses
  } as any);

  // Convert markdown to HTML (use sync method)
  const html = marked.parse(markdown, { async: false }) as string;

  // Sanitize HTML to prevent XSS attacks
  const sanitizedHTML = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      // Text formatting
      "p", "br", "strong", "b", "em", "i", "u", "s", "sub", "sup",
      // Headings
      "h1", "h2", "h3", "h4", "h5", "h6",
      // Lists
      "ul", "ol", "li",
      // Links and images
      "a", "img",
      // Code blocks
      "code", "pre",
      // Blockquote
      "blockquote",
      // Horizontal rule
      "hr",
      // Tables
      "table", "thead", "tbody", "tr", "th", "td",
      // Span for styling
      "span",
      // Divs
      "div",
    ],
    ALLOWED_ATTR: [
      // Links
      "href", "target", "rel", "title",
      // Images
      "src", "alt", "width", "height", "title",
      // Code blocks
      "class",
      // Spans and divs
      "class", "style",
      // Tables
      "colspan", "rowspan",
    ],
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: [
      "script", "style", "iframe", "object", "embed", "form", "input", "button",
    ],
    FORBID_ATTR: [
      "onclick", "onload", "onerror", "onmouseover", "onmouseout",
    ],
  });

  return sanitizedHTML;
}

/**
 * Enhanced markdown converter that adds syntax highlighting classes to code blocks
 * This provides basic syntax highlighting for common languages
 * 
 * @param markdown - Markdown text to convert
 * @returns HTML with syntax highlighting
 */
export function markdownToHTMLWithSyntax(markdown: string): string {
  const html = markdownToHTML(markdown);
  
  // Add basic syntax highlighting to code blocks
  // This is a simple implementation - for better results, you'd use shiki or highlight.js
  const highlightedHTML = html.replace(
    /<pre><code class="language-(\w+)">([\s\S]*?)<\/code><\/pre>/g,
    (match, lang: string, code: string) => {
      const highlightedCode = highlightSyntax(code.trim(), lang);
      return `<pre><code class="language-${lang}">${highlightedCode}</code></pre>`;
    }
  );

  // Highlight inline code
  return highlightedHTML.replace(
    /<code>([\s\S]*?)<\/code>/g,
    (match, code: string) => {
      return `<code>${highlightInlineCode(code)}</code>`;
    }
  );
}

/**
 * Simple syntax highlighter for code blocks
 * This is a basic implementation - for production, consider using shiki or highlight.js
 */
function highlightSyntax(code: string, lang: string): string {
  // Escape HTML entities
  const escapedCode = escapeHtml(code);
  
  // Simple token-based highlighting
  const highlighted = applySyntaxHighlighting(escapedCode, lang);
  
  return highlighted;
}

/**
 * Apply basic syntax highlighting based on language
 */
function applySyntaxHighlighting(code: string, lang: string): string {
  const keywords = {
    javascript: ["const", "let", "var", "function", "return", "if", "else", "for", "while", "class", "import", "export", "default", "async", "await", "try", "catch", "throw", "new", "this", "true", "false", "null", "undefined"],
    typescript: ["const", "let", "var", "function", "return", "if", "else", "for", "while", "class", "interface", "type", "import", "export", "default", "async", "await", "try", "catch", "throw", "new", "this", "true", "false", "null", "undefined", "string", "number", "boolean"],
    python: ["def", "return", "if", "else", "elif", "for", "while", "class", "import", "from", "as", "try", "except", "raise", "True", "False", "None", "and", "or", "not", "in", "is"],
    java: ["public", "private", "protected", "class", "interface", "void", "return", "if", "else", "for", "while", "try", "catch", "throw", "new", "this", "true", "false", "null", "static", "final"],
  };

  const langKeywords = keywords[lang.toLowerCase() as keyof typeof keywords] || [];

  // Highlight strings
  let highlighted = code.replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g, '<span class="token-string">$&</span>');

  // Highlight numbers
  highlighted = highlighted.replace(/\b(\d+\.?\d*)\b/g, '<span class="token-number">$1</span>');

  // Highlight keywords
  if (langKeywords.length > 0) {
    const keywordPattern = new RegExp(`\\b(${langKeywords.join("|")})\\b`, "g");
    highlighted = highlighted.replace(keywordPattern, '<span class="token-keyword">$1</span>');
  }

  // Highlight comments
  if (lang === "javascript" || lang === "typescript" || lang === "java") {
    highlighted = highlighted.replace(/(\/\/.*$)/gm, '<span class="token-comment">$1</span>');
    highlighted = highlighted.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="token-comment">$1</span>');
  } else if (lang === "python") {
    highlighted = highlighted.replace(/(#.*$)/gm, '<span class="token-comment">$1</span>');
  }

  // Highlight functions
  highlighted = highlighted.replace(/\b([a-zA-Z_]\w*)\s*\(/g, '<span class="token-function">$1</span>(');

  // Highlight operators
  highlighted = highlighted.replace(/([=+\-*/%<>!&|^~?:]+)/g, '<span class="token-operator">$1</span>');

  return highlighted;
}

/**
 * Simple inline code highlighting
 */
function highlightInlineCode(code: string): string {
  // Escape HTML
  const escaped = escapeHtml(code);
  
  // Apply basic syntax highlighting
  let highlighted = escaped;
  
  // Highlight strings
  highlighted = highlighted.replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, '<span class="token-string">$&</span>');
  
  // Highlight numbers
  highlighted = highlighted.replace(/\b(\d+\.?\d*)\b/g, '<span class="token-number">$1</span>');
  
  return highlighted;
}

/**
 * Escape HTML entities
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
