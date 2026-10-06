const OPEN_LICENSE = /^https?:\/\/creativecommons\.org\/(?:publicdomain\/zero\/1\.0|licenses\/by\/4\.0|licenses\/by-sa\/4\.0)\/?$/i;

export function isOpenCommercialReuseLicense(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try { return OPEN_LICENSE.test(new URL(value).toString().replace(/#.*$/, "").replace(/\/$/, "")); }
  catch { return OPEN_LICENSE.test(value.trim().replace(/\/$/, "")); }
}
