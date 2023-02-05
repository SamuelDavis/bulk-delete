import type { Writable } from "svelte/store";
import { derived, writable } from "svelte/store";
import type {
  GoogleAuth,
  GoogleUser,
  Item,
  Playlist,
  Video,
  YouTube,
} from "./types";
import { API_KEY, DISCOVERY_DOCS } from "../config.json";
import { listPlaylists, listVideos } from "./api";

export const auth = writable<GoogleAuth>(null);
export const user = writable<GoogleUser>(null);
export const youtube = writable<YouTube>(null);
export const playlists = persistent<Playlist[]>("playlists", []);
export const videos = persistent<Video[]>("videos", []);
export const selectedPlaylist = persistent<Playlist>("selected-playlist", null);
export const selectedVideos = persistent<Video[]>("selected-videos", []);
export const queuedForDelete = persistent<Video[]>("queued-for-delete", []);
export const pageToken = persistent("page-token", null);
export const playlistGenerator = derived([youtube], ([youtube]) =>
  youtube ? listPlaylists(youtube) : null
);
export const done = persistent<Record<"playlists" | Playlist["id"], boolean>>(
  "done",
  { playlists: false }
);
export const videoGenerator = derived(
  [youtube, selectedPlaylist, pageToken],
  ([youtube, selectedPlaylist]) =>
    youtube && selectedPlaylist
      ? listVideos(youtube, selectedPlaylist.id)
      : null
);
export const onMore = derived(
  [selectedPlaylist, done, playlistGenerator, videoGenerator],
  ([selectedPlaylist, done, playlistGenerator, videoGenerator]) => {
    if (done[selectedPlaylist ? selectedPlaylist.id : "playlists"] ?? false)
      return false;
    return selectedPlaylist
      ? videoGenerator &&
          generatorToStore(videoGenerator, videos, selectedPlaylist)
      : playlistGenerator && generatorToStore(playlistGenerator, playlists);
  }
);
export const selectedPlaylistVideos = derived(
  [selectedPlaylist, videos],
  ([selectedPlaylist, videos]) => {
    if (!selectedPlaylist) return [];
    return videos.filter(
      (video) => video.snippet.playlistId === selectedPlaylist.id
    );
  }
);

selectedPlaylist.subscribe(() => {
  pageToken.set(null);
});

function persistent<T>(key: string, initial: T = null) {
  key = `bulkDelete#${key}`;
  const item = JSON.parse(localStorage.getItem(key) || "null") as T | null;
  const store = writable<T>(item === null ? initial : item);
  store.subscribe((value) => localStorage.setItem(key, JSON.stringify(value)));
  return store;
}

auth.subscribe((auth) => {
  if (!auth) return;
  auth.currentUser.listen((currentUser) => {
    user.set(currentUser.isSignedIn() ? currentUser : null);
    gapi.client.setApiKey(API_KEY);
    Promise.all(DISCOVERY_DOCS.map((url) => gapi.client.load(url))).then(() => {
      youtube.set(gapi.client.youtube);
    });
  });
});

function generatorToStore<T extends Item>(
  generator: AsyncGenerator<T[]>,
  store: Writable<T[]>,
  playlist: Playlist = null
) {
  return () =>
    generator.next().then(({ value, done: isDone }) => {
      done.update((done) => ({
        ...done,
        [playlist ? playlist.id : "playlists"]: isDone,
      }));
      if (value)
        store.update((items) => [
          ...items,
          ...value.filter(({ id }) => !items.some((item) => item.id === id)),
        ]);
    });
}
