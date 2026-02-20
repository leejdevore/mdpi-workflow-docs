import type { ViewId } from '@/data/types';

export type ViewMode = 'tabs' | 'overlay' | 'slider';

export interface OverlayConfig {
  primaryView: ViewId;
  ghostViews: ViewId[];
}

export interface SliderConfig {
  leftView: ViewId;
  rightView: ViewId;
  dividerPosition: number; // 0-100 percentage from left
}
