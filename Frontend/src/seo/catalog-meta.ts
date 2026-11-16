import { useLocation } from "react-router-dom";
import {
  productPictureContentUrl,
  type ProductType,
} from "@/api/catalog/pictures";
import { useProductPictures } from "@/hooks/use-product-pictures";
import { ui } from "@/i18n/translate-enum";
import {
  absoluteUrl,
  usePageMeta,
  type PageMeta,
  type PageRobots,
} from "@/seo/page-meta";

export function useHomeMeta() {
  const title = ui.seo("homeTitle");
  const description = ui.seo("homeDescription");
  usePageMeta({
    title,
    description,
    canonicalPath: "/",
    robots: "index,follow",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: title,
      description,
      url: absoluteUrl("/"),
    },
  });
}

export function useCatalogListMeta(category: string) {
  const { pathname } = useLocation();
  usePageMeta({
    title: ui.seo("titled", { name: category }),
    description: ui.message("browseCatalogLead"),
    canonicalPath: pathname,
    robots: "index,follow",
    jsonLd: breadcrumbJsonLd([
      { name: ui.seo("homeName"), path: "/" },
      { name: category, path: pathname },
    ]),
  });
}

export function useBrowseBuildsMeta() {
  const category = ui.page("browseBuilds");
  usePageMeta({
    title: ui.seo("titled", { name: category }),
    description: ui.message("browseBuildsLead"),
    canonicalPath: "/builds",
    robots: "index,follow",
    jsonLd: breadcrumbJsonLd([
      { name: ui.seo("homeName"), path: "/" },
      { name: category, path: "/builds" },
    ]),
  });
}

export function useCatalogDetailMeta(input: {
  category: string;
  categoryPath: string;
  productType: ProductType;
  productId: string | undefined;
  name?: string;
  manufacturer?: string;
  pending: boolean;
  missing: boolean;
}) {
  const { pathname } = useLocation();
  const ready = !input.pending && !input.missing && Boolean(input.name);
  const pictures = useProductPictures(
    input.productType,
    input.productId ?? "",
    ready,
  );
  const imagePath = pictures.data?.[0]
    ? productPictureContentUrl(pictures.data[0].id)
    : undefined;
  const categoryTitle = ui.seo("titled", { name: input.category });
  const crumbs = [
    { name: ui.seo("homeName"), path: "/" },
    { name: input.category, path: input.categoryPath },
  ];

  let description = ui.message("browseCatalogLead");
  let robots: PageRobots = "index,follow";
  let jsonLd: unknown = breadcrumbJsonLd(crumbs);
  let title = categoryTitle;

  if (input.missing) {
    description = ui.seo("notFoundDescription", { category: input.category });
    robots = "noindex,nofollow";
    jsonLd = undefined;
  } else if (ready && input.name) {
    const manufacturer = input.manufacturer?.trim();
    title = ui.seo("titled", { name: input.name });
    description = manufacturer
      ? ui.seo("productDescription", {
          name: input.name,
          manufacturer,
          category: input.category,
        })
      : ui.seo("productDescriptionNoBrand", {
          name: input.name,
          category: input.category,
        });
    jsonLd = [
      breadcrumbJsonLd([...crumbs, { name: input.name, path: pathname }]),
      productJsonLd({
        name: input.name,
        manufacturer,
        category: input.category,
        path: pathname,
        imagePath,
      }),
    ];
  }

  usePageMeta({
    title,
    description,
    canonicalPath: pathname,
    robots,
    jsonLd,
  });
}

export function usePublicBuildMeta(input: {
  isViewing: boolean;
  pending: boolean;
  missing: boolean;
  name?: string;
  description?: string;
}) {
  const { pathname } = useLocation();
  const category = ui.page("browseBuilds");
  const crumbs = [
    { name: ui.seo("homeName"), path: "/" },
    { name: category, path: "/builds" },
  ];
  const name = input.name?.trim();
  const meta: PageMeta = publicBuildMeta({
    ...input,
    name,
    pathname,
    category,
    crumbs,
  });
  usePageMeta(meta);
}

function publicBuildMeta(input: {
  isViewing: boolean;
  pending: boolean;
  missing: boolean;
  name?: string;
  description?: string;
  pathname: string;
  category: string;
  crumbs: { name: string; path: string }[];
}): PageMeta {
  if (!input.isViewing || input.missing) {
    return {
      title: ui.seo("homeTitle"),
      description: input.missing
        ? ui.seo("notFoundDescription", { category: ui.entity("build") })
        : ui.message("builderLead"),
      canonicalPath: input.pathname,
      robots: "noindex,nofollow",
    };
  }

  if (input.pending || !input.name) {
    return {
      title: ui.seo("titled", { name: input.category }),
      description: ui.message("browseBuildsLead"),
      canonicalPath: input.pathname,
      robots: "index,follow",
      jsonLd: breadcrumbJsonLd(input.crumbs),
    };
  }

  return {
    title: ui.seo("titled", { name: input.name }),
    description: input.description?.trim() || ui.label("savedBuild"),
    canonicalPath: input.pathname,
    robots: "index,follow",
    jsonLd: breadcrumbJsonLd([
      ...input.crumbs,
      { name: input.name, path: input.pathname },
    ]),
  };
}

function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

function productJsonLd(input: {
  name: string;
  manufacturer?: string;
  category: string;
  path: string;
  imagePath?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.name,
    ...(input.manufacturer
      ? { brand: { "@type": "Brand", name: input.manufacturer } }
      : {}),
    category: input.category,
    ...(input.imagePath ? { image: absoluteUrl(input.imagePath) } : {}),
    url: absoluteUrl(input.path),
  };
}
