import PdfPrinter from 'pdfmake';
import { TDocumentDefinitions } from 'pdfmake/interfaces';

// Définition des polices pour pdfmake (polices standard intégrées)
const fonts = {
  Helvetica: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique'
  }
};

const printer = new PdfPrinter(fonts);

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface InvoiceData {
  invoiceNumber: string;
  date: string;
  dueDate: string;
  clientName: string;
  clientAddress: string;
  items: InvoiceItem[];
  totalHT: number;
  vatRate: number; // ex: 20 pour 20%
  totalTTC: number;
}

export function generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const docDefinition: TDocumentDefinitions = {
        pageSize: 'A4',
        pageMargins: [40, 40, 40, 40],
        defaultStyle: {
          font: 'Helvetica',
          fontSize: 10,
          color: '#333333'
        },
        content: [
          // En-tête de l'entreprise
          {
            columns: [
              {
                text: 'HYNCOAT QUARTZ SARLAU',
                style: 'headerCompany'
              },
              {
                text: `FACTURE N° ${data.invoiceNumber}`,
                style: 'headerInvoice',
                alignment: 'right'
              }
            ]
          },
          {
            text: 'Spécialiste Peintures & Fournitures Carrosserie Automobile',
            style: 'subheaderCompany',
            margin: [0, 5, 0, 20]
          },
          // Informations client et dates
          {
            columns: [
              {
                text: [
                  { text: 'Facturé à :\n', bold: true },
                  { text: `${data.clientName}\n`, fontSize: 11, bold: true },
                  { text: `${data.clientAddress}\n`, color: '#666666' }
                ]
              },
              {
                text: [
                  { text: `Date : ${data.date}\n` },
                  { text: `Échéance : ${data.dueDate}\n` }
                ],
                alignment: 'right',
                color: '#555555'
              }
            ],
            margin: [0, 0, 0, 30]
          },
          // Tableau des articles
          {
            table: {
              headerRows: 1,
              widths: ['*', 60, 80, 80],
              body: [
                [
                  { text: 'Description', style: 'tableHeader' },
                  { text: 'Qté', style: 'tableHeader', alignment: 'center' },
                  { text: 'P.U. HT (MAD)', style: 'tableHeader', alignment: 'right' },
                  { text: 'Total HT (MAD)', style: 'tableHeader', alignment: 'right' }
                ],
                ...data.items.map(item => [
                  item.description,
                  { text: item.quantity.toString(), alignment: 'center' },
                  { text: item.unitPrice.toFixed(2), alignment: 'right' },
                  { text: item.total.toFixed(2), alignment: 'right' }
                ])
              ]
            },
            layout: 'lightHorizontalLines'
          },
          // Totaux
          {
            columns: [
              { text: '', width: '*' },
              {
                width: 220,
                table: {
                  widths: [120, '*'],
                  body: [
                    ['Total HT', { text: `${data.totalHT.toFixed(2)} MAD`, alignment: 'right' }],
                    [`TVA (${data.vatRate}%)`, { text: `${(data.totalTTC - data.totalHT).toFixed(2)} MAD`, alignment: 'right' }],
                    [{ text: 'Total TTC', bold: true }, { text: `${data.totalTTC.toFixed(2)} MAD`, bold: true, alignment: 'right' }]
                  ]
                },
                layout: 'noBorders',
                margin: [0, 20, 0, 0]
              }
            ]
          },
          // Pied de page
          {
            text: 'Merci de votre confiance. ICE: 003911661000014',
            alignment: 'center',
            fontSize: 9,
            color: '#888888',
            absolutePosition: { x: 40, y: 780 }
          }
        ],
        styles: {
          headerCompany: {
            fontSize: 18,
            bold: true,
            color: '#1a365d'
          },
          subheaderCompany: {
            fontSize: 10,
            color: '#555555'
          },
          headerInvoice: {
            fontSize: 16,
            bold: true,
            color: '#2b6cb0'
          },
          tableHeader: {
            bold: true,
            fillColor: '#f7fafc',
            color: '#2d3748',
            margin: [0, 6, 0, 6]
          }
        }
      };

      const pdfDoc = printer.createPdfKitDocument(docDefinition);
      const chunks: Uint8Array[] = [];

      pdfDoc.on('data', (chunk) => chunks.push(chunk));
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
      pdfDoc.on('error', (err) => reject(err));

      pdfDoc.end();
    } catch (error) {
      reject(error);
    }
  });
}
