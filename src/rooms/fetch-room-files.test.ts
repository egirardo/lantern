import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchRoomFiles } from './fetch-room-files'
import { ZodError } from 'zod'

const validRoom = {
  id: 'test-room',
  name: 'Test Room',
  map: 'test-map',
  playerStart: { x: 0, y: 0 },
  description: 'A room for testing',
  exits: [
    {
      tiles: [{ x: 1, y: 1 }],
      to: 'another-room',
    },
  ],
  enemies: [],
}

function fakeFetch(files: Record<string, unknown>) {
  return vi.fn(async (url: string) =>
    url in files
      ? new Response(JSON.stringify(files[url]))
      : new Response('', { status: 404 }),
  )
}

describe('fetchRoomFiles', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('fetches the map named in the room file', async () => {
    const map = { fake: true }
    const fetchMock = fakeFetch({
      '/rooms/test-room.json': validRoom,
      '/maps/test-map.tmj': map,
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await fetchRoomFiles('test-room')

    expect(result).toEqual({ roomData: validRoom, mapData: map })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('throws with the room URL when the room file is missing', async () => {
    vi.stubGlobal('fetch', fakeFetch({})) // no files at all, so every URL is a 404

    await expect(fetchRoomFiles('test-room')).rejects.toThrow(
      '/rooms/test-room.json',
    )
  })

  it('throws with the map URL when the map file is missing', async () => {
    vi.stubGlobal(
      'fetch',
      fakeFetch({
        '/rooms/test-room.json': validRoom,
      }),
    )

    await expect(fetchRoomFiles('test-room')).rejects.toThrow(
      '/maps/test-map.tmj',
    )
  })

  it('throws when the room data fails validation and never fetches the map', async () => {
    const invalidRoom = { ...validRoom, map: '' } // empty map name
    const fetchMock = fakeFetch({
      '/rooms/test-room.json': invalidRoom,
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchRoomFiles('test-room')).rejects.toThrow(ZodError)
    expect(fetchMock).toHaveBeenCalledTimes(1) // only the room was fetched
  })

  // Vite's dev server answers a missing file with 200 and index.html,
  // so these fakes return HTML with an OK status instead of a 404.
  const html = '<!doctype html><html></html>'

  it('throws with the room URL when the room file is not JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(html)),
    )

    await expect(fetchRoomFiles('test-room')).rejects.toThrow(
      '/rooms/test-room.json is not valid JSON',
    )
  })

  it('throws with the map URL when the map file is not JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) =>
        url === '/rooms/test-room.json'
          ? new Response(JSON.stringify(validRoom))
          : new Response(html),
      ),
    )

    await expect(fetchRoomFiles('test-room')).rejects.toThrow(
      '/maps/test-map.tmj is not valid JSON',
    )
  })
})
