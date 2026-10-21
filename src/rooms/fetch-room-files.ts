import { roomSchema } from './room-schema'

export async function fetchRoomFiles(
  roomId: string,
): Promise<{ roomData: unknown; mapData: unknown }> {
  // 1. Fetch the room file. It's `unknown`, so we can't touch .map yet...
  const roomUrl = `/rooms/${roomId}.json`
  const roomData = await fetchJson(roomUrl)

  // 2. ...so validate it first. Now TypeScript knows `room.map` is a string.
  const room = roomSchema.parse(roomData)

  // 3. Use a field from the room file to build the map URL, then fetch the map
  const mapUrl = `/maps/${room.map}.tmj`
  const mapData = await fetchJson(mapUrl)

  return { roomData, mapData }
}

// Fetches a file and reads it as JSON. Both ways it can fail throw an error
// that names the URL, so the console says which file was wrong.
async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`)
  }

  // Vite's dev server answers a missing file with 200 and index.html, so the
  // ok check above passes and .json() throws "Unexpected token '<'".
  // `return await` (not just `return`) matters here: without `await`, the
  // promise is returned before it fails, and this catch never sees the error.
  try {
    return await response.json()
  } catch (error) {
    // `cause` keeps the original SyntaxError attached for the console.
    throw new Error(`${url} is not valid JSON`, { cause: error })
  }
}
