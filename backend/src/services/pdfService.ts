import PDFDocument from 'pdfkit';

export interface InvoiceItemData {
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
  items: InvoiceItemData[];
  totalHT: number;
  vatRate: number;
  totalTTC: number;
}

export const generateInvoicePDF = (data: InvoiceData): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const buffers: Buffer[] = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      // En-tête de l'entreprise
      doc
        .fontSize(20)
        .text('HYNCOAT QUARTZ SARLAU', { align: 'left' })
        .fontSize(10)
        .text('Peintures et Fournitures Automobiles', { align: 'left' })
        .text('Hay Inbiat, Salé - Maroc', { align: 'left' })
        .moveDown();

      // Informations de la facture
      doc
        .fontSize(14)
        .text(`Facture N° : ${data.invoiceNumber}`, { align: 'right' })
        .fontSize(10)
        .text(`Date : ${data.date}`, { align: 'right' })
        .text(`Échéance : ${data.dueDate}`, { align: 'right' })
        .moveDown();

      // Informations client
      doc
        .fontSize(12)
        .text('Facturé à :', { underline: true })
        .fontSize(10)
        .text(data.clientName)
        .text(data.clientAddress)
        .moveDown(2);

      // Tableau des articles (En-têtes)
      const tableTop = doc.y;
      doc
        .fontSize(10)
        .text('Description', 50, tableTop, { width: 250 })
        .text('Qté', 310, tableTop, { width: 50, align: 'right' })
        .text('P.U. HT', 370, tableTop, { width: 70, align: 'right' })
        .text('Total HT', 450, tableTop, { width: 90, align: 'right' });

      doc
        .moveTo(50, tableTop + 15)
        .lineTo(540, tableTop + 15)
        .stroke();

      // Lignes des articles
      let position = tableTop + 25;
      data.items.forEach((item) => {
        doc
          .text(item.description, 50, position, { width: 250 })
          .text(item.quantity.toString(), 310, position, { width: 50, align: 'right' })
          .text(item.unitPrice.toFixed(2), 370, position, { width: 70, align: 'right' })
          .text(item.total.toFixed(2), 450, position, { width: 90, align: 'right' });
        position += 20;
      });

      doc
        .moveTo(50, position + 5)
        .lineTo(540, position + 5)
        .stroke();

      // Totaux
      position += 20;
      doc
        .text(`Total HT : ${data.totalHT.toFixed(2)} MAD`, 350, position, { align: 'right', width: 190 });
      position += 15;
      doc
        .text(`TVA (${data.vatRate}%) : ${(data.totalTTC - data.totalHT).toFixed(2)} MAD`, 350, position, { align: 'right', width: 190 });
      position += 15;
      doc
        .fontSize(12)
        .text(`Total TTC : ${data.totalTTC.toFixed(2)} MAD`, 350, position, { align: 'right', width: 190 });

      // Pied de page
      doc
        .fontSize(8)
        .text(
          'HYNCOAT QUARTZ SARLAU - RC: 196475 - Patante: 25718526 - IF: 1901830 - ICE: 003911661000014',
          50,
          780,
          { align: 'center', width: 490 }
        );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};
