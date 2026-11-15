import { GenerationMode, OutputLayout } from '../types';

export const OUTPUT_LAYOUT_LABELS: Record<OutputLayout, string> = {
  single: 'Single Reveal',
  'salon-sheet': 'Salon Sheet',
  'before-after': 'Before / After',
};

export const GENERATION_MODE_LABELS: Record<GenerationMode, { label: string; desc: string }> = {
  fast: { label: 'Fast', desc: 'Quick preview' },
  studio: { label: 'Studio', desc: 'Crisp salon detail' },
};
