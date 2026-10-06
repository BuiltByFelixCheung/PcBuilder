import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { pageItems } from "@/lib/page-items";

type ListPaginationProps = {
  pageIndex: number;
  pageCount: number;
  onPageChange: (pageIndex: number) => void;
};

export function ListPagination({
  pageIndex,
  pageCount,
  onPageChange,
}: Readonly<ListPaginationProps>) {
  if (pageCount <= 1) return null;

  return (
    <Pagination className="mt-4">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            disabled={pageIndex === 0}
            onClick={() => onPageChange(pageIndex - 1)}
          />
        </PaginationItem>
        {pageItems(pageIndex, pageCount).map((item, index) => (
          <PaginationItem
            key={item === "ellipsis" ? `ellipsis-${index}` : item}
          >
            {item === "ellipsis" ? (
              <PaginationEllipsis />
            ) : (
              <PaginationLink
                isActive={item === pageIndex + 1}
                onClick={() => onPageChange(item - 1)}
              >
                {item}
              </PaginationLink>
            )}
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext
            disabled={pageIndex + 1 >= pageCount}
            onClick={() => onPageChange(pageIndex + 1)}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
