const data = require('./data.json');

const PLACEHOLDER_ID = '__placeholder__';

const DISTRICTS = Object.freeze(
  data.districts.map((d) => Object.freeze({ ...d }))
);

const IS_PLACEHOLDER_LIST =
  DISTRICTS.length === 0 ||
  DISTRICTS.some((d) => d.id === PLACEHOLDER_ID);

const DISTRICT_DATA_SOURCE = data.source || null;
const DISTRICT_DATA_CAPTURED_AT = data.capturedAt || null;

const PLACEHOLDER_ERROR_MESSAGE =
  'Riyadh district list not configured — replace placeholder before accepting provider locations.';

const _byId = new Map(DISTRICTS.map((d) => [d.id, d]));

function getDistrictById(id) {
  if (typeof id !== 'string') return null;
  return _byId.get(id) || null;
}

function isValidDistrictId(id) {
  if (IS_PLACEHOLDER_LIST) return false;
  if (typeof id !== 'string' || id.length === 0) return false;
  if (id === PLACEHOLDER_ID) return false;
  return _byId.has(id);
}

function getDistrictDisplayName(id, locale) {
  const d = getDistrictById(id);
  if (!d) return null;
  return locale === 'ar' ? d.arabicName : d.englishName;
}

module.exports = {
  DISTRICTS,
  IS_PLACEHOLDER_LIST,
  PLACEHOLDER_ID,
  PLACEHOLDER_ERROR_MESSAGE,
  DISTRICT_DATA_SOURCE,
  DISTRICT_DATA_CAPTURED_AT,
  getDistrictById,
  isValidDistrictId,
  getDistrictDisplayName,
};
