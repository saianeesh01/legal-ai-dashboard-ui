declare module 'pdfjs-dist/legacy/build/pdf.js' {
    import * as pdfjsLib from 'pdfjs-dist';
    export = pdfjsLib;
}

declare module 'pdfjs-dist' {
    export const GlobalWorkerOptions: any;
    export function getDocument(params: any): any;
}
