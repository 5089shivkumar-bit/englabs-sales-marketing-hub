import * as XLSX from 'xlsx';
import { TechCategory } from '../types';

export const excelService = {
  /**
   * Parse an Excel file and return raw JSON data from the first sheet
   */
  async parseExcel(file: File): Promise<{ columns: string[], data: any[] }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });

          let columns: string[] = [];
          let json: any[] = [];
          let foundSheet = '';

          // Iterate through all sheets to find data
          for (const sheetName of workbook.SheetNames) {
            const worksheet = workbook.Sheets[sheetName];
            const tempJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

            if (tempJson.length > 0) {
              json = tempJson;
              columns = Object.keys(tempJson[0]);
              foundSheet = sheetName;
              break;
            }
          }

          if (json.length === 0) {
            resolve({ columns: [], data: [] });
            return;
          }

          resolve({ columns, data: json });
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  },

  /**
   * Generate and download an Excel template based on the type
   */
  downloadTemplate(type: 'customers' | 'pricing' | 'expos') {
    let headers: string[] = [];
    let fileName = '';

    if (type === 'customers') {
      headers = ['Customer Name', 'City', 'State', 'Country', 'Industry', 'Annual Turnover', 'Project Turnover', 'Contact 1 Name', 'Contact 1 Email', 'Contact 1 Phone', 'Contact 1 Designation'];
      fileName = 'MarkEng_Customer_Template.xlsx';
    } else if (type === 'pricing') {
      headers = ['Customer Name', 'Technology', 'Rate', 'Unit', 'Date (YYYY-MM-DD)'];
      fileName = 'MarkEng_Pricing_Template.xlsx';
    } else if (type === 'expos') {
      headers = ['Event Name', 'Location', 'Region', 'Date (YYYY-MM-DD)', 'Industry Focus', 'Website Link'];
      fileName = 'MarkEng_Expo_Template.xlsx';
    }

    const ws = XLSX.utils.aoa_to_sheet([headers]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, fileName);
  },

  /**
   * Intelligent mapping for "AUTOMATIC" Excel format.
   */
  mapAutomaticExcel: (data: any[]) => {
    return data.map(row => ({
      inquiryId: String(row['EQ No.'] || row['Inquiry ID'] || `EQ-${Date.now()}-${Math.floor(Math.random() * 1000)}`),
      leadName: String(row['FROM'] || row['Lead Name'] || row['Client Name'] || 'Unknown Client'),
      date: String(row['DATE'] || row['Inquiry Date'] || new Date().toISOString().split('T')[0]),
      value: parseFloat(String(row['VALUE'] || row['Amount'] || 0).replace(/[^\d.]/g, '')),
      status: (row['STATUS'] || row['Open / Closed'] || row['Open/Closed'] || 'Open').toLowerCase().includes('close') ? 'Closed' : 'Open',
      industry: String(row['From'] || row['FROM'] || row['Industry'] || row['Primary Industry'] || 'General Mfg').trim(),
      pincode: String(row['Pincode'] || row['ZIP'] || '').trim(),
      city: String(row['City'] || ''),
      state: String(row['State'] || '')
    }));
  }
};