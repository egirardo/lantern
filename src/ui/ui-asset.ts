// The URL of a piece from the UI pack in public/assets/ui/ (see CREDITS.md
// there). These are the page's own decorations (icons, frames), not game
// art, so they aren't in the asset manifest: game code never refers to them.
// BASE_URL is where Vite serves public/ (the site root here).
export function uiAsset(fileName: string): string {
  return `${import.meta.env.BASE_URL}assets/ui/${fileName}`
}
