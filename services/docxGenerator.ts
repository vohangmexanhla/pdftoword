
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx';

export const generateDocx = async (pages: any[]): Promise<Blob> => {
  const children: any[] = [];

  pages.forEach((page) => {
    page.elements.forEach((el: any) => {
      if (el.type === 'heading') {
        let level = HeadingLevel.HEADING_1;
        if (el.level === 2) level = HeadingLevel.HEADING_2;
        if (el.level === 3) level = HeadingLevel.HEADING_3;
        
        children.push(new Paragraph({
          text: el.content,
          heading: level,
          spacing: { before: 400, after: 200 }
        }));
      } 
      else if (el.type === 'paragraph') {
        children.push(new Paragraph({
          children: [new TextRun(el.content)],
          spacing: { after: 200 }
        }));
      }
      else if (el.type === 'list') {
        (el.items || []).forEach((item: string) => {
          children.push(new Paragraph({
            text: item,
            bullet: { level: 0 },
            spacing: { after: 120 }
          }));
        });
      }
      else if (el.type === 'table') {
        const rows = (el.rows || []).map((row: any) => {
          return new TableRow({
            children: (row.cells || []).map((cellText: string) => {
              return new TableCell({
                children: [new Paragraph(cellText)],
                width: { size: 100 / row.cells.length, type: WidthType.PERCENTAGE }
              });
            })
          });
        });

        if (rows.length > 0) {
          children.push(new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: rows,
            margins: { top: 100, bottom: 100, left: 100, right: 100 }
          }));
          children.push(new Paragraph({ text: "" })); // Spacer
        }
      }
    });
  });

  const doc = new Document({
    sections: [{
      properties: {},
      children: children,
    }],
  });

  return await Packer.toBlob(doc);
};
