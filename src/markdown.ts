import TurndownService from "turndown";
import { tables } from "turndown-plugin-gfm";

function absolutise(root: Element, baseUrl: string): void {
  for (const link of Array.from(root.querySelectorAll("a[href]"))) {
    const href = link.getAttribute("href") ?? "";
    if (href.startsWith("#")) link.setAttribute("href", new URL(href, baseUrl).href);
    else if (!/^[a-z]+:/i.test(href)) link.setAttribute("href", new URL(href, baseUrl).href);
  }
  for (const image of Array.from(root.querySelectorAll("img[src]"))) {
    image.setAttribute("src", new URL(image.getAttribute("src") ?? "", baseUrl).href);
  }
}

function createService(): TurndownService {
  const service = new TurndownService({ headingStyle: "atx", codeBlockStyle: "fenced", bulletListMarker: "-" });
  service.use(tables);
  service.addRule("dropImages", { filter: "img", replacement: () => "" });
  service.addRule("dropEmptyLinks", {
    filter: (node) => node.nodeName === "A" && node.textContent.trim() === "",
    replacement: () => "",
  });
  return service;
}

/** Convert a cleaned main-content element to markdown with absolute links. */
export function toMarkdown(main: Element, baseUrl: string): string {
  absolutise(main, baseUrl);
  const markdown = createService().turndown(main.outerHTML);
  return markdown.replace(/\n{3,}/g, "\n\n").trim();
}
