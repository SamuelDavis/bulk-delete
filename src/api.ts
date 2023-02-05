import type { PageToken, Playlist, Video, YouTube } from "./types";

export async function* listPlaylists(youtube: YouTube) {
  const channels = await youtube.channels.list({
    maxResults: 100,
    part: "id,snippet,contentDetails",
    mine: true,
  });

  if (channels.status === 200) {
    const response = await youtube.playlists.list({
      part: "id,snippet,contentDetails",
      id: channels.result.items[0].contentDetails.relatedPlaylists.likes,
    });
    if (response.status === 200) yield response.result.items;
  }

  let status = 200;
  let pageToken: PageToken = null;
  do {
    const response = await youtube.playlists.list({
      pageToken,
      maxResults: 100,
      part: "id,snippet,contentDetails",
      mine: true,
    });
    status = response.status;
    pageToken = response.result.nextPageToken;
    const { items } = response.result;
    yield items;
  } while (status === 200 && pageToken);
}

export async function* listVideos(
  youtube: YouTube,
  playlistId: Playlist["id"]
) {
  let status = 200;
  let pageToken: PageToken = null;
  do {
    const response = await youtube.playlistItems.list({
      pageToken,
      maxResults: 100,
      part: "id,snippet,contentDetails",
      playlistId,
    });
    status = response.status;
    pageToken = response.result.nextPageToken;
    const { items } = response.result;
    yield items;
  } while (status === 200 && pageToken);
}

export async function deleteVideo(youtube: YouTube, id: Video["id"]) {
  return youtube.playlistItems
    .delete({ id })
    .then((response) => {
      if (response.status !== 204)
        throw new Error(`failed to delete playlist item: ${response.status}`, {
          cause: { arguments, response },
        });
    })
    .catch((e) => {
      if (e.status === 404) return;
      if (e.status === 403) throw new RateLimitError();
    });
}

export class RateLimitError extends Error {}
