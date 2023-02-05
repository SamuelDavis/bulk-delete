<script lang="ts">
  import { CLIENT_ID, SCOPES } from "../config.json";
  import {
    auth,
    onMore,
    playlists,
    selectedPlaylist,
    selectedPlaylistVideos,
    selectedVideos,
    user,
  } from "./stores";
  import Item from "./Item.svelte";
  import type { Video } from "./types";

  const onSignIn = () => $auth.signIn();
  const onSignOut = () => {
    $auth.signOut();
    localStorage.clear();
  };

  function onToggleSelect(video: Video) {
    selectedVideos.update((videos) => {
      const index = videos.findIndex(({ id }) => id === video.id);
      return index in videos
        ? [...videos.slice(0, index), ...videos.slice(index + 1)]
        : [...videos, video];
    });
  }

  gapi.load("client:auth2", () => {
    $auth = gapi.auth2.init({ client_id: CLIENT_ID, scope: SCOPES.join(",") });
  });
</script>

<header>
  {#if $user}
    <button on:click={onSignOut}>Sign Out</button>
    <button disabled={$onMore === false} on:click={$onMore}>More</button>
    {#if $selectedPlaylist}
      <button on:click={() => ($selectedPlaylist = null)}>Back</button>
    {/if}
  {:else}
    <button on:click={onSignIn}>Sign In</button>
  {/if}
</header>

<hr />

<aside>
  <details disabled={$selectedVideos.length === 0}>
    <summary>Selected</summary>
    <ol>
      {#each $selectedVideos as data (data.id)}
        <li on:click={() => onToggleSelect(data)}>
          <Item {data} />
        </li>
      {/each}
    </ol>
  </details>
</aside>

<hr />

{#if $user}
  <main>
    {#if $selectedPlaylist}
      <ol>
        {#each $selectedPlaylistVideos as data (data.id)}
          <li
            on:click={() => onToggleSelect(data)}
            class:selected={$selectedVideos.some(({ id }) => id === data.id)}
          >
            <Item {data} />
          </li>
        {/each}
      </ol>
    {:else}
      <ol>
        {#each $playlists as data (data.id)}
          <li on:click={selectedPlaylist.set.bind(selectedPlaylist, data)}>
            <Item {data} />
          </li>
        {/each}
      </ol>
    {/if}
  </main>
{/if}

<style lang="css">
  main {
    flex: 1;
    overflow-y: scroll;
  }

  ol {
    list-style-type: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 0.5em;
  }

  li {
    cursor: pointer;
    padding: 0.25em;
  }

  li:hover {
    background-color: lightgreen;
  }
  li:hover :global(img) {
    opacity: 50%;
  }

  li.selected {
    background-color: pink;
  }
</style>
