import { DEFAULT_PAGE } from "@/constants";
import { parseAsInteger, parseAsString, parseAsBoolean, useQueryStates } from "nuqs";

export const useNotesFilters = () => {
    return useQueryStates({
        search: parseAsString.withDefault('').withOptions({clearOnDefault: true}),
        page: parseAsInteger.withDefault(DEFAULT_PAGE).withOptions({clearOnDefault: true}),
        pinned: parseAsBoolean,
    })
}



