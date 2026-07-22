// Server-side allow-list for the public edit-request flow.
//
// The browser is never trusted: only collections and fields defined here can
// ever be written to a pull request, and every value is type/size checked
// before it reaches GitHub. To make a new field or collection editable by the
// public, add it here — nothing else grants write access.
//
// Note: `events` is intentionally omitted. events.json is machine-synced from
// Google Calendar by the hourly GCal Import action, so any user edit would be
// overwritten. Blog posts (markdown) are handled separately in a later change.

export const MAX_STRING = 2000;
export const MAX_MARKDOWN = 20000;
export const MAX_RELATION_ITEMS = 999;

const str = (max = MAX_STRING) => ({ type: "string", max });
const md = () => ({ type: "markdown", max: MAX_MARKDOWN });
const bool = () => ({ type: "boolean" });
const relation = () => ({ type: "relation", max: MAX_RELATION_ITEMS });
const geo = () => ({ type: "geojson-point" });

export const COLLECTIONS = {
  places: {
    file: "src/_data/places.json",
    arrayKey: "places",
    idField: "id",
    label: "Place",
    titleField: "name",
    fields: {
      name: str(200),
      slug: str(200),
      description: md(),
      osmwayid: str(50),
      status: bool(),
      points: relation(),
      filters: relation(),
    },
  },
  points: {
    file: "src/_data/points.json",
    arrayKey: "points",
    idField: "id",
    label: "Point",
    titleField: "name",
    fields: {
      name: str(200),
      description: str(),
      address: str(300),
      phone: str(50),
      hours: str(200),
      notes: str(),
      siteType: str(100),
      location: geo(),
      maki: str(50),
    },
  },
  orgs: {
    file: "src/_data/orgs.json",
    arrayKey: "organizations",
    idField: "id",
    label: "Organization",
    titleField: "name",
    fields: {
      name: str(200),
      slug: str(200),
      contactName: str(200),
      contactEmail: str(200),
      website: str(500),
      facebook: str(500),
      instagram: str(500),
      description: md(),
      photo: str(500),
      places: relation(),
      filters: relation(),
    },
  },
  filters: {
    file: "src/_data/sortablefilters.json",
    arrayKey: "filters",
    idField: "id",
    label: "Filter",
    titleField: "name",
    fields: {
      name: str(100),
      description: str(500),
    },
  },
};

function validateValue(spec, value) {
  switch (spec.type) {
    case "string":
    case "markdown": {
      if (typeof value !== "string") return { error: "must be text" };
      if (value.length > spec.max) return { error: `too long (max ${spec.max})` };
      return { value };
    }
    case "boolean": {
      if (typeof value === "boolean") return { value };
      if (value === "true" || value === "false") return { value: value === "true" };
      return { error: "must be true or false" };
    }
    case "relation": {
      if (!Array.isArray(value)) return { error: "must be a list" };
      if (value.length > spec.max) return { error: `too many items (max ${spec.max})` };
      if (!value.every((v) => typeof v === "string" && v.length <= 200)) {
        return { error: "must be a list of ids" };
      }
      return { value };
    }
    case "geojson-point": {
      // Stored as a stringified GeoJSON Point (matches the CMS map widget).
      if (typeof value !== "string") return { error: "must be a location string" };
      try {
        const g = JSON.parse(value);
        const c = g && g.coordinates;
        if (g.type !== "Point" || !Array.isArray(c) || c.length !== 2) throw new Error();
        if (typeof c[0] !== "number" || typeof c[1] !== "number") throw new Error();
        if (c[0] < -180 || c[0] > 180 || c[1] < -90 || c[1] > 90) throw new Error();
      } catch {
        return { error: "invalid location" };
      }
      return { value };
    }
    default:
      return { error: "unsupported field type" };
  }
}

// Validate a submission against the allow-list. Returns cleaned fields that are
// safe to write, plus the resolved collection config.
export function validateSubmission({ collection, targetId, fields }) {
  const conf = COLLECTIONS[collection];
  if (!conf) return { ok: false, errors: ["Unknown collection."] };

  const errors = [];
  if (targetId != null && typeof targetId !== "string") errors.push("Invalid targetId.");
  if (!fields || typeof fields !== "object" || Array.isArray(fields)) {
    return { ok: false, errors: ["Missing fields."], conf };
  }

  const cleaned = {};
  for (const [key, value] of Object.entries(fields)) {
    const spec = conf.fields[key];
    if (!spec) {
      errors.push(`Field not editable: ${key}`);
      continue;
    }
    const res = validateValue(spec, value);
    if (res.error) errors.push(`${key}: ${res.error}`);
    else cleaned[key] = res.value;
  }

  if (errors.length === 0 && Object.keys(cleaned).length === 0) {
    errors.push("No editable fields provided.");
  }

  return { ok: errors.length === 0, errors, cleaned, conf };
}
