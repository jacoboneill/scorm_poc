import { resolve, relative } from "path";
import { readdirSync, statSync, writeFileSync } from "fs";

function collectFiles(dir, base) {
  let files = [];
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

function escapeXml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export default function scormManifest(config) {
  return {
    name: "vite-plugin-scorm-manifest",
    writeBundle(options) {
      const outDir = options.dir;
      const files = collectFiles(outDir, outDir);

      const fileEntries = files
        .map((f) => `      <file href="${escapeXml(f)}" />`)
        .join("\n");

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="${escapeXml(config.identifier)}" version="${escapeXml(config.version)}"
  xmlns="http://www.imsglobal.org/xsd/imscp_v1p1"
  xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_v1p3"
  xmlns:adlseq="http://www.adlnet.org/xsd/adlseq_v1p3"
  xmlns:adlnav="http://www.adlnet.org/xsd/adlnav_v1p3"
  xmlns:imsss="http://www.imsglobal.org/xsd/imsss"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="
    http://www.imsglobal.org/xsd/imscp_v1p1 imscp_v1p1.xsd
    http://www.adlnet.org/xsd/adlcp_v1p3 adlcp_v1p3.xsd
    http://www.adlnet.org/xsd/adlseq_v1p3 adlseq_v1p3.xsd
    http://www.adlnet.org/xsd/adlnav_v1p3 adlnav_v1p3.xsd
    http://www.imsglobal.org/xsd/imsss imsss_v1p0.xsd">

  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>${escapeXml(config.scorm.version)}</schemaversion>
  </metadata>

  <organizations default="course_org">
    <organization identifier="course_org" structure="hierarchical">
      <title>${escapeXml(config.title)}</title>
      <item identifier="item_1" identifierref="resource_1">
        <title>${escapeXml(config.title)}</title>
      </item>
    </organization>
  </organizations>

  <resources>
    <resource identifier="resource_1" type="webcontent" adlcp:scormType="sco" href="index.html">
${fileEntries}
    </resource>
  </resources>

</manifest>`;

      writeFileSync(resolve(outDir, "imsmanifest.xml"), xml, "utf-8");
      console.log("[scorm-manifest] imsmanifest.xml generated");
    },
  };
}
