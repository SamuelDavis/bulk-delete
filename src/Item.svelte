<script lang="ts">
  import type { Item } from "./types";
  import { isPlaylist, isVideo } from "./types";
  import { playlists, selectedVideos } from "./stores";

  export let data: Item;
  const header = data?.snippet?.title;
  const src = data?.snippet?.thumbnails?.default?.url ?? null;
  const playlistId = isVideo(data) ? data?.snippet?.playlistId : null;
  const title = isVideo(data)
    ? $playlists.find(({ id }) => id === playlistId)?.snippet?.title
    : data?.snippet?.description;
  const itemCount = isPlaylist(data) ? data?.contentDetails?.itemCount : null;
  const checked = isVideo(data)
    ? $selectedVideos.some(({ id }) => id === data.id)
    : null;
  const href = isPlaylist(data)
    ? `https://www.youtube.com/playlist?list=${data.id}`
    : `https://www.youtube.com/watch?${new URLSearchParams({
        v: data.contentDetails.videoId,
        list: data.snippet.playlistId,
        index: data.snippet.position.toString(),
      })}`;
</script>

<article {title}>
  <header>
    <a {href} rel="noreferrer" target="_blank" title={header}>{header}</a>
    {#if itemCount !== null}
      <span>{itemCount}</span>
    {/if}
    {#if checked !== null}
      <input type="checkbox" {checked} />
    {/if}
  </header>
  <hr />
  <section>
    <img alt="thumbnail" {src} />
  </section>
</article>

<style lang="css">
  article {
    width: 1.5in;
    height: 1.5in;
    overflow: hidden;
    border: 1px solid black;
  }

  header {
    display: flex;
    justify-content: space-between;
    gap: 0.25em;
    align-content: center;
    padding: 0 0.2em;
  }

  a {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 10pt;
  }

  input {
    flex: 0;
    padding: 0;
    margin: 0;
  }

  hr {
    margin-top: 0.25em;
  }

  section {
    display: grid;
    place-content: center;
  }
</style>
