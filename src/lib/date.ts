const long = new Intl.DateTimeFormat("en-GB", {day: "numeric", month: "short", year: "numeric", timeZone: "UTC"});
const short = new Intl.DateTimeFormat("en-GB", {day: "numeric", month: "short", timeZone: "UTC"});

/** `2026-10-15` as "15 Oct 2026" */
export const formatDate = (iso: string) => long.format(new Date(iso));

/** `2026-10-15` as "15 Oct" */
export const formatDay = (iso: string) => short.format(new Date(iso));
