'use client';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    total: number;
    limit: number;
    onPageChange: (page: number) => void;
}

export default function Pagination({
    currentPage,
    totalPages,
    total,
    limit,
    onPageChange
}: PaginationProps) {
    // Calculate visible page numbers
    const getVisiblePages = () => {
        const pages: (number | string)[] = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (currentPage <= 3) {
                for (let i = 1; i <= 4; i++) pages.push(i);
                pages.push('...');
                pages.push(totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1);
                pages.push('...');
                for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
            } else {
                pages.push(1);
                pages.push('...');
                for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
                pages.push('...');
                pages.push(totalPages);
            }
        }

        return pages;
    };

    const startItem = (currentPage - 1) * limit + 1;
    const endItem = Math.min(currentPage * limit, total);

    if (totalPages <= 1) return null;

    return (
        <div className="flex items-center justify-between p-4 border-t">
            {/* Results info */}
            <div className="text-sm text-muted-foreground">
                عرض {startItem} إلى {endItem} من {total} نتيجة
            </div>

            {/* Page buttons */}
            <div className="flex items-center gap-1">
                {/* Previous button */}
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 rounded-lg border hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    ← السابق
                </button>

                {/* Page numbers */}
                {getVisiblePages().map((page, index) => (
                    <button
                        key={index}
                        onClick={() => typeof page === 'number' && onPageChange(page)}
                        disabled={page === '...'}
                        className={`
                            min-w-[36px] px-3 py-1 rounded-lg transition-colors
                            ${page === currentPage
                                ? 'bg-primary text-primary-foreground'
                                : page === '...'
                                    ? 'cursor-default'
                                    : 'border hover:bg-muted'
                            }
                        `}
                    >
                        {page}
                    </button>
                ))}

                {/* Next button */}
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 rounded-lg border hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    التالي →
                </button>
            </div>
        </div>
    );
}
