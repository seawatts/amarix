import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsString,
} from 'nuqs/server'

export const searchParams = {
  maps: parseAsArrayOf(parseAsString).withDefault([]),
}

export const searchParamsCache = createSearchParamsCache(searchParams)
