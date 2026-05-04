const CANONICAL_CATEGORIES = ['Hair', 'Skin', 'Nails', 'Wellness', 'Lashes', 'Makeup'];

function normalizeAndValidateCategories({ categories, category }) {
  let raw;
  if (Array.isArray(categories)) {
    raw = categories;
  } else if (categories !== undefined && categories !== null) {
    return { ok: false, message: 'Invalid categories.' };
  } else if (typeof category === 'string') {
    raw = [category];
  } else if (category !== undefined && category !== null) {
    return { ok: false, message: 'Invalid category.' };
  } else {
    return { ok: false, message: 'Please select at least one category.' };
  }

  for (const c of raw) {
    if (typeof c !== 'string') return { ok: false, message: 'Invalid categories.' };
  }
  const cleaned = raw.map((c) => c.trim()).filter(Boolean);
  if (cleaned.length === 0) return { ok: false, message: 'Please select at least one category.' };

  const seen = new Set();
  const unique = [];
  for (const c of cleaned) {
    if (!seen.has(c)) {
      seen.add(c);
      unique.push(c);
    }
  }

  const invalid = unique.filter((c) => !CANONICAL_CATEGORIES.includes(c));
  if (invalid.length > 0) {
    return {
      ok: false,
      message: `Invalid category: ${invalid.join(', ')}. Allowed: ${CANONICAL_CATEGORIES.join(', ')}.`,
    };
  }

  return { ok: true, list: unique };
}

module.exports = { CANONICAL_CATEGORIES, normalizeAndValidateCategories };
