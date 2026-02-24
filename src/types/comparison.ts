import type { UUID } from '@/types/workflow';

export type ViewMode = 'tabs' | 'overlay' | 'slider';

export interface OverlayConfig {
  primaryView: UUID; // scenario ID
  ghostViews: UUID[]; // scenario IDs
}

export interface SliderConfig {
  leftView: UUID; // scenario ID
  rightView: UUID; // scenario ID
  dividerPosition: number; // 0-100 percentage from left
}
