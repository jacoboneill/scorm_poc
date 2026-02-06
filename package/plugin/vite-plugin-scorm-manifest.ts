import { readdirSync, statSync, writeFileSync } from "node:fs";
import { resolve, relative } from "node:path";
import type { Plugin, NormalizedOutputOptions } from "vite";

interface ScormConfig {
  version?: string;
}

interface ManifestConfig {
  title?: string;
  identifier?: string;
  version?: string;
  scorm?: ScormConfig;
}

function collectFiles(dir: string, base: string): string[] {
  let files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = resolve(dir, entry);
    const rel = relative(base, full);
    if (statSync(full).isDirectory()) {
      files = files.concat(collectFiles(full, base));
    } else if (entry !== "imsmanifest.xml") {
      files.push(rel);
    }
  }
  return files;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export default function scormManifest(config: ManifestConfig): Plugin {
  const {
    title = "SCORM Course",
    identifier = "com.example.course",
    version = "1.0",
    scorm = {},
  } = config;

  const scormVersion = scorm.version || "2004 4th Edition";

  return {
    name: "vite-plugin-scorm-manifest",
    writeBundle(options: NormalizedOutputOptions): void {
      const outDir = options.dir;
      if (!outDir) return;

      const files = collectFiles(outDir, outDir);

      const fileElements = files
        .map((f) => `      <file href="${escapeXml(f)}" />`)
        .join("\n");

      const manifest = `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="${escapeXml(identifier)}"
          version="${escapeXml(version)}"
          xmlns="http://www.imsglobal.org/xsd/imscp_v1p1"
          xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_v1p3"
          xmlns:adlseq="http://www.adlnet.org/xsd/adlseq_v1p3"
          xmlns:adlnav="http://www.adlnet.org/xsd/adlnav_v1p3"
          xmlns:imsss="http://www.imsglobal.org/xsd/imsss"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xsi:schemaLocation="http://www.imsglobal.org/xsd/imscp_v1p1 imscp_v1p1.xsd
                              http://www.adlnet.org/xsd/adlcp_v1p3 adlcp_v1p3.xsd
                              http://www.adlnet.org/xsd/adlseq_v1p3 adlseq_v1p3.xsd
                              http://www.adlnet.org/xsd/adlnav_v1p3 adlnav_v1p3.xsd
                              http://www.imsglobal.org/xsd/imsss imsss_v1p0.xsd">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>${escapeXml(scormVersion)}</schemaversion>
  </metadata>
  <organizations default="org-1">
    <organization identifier="org-1">
      <title>${escapeXml(title)}</title>
      <item identifier="item-1" identifierref="res-1">
        <title>${escapeXml(title)}</title>
      </item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="res-1" type="webcontent" adlcp:scormType="sco" href="index.html">
${fileElements}
    </resource>
  </resources>
</manifest>`;

      writeFileSync(resolve(outDir, "imsmanifest.xml"), manifest, "utf-8");
      console.log("[scorm-manifest] imsmanifest.xml generated");
    },
  };
}
