declare module "pdf-parse" {
  interface PDFData {
    text: string;
    numpages: number;
    info: Record<string, unknown>;
  }

  function parse(buffer: Buffer): Promise<PDFData>;
  export default parse;
}