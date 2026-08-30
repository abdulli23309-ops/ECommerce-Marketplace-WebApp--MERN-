/**
 * M-019: consistent, bounded pagination.
 *
 * - `page` is coerced to an integer >= 1 (NaN, negative, zero, fractional => 1).
 * - `pageSize` is coerced to an integer in [1, MAX_PAGE_SIZE]. Absurdly large
 *   values are capped, and malformed (NaN / negative / zero) values fall back
 *   to the caller-provided default so existing default behavior is preserved
 *   when the query param is absent.
 *
 * Each caller passes its own `defaultPageSize` to match prior behavior.
 */
export const MAX_PAGE_SIZE = 100;

export const sanitizePagination = (page, pageSize, defaultPageSize = 20) => {
  let parsedPage = parseInt(page, 10);
  if (!Number.isFinite(parsedPage) || parsedPage < 1) parsedPage = 1;

  let parsedSize = parseInt(pageSize, 10);
  if (!Number.isFinite(parsedSize) || parsedSize < 1) parsedSize = defaultPageSize;
  if (parsedSize > MAX_PAGE_SIZE) parsedSize = MAX_PAGE_SIZE;

  return { page: parsedPage, pageSize: parsedSize };
};