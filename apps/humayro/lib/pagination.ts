export const FIRST_PAGE = 1

export function toApiPage(page: number) {
  return Math.max(FIRST_PAGE, page) - FIRST_PAGE
}
