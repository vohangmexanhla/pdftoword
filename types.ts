
export interface DocElement {
  type: 'heading' | 'paragraph' | 'list' | 'table';
  content: any;
  level?: number;
}

export interface TableRow {
  cells: string[];
}

export interface TableContent {
  rows: TableRow[];
}

export interface AnalysisResult {
  pages: {
    pageNumber: number;
    elements: DocElement[];
  }[];
}

export interface ProcessingStatus {
  step: 'idle' | 'uploading' | 'extracting' | 'analyzing' | 'generating' | 'completed' | 'error';
  progress: number;
  message: string;
}
