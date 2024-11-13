import config from './config.js';
import { ErrorLogger } from './utils.js';

class ExportService {
    // Static registry for export formats
    static #exporters = {
        pdf: (content) => this._exportToPDF(content),
        txt: (content) => this._exportToTXT(content),
        fdx: (content) => this._exportToFDX(content)
    };

    // PDF Export using jspdf
    static _exportToPDF(content) {
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            // Set font to Courier (screenplay standard)
            doc.setFont('Courier');
            doc.setFontSize(12);

            // Split content into lines and add to PDF
            const lines = content.split('\n');
            lines.forEach((line, index) => {
                doc.text(line, 10, 10 + (index * 7));
            });

            doc.save('screenplay.pdf');
            return true;
        } catch (error) {
            ErrorLogger.log(error, 'PDF Export Failed');
            return false;
        }
    }

    // Plain Text Export
    static _exportToTXT(content) {
        try {
            const blob = new Blob([content], { type: 'text/plain' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'screenplay.txt';
            link.click();
            URL.revokeObjectURL(link.href);
            return true;
        } catch (error) {
            ErrorLogger.log(error, 'TXT Export Failed');
            return false;
        }
    }

    // Final Draft XML Export
    static _exportToFDX(content) {
        try {
            // Basic FDX structure
            const fdxContent = `<?xml version="1.0" encoding="UTF-8"?>
<FinalDraft DocumentType="Script" Template="No" Version="1">
    <Content>
        <Paragraph>
            ${content.split('\n').map(line => 
                `<Text>${this._escapeXML(line)}</Text>`
            ).join('\n')}
        </Paragraph>
    </Content>
</FinalDraft>`;

            const blob = new Blob([fdxContent], { type: 'application/xml' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'screenplay.fdx';
            link.click();
            URL.revokeObjectURL(link.href);
            return true;
        } catch (error) {
            ErrorLogger.log(error, 'FDX Export Failed');
            return false;
        }
    }

    // XML Escaping utility
    static _escapeXML(unsafe) {
        return unsafe.replace(/[<>&'"]/g, (c) => {
            switch (c) {
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '&': return '&amp;';
                case '\'': return '&apos;';
                case '"': return '&quot;';
            }
        });
    }

    // Main export method
    static export(content, format = null) {
        // Use default format from config if not specified
        format = format || config.get('export.defaultFormat', 'pdf');

        // Validate format
        if (!config.get('export.availableFormats', []).includes(format)) {
            ErrorLogger.log(`Unsupported export format: ${format}`, 'Export Error');
            return false;
        }

        // Execute appropriate exporter
        const exporter = this.#exporters[format];
        if (!exporter) {
            ErrorLogger.log(`No exporter found for format: ${format}`, 'Export Error');
            return false;
        }

        return exporter(content);
    }

    // Method to register custom exporters
    static registerExporter(format, exporterFn) {
        if (typeof exporterFn !== 'function') {
            throw new Error('Exporter must be a function');
        }
        this.#exporters[format] = exporterFn;
        
        // Update available formats in config
        const availableFormats = config.get('export.availableFormats', []);
        if (!availableFormats.includes(format)) {
            config.set('export.availableFormats', [...availableFormats, format]);
        }
    }
}

// Export for module compatibility
export default ExportService;
