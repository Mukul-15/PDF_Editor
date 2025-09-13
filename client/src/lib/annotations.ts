export type TextAnnotation = { id: string; page: number; x: number; y: number; text: string };
export type HighlightAnnotation = { id: string; page: number; x: number; y: number; width: number; height: number };

export type Annotations = {
	texts: TextAnnotation[];
	highlights: HighlightAnnotation[];
};

export const createEmptyAnnotations = (): Annotations => ({ texts: [], highlights: [] });
