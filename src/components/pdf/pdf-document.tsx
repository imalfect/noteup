"use client";

import {
  Document,
  Page,
  Text,
  View,
  Link,
  StyleSheet,
} from "@react-pdf/renderer";
import {
  parseMarkdown,
  type MdToken,
  type InlineToken,
} from "@/lib/md-to-pdf";
import type { PdfFontFamily } from "@/lib/pdf-fonts";

export type PdfConfig = {
  pageSize: "A4" | "LETTER" | "A3" | "A5";
  orientation: "portrait" | "landscape";
  fontSize: number;
  fontFamily: PdfFontFamily;
  lineHeight: number;
  marginMm: number;
  darkMode: boolean;
  showTitle: boolean;
  showPageNumbers: boolean;
  keepSectionsTogether: boolean;
  title: string;
  content: string;
};

// mm to pt: 1mm = 2.835pt
const mmToPt = (mm: number) => mm * 2.835;

export function PdfDocument({ config }: { config: PdfConfig }) {
  const {
    pageSize,
    orientation,
    fontSize,
    fontFamily,
    lineHeight,
    marginMm,
    darkMode,
    showTitle,
    showPageNumbers,
    keepSectionsTogether,
    title,
    content,
  } = config;

  const margin = mmToPt(marginMm);
  const bg = darkMode ? "#080808" : "#ffffff";
  const fg = darkMode ? "#ededed" : "#171717";
  const muted = darkMode ? "#808080" : "#808080";
  const borderCol = darkMode ? "#333333" : "#dddddd";
  const codeBg = darkMode ? "#111111" : "#f5f5f5";

  // Choose code font: same family if it's monospace, otherwise GeistMono
  const isMonoFont = ["GeistMono", "FiraCode", "Courier"].includes(fontFamily);
  const codeFont = isMonoFont ? fontFamily : "GeistMono";

  const tokens = parseMarkdown(content);

  const s = StyleSheet.create({
    page: {
      backgroundColor: bg,
      color: fg,
      fontFamily,
      fontSize,
      lineHeight,
      paddingTop: margin,
      paddingBottom: margin + (showPageNumbers ? 20 : 0),
      paddingHorizontal: margin,
    },
    // headings
    h1: {
      fontSize: fontSize * 1.6,
      fontWeight: 700,
      marginTop: fontSize * 1.2,
      marginBottom: fontSize * 0.6,
      paddingBottom: fontSize * 0.3,
      borderBottomWidth: 1,
      borderBottomColor: borderCol,
    },
    h2: {
      fontSize: fontSize * 1.3,
      fontWeight: 700,
      marginTop: fontSize * 1.0,
      marginBottom: fontSize * 0.5,
    },
    h3: {
      fontSize: fontSize * 1.1,
      fontWeight: 600,
      marginTop: fontSize * 0.8,
      marginBottom: fontSize * 0.4,
    },
    h4: {
      fontSize: fontSize * 1.0,
      fontWeight: 600,
      marginTop: fontSize * 0.6,
      marginBottom: fontSize * 0.3,
    },
    // text
    paragraph: {
      marginBottom: fontSize * 0.5,
    },
    bold: { fontWeight: 700 },
    italic: { fontStyle: "italic" },
    strikethrough: { textDecoration: "line-through" },
    code: {
      fontFamily: codeFont,
      fontSize: fontSize * 0.85,
      backgroundColor: codeBg,
      padding: "1 3",
    },
    link: {
      color: fg,
      textDecoration: "underline",
    },
    // blockquote
    blockquote: {
      borderLeftWidth: 2,
      borderLeftColor: borderCol,
      paddingLeft: 10,
      marginVertical: fontSize * 0.5,
      color: muted,
    },
    // code block
    codeBlock: {
      fontFamily: codeFont,
      fontSize: fontSize * 0.8,
      backgroundColor: codeBg,
      padding: 8,
      marginVertical: fontSize * 0.5,
      borderWidth: 1,
      borderColor: borderCol,
    },
    // hr
    hr: {
      borderBottomWidth: 1,
      borderBottomColor: borderCol,
      marginVertical: fontSize * 0.8,
    },
    // list
    listItem: {
      flexDirection: "row",
      marginBottom: 2,
    },
    listBullet: {
      width: 14,
      color: muted,
    },
    listNumber: {
      width: 20,
      color: muted,
    },
    listContent: {
      flex: 1,
    },
    // task list
    taskCheck: {
      width: 10,
      height: 10,
      borderWidth: 1,
      borderColor: borderCol,
      marginRight: 6,
      marginTop: 2,
    },
    taskCheckChecked: {
      width: 10,
      height: 10,
      borderWidth: 1,
      borderColor: fg,
      backgroundColor: fg,
      marginRight: 6,
      marginTop: 2,
    },
    // table
    tableRow: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: borderCol,
    },
    tableHeader: {
      flex: 1,
      padding: 4,
      fontWeight: 700,
      fontSize: fontSize * 0.85,
      backgroundColor: codeBg,
      borderRightWidth: 1,
      borderRightColor: borderCol,
    },
    tableCell: {
      flex: 1,
      padding: 4,
      fontSize: fontSize * 0.85,
      borderRightWidth: 1,
      borderRightColor: borderCol,
    },
    // math
    mathBlock: {
      fontFamily: codeFont,
      fontSize: fontSize * 0.9,
      textAlign: "center",
      marginVertical: fontSize * 0.5,
      padding: 8,
      backgroundColor: codeBg,
      borderWidth: 1,
      borderColor: borderCol,
      color: muted,
    },
    mathInline: {
      fontFamily: codeFont,
      fontSize: fontSize * 0.85,
      color: muted,
    },
    // page number
    pageNumber: {
      position: "absolute",
      bottom: margin * 0.5,
      left: 0,
      right: 0,
      textAlign: "center",
      fontSize: 8,
      color: muted,
    },
    // title
    docTitle: {
      fontSize: fontSize * 1.8,
      fontWeight: 700,
      marginBottom: fontSize,
      paddingBottom: fontSize * 0.4,
      borderBottomWidth: 1,
      borderBottomColor: borderCol,
    },
  });

  const headingStyle = (level: number) => {
    switch (level) {
      case 1:
        return s.h1;
      case 2:
        return s.h2;
      case 3:
        return s.h3;
      default:
        return s.h4;
    }
  };

  function renderInline(tokens: InlineToken[], key = ""): React.ReactNode {
    return tokens.map((t, i) => {
      const k = `${key}-${i}`;
      switch (t.type) {
        case "text":
          return <Text key={k}>{t.text}</Text>;
        case "bold":
          return (
            <Text key={k} style={s.bold}>
              {renderInline(t.children, k)}
            </Text>
          );
        case "italic":
          return (
            <Text key={k} style={s.italic}>
              {renderInline(t.children, k)}
            </Text>
          );
        case "strikethrough":
          return (
            <Text key={k} style={s.strikethrough}>
              {renderInline(t.children, k)}
            </Text>
          );
        case "code":
          return (
            <Text key={k} style={s.code}>
              {t.text}
            </Text>
          );
        case "link":
          return (
            <Link key={k} src={t.href} style={s.link}>
              {renderInline(t.children, k)}
            </Link>
          );
        case "math_inline":
          return (
            <Text key={k} style={s.mathInline}>
              {t.content}
            </Text>
          );
        default:
          return null;
      }
    });
  }

  function renderToken(token: MdToken, key: string): React.ReactNode {
    const sectionWrap = keepSectionsTogether ? { minPresenceAhead: 40 } : {};

    switch (token.type) {
      case "heading":
        return (
          <Text
            key={key}
            style={headingStyle(token.level)}
            {...(keepSectionsTogether ? { minPresenceAhead: 60 } : {})}
          >
            {renderInline(token.children, key)}
          </Text>
        );

      case "paragraph":
        return (
          <Text key={key} style={s.paragraph}>
            {renderInline(token.children, key)}
          </Text>
        );

      case "blockquote":
        return (
          <View key={key} style={s.blockquote}>
            {token.children.map((child, i) =>
              renderToken(child, `${key}-bq-${i}`)
            )}
          </View>
        );

      case "code_block":
        return (
          <View key={key} style={s.codeBlock} wrap={false}>
            <Text>{token.content}</Text>
          </View>
        );

      case "hr":
        return <View key={key} style={s.hr} />;

      case "list":
        return (
          <View key={key} style={{ marginVertical: fontSize * 0.3 }}>
            {token.items.map((item, i) => (
              <View key={`${key}-li-${i}`} style={s.listItem}>
                {token.ordered ? (
                  <Text style={s.listNumber}>{i + 1}.</Text>
                ) : (
                  <Text style={s.listBullet}>•</Text>
                )}
                <Text style={s.listContent}>
                  {renderInline(item.children, `${key}-li-${i}`)}
                </Text>
              </View>
            ))}
          </View>
        );

      case "task_list":
        return (
          <View key={key} style={{ marginVertical: fontSize * 0.3 }}>
            {token.items.map((item, i) => (
              <View
                key={`${key}-task-${i}`}
                style={[s.listItem, { alignItems: "flex-start" }]}
              >
                <View
                  style={
                    item.checked ? s.taskCheckChecked : s.taskCheck
                  }
                />
                <Text style={s.listContent}>
                  {renderInline(item.children, `${key}-task-${i}`)}
                </Text>
              </View>
            ))}
          </View>
        );

      case "table":
        return (
          <View
            key={key}
            style={{
              marginVertical: fontSize * 0.5,
              borderWidth: 1,
              borderColor: borderCol,
            }}
            wrap={false}
          >
            {/* header */}
            <View style={s.tableRow}>
              {token.headers.map((cell, ci) => (
                <Text key={`${key}-th-${ci}`} style={s.tableHeader}>
                  {renderInline(cell, `${key}-th-${ci}`)}
                </Text>
              ))}
            </View>
            {/* rows */}
            {token.rows.map((row, ri) => (
              <View key={`${key}-tr-${ri}`} style={s.tableRow}>
                {row.map((cell, ci) => (
                  <Text key={`${key}-td-${ri}-${ci}`} style={s.tableCell}>
                    {renderInline(cell, `${key}-td-${ri}-${ci}`)}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        );

      case "math_block":
        return (
          <View key={key} style={s.mathBlock} wrap={false}>
            <Text>{token.content}</Text>
          </View>
        );

      default:
        return null;
    }
  }

  return (
    <Document title={title} author="noteup">
      <Page size={pageSize} orientation={orientation} style={s.page} wrap>
        {showTitle && <Text style={s.docTitle}>{title}</Text>}

        {tokens.map((token, i) => renderToken(token, `t-${i}`))}

        {showPageNumbers && (
          <Text
            style={s.pageNumber}
            render={({ pageNumber, totalPages }) =>
              `${pageNumber} / ${totalPages}`
            }
            fixed
          />
        )}
      </Page>
    </Document>
  );
}
