import { SceneType } from './types';

export interface SceneConfig {
  id: SceneType;
  label: string;
  icon: string;
}

// Modify this list to add, remove, or reorder scenes in the app
export const SCENE_LIST: SceneConfig[] = [
  { id: 'CUSTOM', label: 'DIY', icon: '🎨' },
  { id: 'FISHERMAN', label: 'Ink River', icon: '🎣' },
  { id: 'EGYPT', label: 'Egypt', icon: '🐫' },
  { id: 'CHRISTMAS', label: 'Christmas', icon: '🎄' },
  { id: 'WINTER', label: 'Winter', icon: '❄️' },
  { id: 'RAIN', label: 'Rain', icon: '🌧️' },
  { id: 'SAKURA', label: 'Sakura', icon: '🌸' },
];