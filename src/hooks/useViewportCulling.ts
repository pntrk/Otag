import { useMemo } from 'react';
import { ResourceNode } from '../utils/worldGenerator';

export interface Viewport {
  cameraX: number;
  cameraY: number;
  viewportWidth: number;
  viewportHeight: number;
  zoomLevel: number;
}

/**
 * On binlerce kaynağın tarayıcıyı dondurmasını engelleyip sadece ekran koordinatlarına girenleri süzen 60 FPS viewport culling kancası.
 */
export function useViewportCulling(
  nodes: ResourceNode[],
  { cameraX, cameraY, viewportWidth, viewportHeight, zoomLevel }: Viewport
) {
  return useMemo(() => {
    if (!nodes || nodes.length === 0) return [];
    
    // Ekranda görünen gerçek koordinat sınırları (+250px güvenlik tamponu)
    const halfW = (viewportWidth / 2) / zoomLevel + 250;
    const halfH = (viewportHeight / 2) / zoomLevel + 250;

    const minX = cameraX - halfW;
    const maxX = cameraX + halfW;
    const minY = cameraY - halfH;
    const maxY = cameraY + halfH;

    return nodes.filter(node => node.x >= minX && node.x <= maxX && node.y >= minY && node.y <= maxY);
  }, [nodes, cameraX, cameraY, viewportWidth, viewportHeight, zoomLevel]);
}
