
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Expense, Income, Project } from '../types';

export const dataService = {
    // --- EXPORT ---

    exportPDF: (title: string, columns: string[], rows: any[][]) => {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(20);
        doc.text(title, 14, 22);
        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);

        // Table
        autoTable(doc, {
            head: [columns],
            body: rows,
            startY: 40,
        });

        doc.save(`${title.toLowerCase().replace(/\s+/g, '_')}.pdf`);
    },

    exportExcel: (data: any[], fileName: string, sheetName: string) => {
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
        XLSX.writeFile(workbook, `${fileName}.xlsx`);
    },

    // --- IMPORT ---

    readExcel: (file: File): Promise<any[]> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const data = e.target?.result;
                    const workbook = XLSX.read(data, { type: 'binary' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const json = XLSX.utils.sheet_to_json(worksheet);
                    resolve(json);
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = (error) => reject(error);
            reader.readAsBinaryString(file);
        });
    }
};
