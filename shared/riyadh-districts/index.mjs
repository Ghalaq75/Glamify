import data from './data.json';

const PLACEHOLDER_ID = '__placeholder__';

export const DISTRICTS = Object.freeze(
  data.districts.map((d) => Object.freeze({ ...d }))
);

export const IS_PLACEHOLDER_LIST =
  DISTRICTS.length === 0 ||
  DISTRICTS.some((d) => d.id === PLACEHOLDER_ID);

export const DISTRICT_DATA_SOURCE = data.source || null;
export const DISTRICT_DATA_CAPTURED_AT = data.capturedAt || null;

export const PLACEHOLDER_ERROR_MESSAGE =
  'Riyadh district list not configured — replace placeholder before accepting provider locations.';

export { PLACEHOLDER_ID };

const _byId = new Map(DISTRICTS.map((d) => [d.id, d]));

export function getDistrictById(id) {
  if (typeof id !== 'string') return null;
  return _byId.get(id) || null;
}

export function isValidDistrictId(id) {
  if (IS_PLACEHOLDER_LIST) return false;
  if (typeof id !== 'string' || id.length === 0) return false;
  if (id === PLACEHOLDER_ID) return false;
  return _byId.has(id);
}

export function getDistrictDisplayName(id, locale) {
  const d = getDistrictById(id);
  if (!d) return null;
  return locale === 'ar' ? d.arabicName : d.englishName;
}
