import { StickyColorConfig } from '../types/canvas';

export const STICKY_PALETTES: Record<string, StickyColorConfig> = {
  yellow: {
    id: 'yellow',
    name: 'Butter Yellow',
    bg: '#FEF08A',
    border: '#FDE047',
    text: '#713F12',
    tagBg: 'rgba(113, 63, 18, 0.12)',
    tagText: '#713F12',
  },
  mint: {
    id: 'mint',
    name: 'Fresh Mint',
    bg: '#BBF7D0',
    border: '#86EFAC',
    text: '#14532D',
    tagBg: 'rgba(20, 83, 45, 0.12)',
    tagText: '#14532D',
  },
  rose: {
    id: 'rose',
    name: 'Soft Rose',
    bg: '#FECDD3',
    border: '#FDA4AF',
    text: '#881337',
    tagBg: 'rgba(136, 19, 55, 0.12)',
    tagText: '#881337',
  },
  lavender: {
    id: 'lavender',
    name: 'Lavender Mist',
    bg: '#E9D5FF',
    border: '#D8B4FE',
    text: '#581C87',
    tagBg: 'rgba(88, 28, 135, 0.12)',
    tagText: '#581C87',
  },
  sky: {
    id: 'sky',
    name: 'Sky Blue',
    bg: '#BAE6FD',
    border: '#7DD3FC',
    text: '#0C4A6E',
    tagBg: 'rgba(12, 74, 110, 0.12)',
    tagText: '#0C4A6E',
  },
  peach: {
    id: 'peach',
    name: 'Warm Peach',
    bg: '#FED7AA',
    border: '#FDBA74',
    text: '#7C2D12',
    tagBg: 'rgba(124, 45, 18, 0.12)',
    tagText: '#7C2D12',
  },
  white: {
    id: 'white',
    name: 'Pure Canvas',
    bg: '#FFFFFF',
    border: '#E2E8F0',
    text: '#1E293B',
    tagBg: 'rgba(30, 41, 59, 0.08)',
    tagText: '#334155',
  },
  dark: {
    id: 'dark',
    name: 'Dark Slate',
    bg: '#1E293B',
    border: '#334155',
    text: '#F8FAFC',
    tagBg: 'rgba(248, 250, 252, 0.16)',
    tagText: '#F8FAFC',
  },
};

export const SHAPE_FILL_PRESETS = [
  { id: 'slate', name: 'Slate', fill: '#F1F5F9', stroke: '#94A3B8', text: '#0F172A' },
  { id: 'blue', name: 'Blue', fill: '#EFF6FF', stroke: '#60A5FA', text: '#1E3A8A' },
  { id: 'emerald', name: 'Emerald', fill: '#ECFDF5', stroke: '#34D399', text: '#064E3B' },
  { id: 'amber', name: 'Amber', fill: '#FFFBEB', stroke: '#FBBF24', text: '#78350F' },
  { id: 'rose', name: 'Rose', fill: '#FFF1F2', stroke: '#FB7185', text: '#881337' },
  { id: 'purple', name: 'Purple', fill: '#FAF5FF', stroke: '#C084FC', text: '#581C87' },
  { id: 'transparent', name: 'Outline', fill: 'transparent', stroke: '#475569', text: '#0F172A' },
  { id: 'solid-dark', name: 'Solid Dark', fill: '#0F172A', stroke: '#334155', text: '#FFFFFF' },
];

export const CONNECTOR_COLORS = [
  { id: 'slate', color: '#64748B' },
  { id: 'blue', color: '#3B82F6' },
  { id: 'emerald', color: '#10B981' },
  { id: 'amber', color: '#F59E0B' },
  { id: 'rose', color: '#F43F5E' },
  { id: 'purple', color: '#A855F7' },
  { id: 'dark', color: '#1E293B' },
];

export const PEN_COLORS = [
  { id: 'dark', color: '#1E293B' },
  { id: 'blue', color: '#2563EB' },
  { id: 'red', color: '#DC2626' },
  { id: 'emerald', color: '#059669' },
  { id: 'amber', color: '#D97706' },
  { id: 'purple', color: '#7C3AED' },
  { id: 'white', color: '#FFFFFF' },
];

export const PRIORITY_STYLES: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  urgent: { label: 'Urgent', bg: 'bg-rose-50 border-rose-200', text: 'text-rose-700', dot: 'bg-rose-500' },
  high: { label: 'High', bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', dot: 'bg-amber-500' },
  normal: { label: 'Medium', bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', dot: 'bg-blue-500' },
  low: { label: 'Low', bg: 'bg-slate-50 border-slate-200', text: 'text-slate-600', dot: 'bg-slate-400' },
};
