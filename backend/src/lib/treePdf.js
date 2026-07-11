const PDFDocument = require('pdfkit');

function formatDisplayDate(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function personLine(person) {
  const name = [person.firstName, person.lastName].filter(Boolean).join(' ');
  const birth = formatDisplayDate(person.birthDate);
  const death = formatDisplayDate(person.deathDate);
  let dates = '';
  if (birth && death) dates = ` (${birth} – ${death})`;
  else if (birth) dates = ` (né·e le ${birth})`;
  else if (death) dates = ` (décédé·e le ${death})`;
  return `${name}${dates}`;
}

function generateTreePdf(tree, persons) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(20).text(tree.name || 'Arbre généalogique', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#666').text(`Export GeneaIA — ${new Date().toLocaleDateString('fr-FR')}`, { align: 'center' });
    doc.fillColor('#000');

    if (tree.description) {
      doc.moveDown();
      doc.fontSize(11).text(tree.description, { align: 'left' });
    }

    doc.moveDown();
    doc.fontSize(14).text(`Personnes (${persons.length})`, { underline: true });
    doc.moveDown(0.5);

    const sorted = [...persons].sort((a, b) => {
      const la = (a.lastName || '').localeCompare(b.lastName || '', 'fr');
      if (la !== 0) return la;
      return (a.firstName || '').localeCompare(b.firstName || '', 'fr');
    });

    doc.fontSize(11);
    for (const person of sorted) {
      doc.font('Helvetica-Bold').text(personLine(person), { continued: false });
      doc.font('Helvetica');
      const details = [];
      if (person.birthPlace) details.push(`Lieu de naissance : ${person.birthPlace}`);
      if (person.occupation) details.push(`Profession : ${person.occupation}`);
      if (person.biography) details.push(person.biography.slice(0, 400));
      if (details.length) {
        doc.fontSize(10).fillColor('#333').text(details.join('\n'), { indent: 12 });
        doc.fillColor('#000').fontSize(11);
      }
      doc.moveDown(0.4);

      if (doc.y > doc.page.height - 80) {
        doc.addPage();
      }
    }

    doc.end();
  });
}

module.exports = { generateTreePdf };
