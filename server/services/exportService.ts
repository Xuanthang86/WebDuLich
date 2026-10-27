import { Lead } from '../db/schema';
import { sanitizeCsvCell } from '../middleware/security';

export class ExportService {
  /**
   * Generates sanitized, UTF-8 CSV with Excel BOM
   */
  public static generateLeadsCsv(leads: Lead[]): string {
    const headers = [
      'Lead Code',
      'Created Date',
      'Full Name',
      'Email',
      'Phone',
      'Country of Origin',
      'Target Arrival',
      'Duration',
      'Guest Count',
      'Age Bracket',
      'Package Selected',
      'Destination Hub',
      'Accommodation Preference',
      'Estimated Budget',
      'Status',
      'Priority',
      'Source',
      'Additional Notes',
    ];

    const rows = leads.map(l => [
      sanitizeCsvCell(l.leadCode),
      sanitizeCsvCell(new Date(l.createdAt).toLocaleDateString('en-US')),
      sanitizeCsvCell(l.fullName),
      sanitizeCsvCell(l.email),
      sanitizeCsvCell(l.phone),
      sanitizeCsvCell(l.countryCode),
      sanitizeCsvCell(l.expectedStartDate),
      sanitizeCsvCell(l.duration),
      sanitizeCsvCell(l.guestCount),
      sanitizeCsvCell(l.ageGroups),
      sanitizeCsvCell(l.packageName),
      sanitizeCsvCell(l.destinationCity),
      sanitizeCsvCell(l.preferredAccommodationType),
      sanitizeCsvCell(l.estimatedBudget),
      sanitizeCsvCell(l.status),
      sanitizeCsvCell(l.priority),
      sanitizeCsvCell(l.source),
      sanitizeCsvCell(l.additionalNotes),
    ]);

    // Prepend UTF-8 Byte Order Mark for Excel compatibility with special characters
    const bom = '\uFEFF';
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    return bom + csvContent;
  }

  /**
   * Generates clean Excel XML spreadsheet compatible with all spreadsheet viewers
   */
  public static generateLeadsExcelXml(leads: Lead[]): string {
    const rowsXml = leads
      .map(
        l => `
      <Row>
        <Cell><Data ss:Type="String">${this.escapeXml(l.leadCode)}</Data></Cell>
        <Cell><Data ss:Type="String">${this.escapeXml(new Date(l.createdAt).toISOString().split('T')[0])}</Data></Cell>
        <Cell><Data ss:Type="String">${this.escapeXml(l.fullName)}</Data></Cell>
        <Cell><Data ss:Type="String">${this.escapeXml(l.email)}</Data></Cell>
        <Cell><Data ss:Type="String">${this.escapeXml(l.phone || '')}</Data></Cell>
        <Cell><Data ss:Type="String">${this.escapeXml(l.countryCode || '')}</Data></Cell>
        <Cell><Data ss:Type="String">${this.escapeXml(l.packageName || '')}</Data></Cell>
        <Cell><Data ss:Type="String">${this.escapeXml(l.destinationCity || '')}</Data></Cell>
        <Cell><Data ss:Type="String">${this.escapeXml(l.duration || '')}</Data></Cell>
        <Cell><Data ss:Type="String">${this.escapeXml(l.status)}</Data></Cell>
        <Cell><Data ss:Type="String">${this.escapeXml(l.priority)}</Data></Cell>
      </Row>`
      )
      .join('');

    return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="Wanderers Inquiries">
  <Table>
   <Row>
    <Cell><Data ss:Type="String">Lead Code</Data></Cell>
    <Cell><Data ss:Type="String">Date</Data></Cell>
    <Cell><Data ss:Type="String">Full Name</Data></Cell>
    <Cell><Data ss:Type="String">Email</Data></Cell>
    <Cell><Data ss:Type="String">Phone</Data></Cell>
    <Cell><Data ss:Type="String">Country</Data></Cell>
    <Cell><Data ss:Type="String">Package</Data></Cell>
    <Cell><Data ss:Type="String">Destination</Data></Cell>
    <Cell><Data ss:Type="String">Duration</Data></Cell>
    <Cell><Data ss:Type="String">Status</Data></Cell>
    <Cell><Data ss:Type="String">Priority</Data></Cell>
   </Row>
   ${rowsXml}
  </Table>
 </Worksheet>
</Workbook>`;
  }

  private static escapeXml(str: string): string {
    return (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
