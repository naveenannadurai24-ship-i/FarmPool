// Small fetch wrapper for the FarmPool API.
function errorText(body) {
  if (!body || !body.detail) return "";
  if (typeof body.detail === "string") return body.detail;
  if (Array.isArray(body.detail)) {
    return body.detail.map((d) => {
      const field = (d.loc || []).filter((x) => x !== "body").join(".");
      const msg = String(d.msg || "").replace(/^Value error, /, "");
      return field ? `${field}: ${msg}` : msg;
    }).join("; ");
  }
  return "";
}

export async function api(path, options) {
  const res = await fetch(`/api${path}`, options);
  let body = null;
  try { body = await res.json(); } catch { /* empty body */ }
  if (!res.ok) {
    const err = new Error(errorText(body) || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return body;
}

export const postJSON = (path, body) => api(path, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});
