import path from "node:path";

export function toPosixPath(targetPath: string) {
  return targetPath.split(path.sep).join("/");
}

export function sortStrings(values: string[]) {
  return [...values].sort((left, right) => left.localeCompare(right));
}

export function relativeLink(fromFile: string, toFile: string) {
  const fromDir = path.dirname(fromFile);
  return toPosixPath(path.relative(fromDir, toFile)) || ".";
}

export function markdownLink(fromFile: string, toFile: string) {
  return `[${toFile}](${relativeLink(fromFile, toFile)})`;
}

export function routePathFromFile(relativePath: string) {
  const routePath = relativePath
    .replace("apps/web/src/routes/", "")
    .replace(/\.tsx$/, "")
    .split("/");

  if (routePath.length === 1 && routePath[0] === "__root") {
    return "(root layout)";
  }

  const segments = routePath.filter((segment) => segment !== "index");
  const normalized = segments.join("/");
  return normalized ? `/${normalized}` : "/";
}

export function replaceManagedSection(content: string, markerName: string, nextValue: string) {
  const startMarker = `<!-- docs-harness:${markerName}:start -->`;
  const endMarker = `<!-- docs-harness:${markerName}:end -->`;

  if (!content.includes(startMarker) || !content.includes(endMarker)) {
    throw new Error(`Managed section ${markerName} is missing its markers.`);
  }

  const pattern = new RegExp(
    `${escapeRegExp(startMarker)}[\\s\\S]*?${escapeRegExp(endMarker)}`,
    "m",
  );
  return content.replace(pattern, `${startMarker}\n${nextValue}\n${endMarker}`);
}

export function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function formatBulletList(items: string[]) {
  return items.join("\n");
}

export function endOfDayUnix(dateString: string) {
  return Math.floor(Date.parse(`${dateString}T23:59:59Z`) / 1000);
}

export function formatUnixDate(unixSeconds: number) {
  return new Date(unixSeconds * 1000).toISOString().slice(0, 10);
}
