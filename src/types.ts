export type GoogleAuth = gapi.auth2.GoogleAuth;
export type GoogleUser = gapi.auth2.GoogleUser;
export type YouTube = typeof gapi.client.youtube;
export type Playlist = gapi.client.youtube.Playlist;
export type Video = gapi.client.youtube.PlaylistItem;
export type Item = Playlist | Video;

export type PageToken = string | null;

export function isPlaylist(value: any): value is Playlist {
  return typeof value === "object" && value.kind === "youtube#playlist";
}

export function isVideo(value: any): value is Video {
  return typeof value === "object" && value.kind === "youtube#playlistItem";
}
