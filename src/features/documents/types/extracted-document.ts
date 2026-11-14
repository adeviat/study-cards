export type ExtractedPage = {
  pageNumber: number;
  text: string;
};

export type ExtractedDocument = {
  fileName: string;
  pageCount: number;
  pages: ExtractedPage[];
};