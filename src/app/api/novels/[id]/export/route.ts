import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// 簡易EPUBジェネレーター（外部依存なし）
function generateEpub(novel: {
  title: string;
  synopsis: string;
  author: { name: string };
  chapters: { title: string; content: string; chapterNum: number }[];
}): Buffer {
  const uid = `ai-novel-${Date.now()}`;
  const files: Record<string, string> = {};

  // mimetype
  files["mimetype"] = "application/epub+zip";

  // container.xml
  files["META-INF/container.xml"] = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;

  // content.opf
  const manifestItems = novel.chapters.map((_, i) =>
    `    <item id="chapter${i + 1}" href="chapter${i + 1}.xhtml" media-type="application/xhtml+xml"/>`
  ).join("\n");
  const spineItems = novel.chapters.map((_, i) =>
    `    <itemref idref="chapter${i + 1}"/>`
  ).join("\n");

  files["OEBPS/content.opf"] = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="uid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="uid">${escapeXml(uid)}</dc:identifier>
    <dc:title>${escapeXml(novel.title)}</dc:title>
    <dc:creator>${escapeXml(novel.author.name)}</dc:creator>
    <dc:language>ja</dc:language>
    <meta property="dcterms:modified">${new Date().toISOString().replace(/\.\d{3}Z$/, "Z")}</meta>
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="style" href="style.css" media-type="text/css"/>
${manifestItems}
  </manifest>
  <spine>
${spineItems}
  </spine>
</package>`;

  // nav.xhtml
  const tocItems = novel.chapters.map((ch, i) =>
    `      <li><a href="chapter${i + 1}.xhtml">${escapeXml(ch.title)}</a></li>`
  ).join("\n");

  files["OEBPS/nav.xhtml"] = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="ja">
<head><title>目次</title><link rel="stylesheet" href="style.css"/></head>
<body>
  <nav epub:type="toc">
    <h1>目次</h1>
    <ol>
${tocItems}
    </ol>
  </nav>
</body>
</html>`;

  // style.css
  files["OEBPS/style.css"] = `body {
  font-family: serif;
  line-height: 1.8;
  margin: 1em;
}
h1 { font-size: 1.5em; margin-bottom: 1em; }
h2 { font-size: 1.2em; margin-bottom: 0.5em; }
p { text-indent: 1em; margin: 0.5em 0; }
.scene-break { text-align: center; margin: 2em 0; }
ruby rt { font-size: 0.6em; }`;

  // chapter files
  novel.chapters.forEach((ch, i) => {
    const body = contentToXhtml(ch.content);
    files[`OEBPS/chapter${i + 1}.xhtml`] = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="ja">
<head><title>${escapeXml(ch.title)}</title><link rel="stylesheet" href="style.css"/></head>
<body>
  <h1>第${ch.chapterNum}話 ${escapeXml(ch.title)}</h1>
${body}
</body>
</html>`;
  });

  // ZIP生成（非圧縮、EPUB最小限仕様）
  return createSimpleZip(files);
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function contentToXhtml(content: string): string {
  // 独自マークアップをXHTMLに変換
  let html = escapeXml(content);

  // ルビ: |漢字《かんじ》 → <ruby>漢字<rt>かんじ</rt></ruby>
  html = html.replace(/\|([^|《》\n]+)《([^》]+)》/g, "<ruby>$1<rt>$2</rt></ruby>");

  // 傍点: ﹅テキスト﹅ → <em>テキスト</em>
  html = html.replace(/﹅([^﹅]+)﹅/g, "<em>$1</em>");

  // 場面転換: ---
  html = html.replace(/^---$/gm, '<p class="scene-break">* * *</p>');

  // 段落変換
  const lines = html.split("\n");
  const paragraphs = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed) return "";
    if (trimmed.startsWith("<p ") || trimmed.startsWith("<ruby")) return trimmed;
    return `  <p>${trimmed}</p>`;
  });

  return paragraphs.filter(Boolean).join("\n");
}

// 簡易ZIP生成（Store圧縮のみ、EPUB用）
function createSimpleZip(files: Record<string, string>): Buffer {
  const entries: { name: Buffer; data: Buffer; offset: number }[] = [];
  const parts: Buffer[] = [];
  let offset = 0;

  // mimetype は最初に格納（圧縮なし）
  const sortedKeys = Object.keys(files).sort((a, b) => {
    if (a === "mimetype") return -1;
    if (b === "mimetype") return 1;
    return a.localeCompare(b);
  });

  for (const path of sortedKeys) {
    const name = Buffer.from(path, "utf8");
    const data = Buffer.from(files[path], "utf8");

    const crc = crc32(data);

    // Local file header
    const header = Buffer.alloc(30 + name.length);
    header.writeUInt32LE(0x04034b50, 0); // signature
    header.writeUInt16LE(20, 4); // version
    header.writeUInt16LE(0, 6); // flags
    header.writeUInt16LE(0, 8); // compression (store)
    header.writeUInt16LE(0, 10); // mod time
    header.writeUInt16LE(0, 12); // mod date
    header.writeUInt32LE(crc, 14); // crc32
    header.writeUInt32LE(data.length, 18); // compressed size
    header.writeUInt32LE(data.length, 22); // uncompressed size
    header.writeUInt16LE(name.length, 26); // filename length
    header.writeUInt16LE(0, 28); // extra length
    name.copy(header, 30);

    entries.push({ name, data, offset });

    parts.push(header, data);
    offset += header.length + data.length;
  }

  // Central directory
  const cdStart = offset;
  for (const entry of entries) {
    const cd = Buffer.alloc(46 + entry.name.length);
    const crc = crc32(entry.data);
    cd.writeUInt32LE(0x02014b50, 0); // signature
    cd.writeUInt16LE(20, 4); // version made by
    cd.writeUInt16LE(20, 6); // version needed
    cd.writeUInt16LE(0, 8); // flags
    cd.writeUInt16LE(0, 10); // compression
    cd.writeUInt16LE(0, 12); // mod time
    cd.writeUInt16LE(0, 14); // mod date
    cd.writeUInt32LE(crc, 16); // crc32
    cd.writeUInt32LE(entry.data.length, 20); // compressed
    cd.writeUInt32LE(entry.data.length, 24); // uncompressed
    cd.writeUInt16LE(entry.name.length, 28); // filename length
    cd.writeUInt16LE(0, 30); // extra length
    cd.writeUInt16LE(0, 32); // comment length
    cd.writeUInt16LE(0, 34); // disk start
    cd.writeUInt16LE(0, 36); // internal attrs
    cd.writeUInt32LE(0, 38); // external attrs
    cd.writeUInt32LE(entry.offset, 42); // local header offset
    entry.name.copy(cd, 46);
    parts.push(cd);
    offset += cd.length;
  }

  // End of central directory
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4); // disk
  eocd.writeUInt16LE(0, 6); // cd disk
  eocd.writeUInt16LE(entries.length, 8); // entries on disk
  eocd.writeUInt16LE(entries.length, 10); // total entries
  eocd.writeUInt32LE(offset - cdStart, 12); // cd size
  eocd.writeUInt32LE(cdStart, 16); // cd offset
  eocd.writeUInt16LE(0, 20); // comment length
  parts.push(eocd);

  return Buffer.concat(parts);
}

// CRC32 計算
function crc32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const novel = await prisma.novel.findUnique({
    where: { id },
    include: {
      author: { select: { name: true } },
      chapters: {
        where: { publishedAt: { not: null, lte: new Date() } },
        orderBy: { chapterNum: "asc" },
        select: { title: true, content: true, chapterNum: true },
      },
    },
  });

  if (!novel) {
    return NextResponse.json({ error: "作品が見つかりません" }, { status: 404 });
  }

  if (novel.chapters.length === 0) {
    return NextResponse.json({ error: "公開されている章がありません" }, { status: 400 });
  }

  const epub = generateEpub(novel);

  const filename = encodeURIComponent(novel.title) + ".epub";

  return new NextResponse(new Uint8Array(epub), {
    headers: {
      "Content-Type": "application/epub+zip",
      "Content-Disposition": `attachment; filename*=UTF-8''${filename}`,
    },
  });
}
