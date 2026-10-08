export type PageItem = number | "ellipsis";

export function pageItems(pageIndex: number, pageCount: number): PageItem[] {
  const current = pageIndex + 1;
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  const pages: PageItem[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(pageCount - 1, current + 1);
  if (start > 2) pages.push("ellipsis");
  for (let page = start; page <= end; page += 1) pages.push(page);
  if (end < pageCount - 1) pages.push("ellipsis");
  pages.push(pageCount);
  return pages;
}
