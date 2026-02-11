/**
 * Z-index constants for consistent layering across the application
 * 
 * These values establish a clear hierarchy for overlays, modals, and UI elements.
 * Higher values appear above lower values.
 */

export const Z_INDEX = {
  /** Base map layer (Leaflet map) */
  MAP: 0,
  
  /** Regular UI elements like panels, sidebar, search controls */
  UI_ELEMENTS: 1000,
  
  /** Page overlays like AnalysisReportPage, loading states, toasts */
  PAGE_OVERLAY: 50,
  
  /** Zone form modal (highest priority for data input) */
  ZONE_FORM_MODAL: 2000,
  
  /** Save/confirmation dialogs that appear above page overlays */
  SAVE_DIALOG_OVERLAY: 10000,
  
  /** Content within save/confirmation dialogs */
  SAVE_DIALOG_CONTENT: 10001,
} as const;

export type ZIndexLevel = keyof typeof Z_INDEX;
