/**
 * MVV region allowlist.
 *
 * EFA stop ids look like `de:09162:6`. The middle token is the official German
 * regional key (Amtlicher Gemeindeschlüssel, Kreis level). The efa.mvv endpoint
 * returns Bavaria-wide results, so this list is used to *flag* (not hide) stops
 * that lie outside the MVV network in the Munich search — non-MVV hits are shown
 * de-emphasized but stay selectable.
 *
 * This is a plain, editable allowlist: add or remove Kreis keys as the MVV
 * Verbundraum changes. Being slightly too broad only means a non-MVV stop is not
 * de-emphasized; being too narrow only means a valid MVV stop is shown without
 * emphasis — neither hides anything.
 */
export const MVV_REGION_KEYS: ReadonlySet<string> = new Set([
  '09162', // München, Landeshauptstadt (kreisfrei)
  '09184', // Landkreis München
  '09173', // Bad Tölz-Wolfratshausen
  '09174', // Dachau
  '09175', // Ebersberg
  '09177', // Erding
  '09178', // Freising (u.a. Flughafen München)
  '09179', // Fürstenfeldbruck
  '09188', // Starnberg
]);

/**
 * Extract the regional key (Kreis token) from an EFA stop id such as
 * `de:09162:6` -> `09162`. Returns null if the id is not in that shape.
 */
export function regionKeyFromStopId(stopId: string): string | null {
  const parts = stopId.split(':');
  return parts.length >= 2 ? parts[1] : null;
}

/**
 * Whether an EFA stop id belongs to a region within the MVV allowlist.
 * Unknown / malformed ids are treated as MVV (i.e. not de-emphasized) to avoid
 * hiding or downranking a stop we cannot classify.
 */
export function isMvvStop(stopId: string): boolean {
  const key = regionKeyFromStopId(stopId);
  return key === null || MVV_REGION_KEYS.has(key);
}
