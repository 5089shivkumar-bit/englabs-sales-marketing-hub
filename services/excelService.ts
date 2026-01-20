
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
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const json: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
          
          if (json.length === 0) {
            resolve({ columns: [], data: [] });
            return;
          }

          const columns = Object.keys(json[0]);
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
  }
};