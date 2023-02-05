<script lang="ts">
  import { CLIENT_ID, SCOPES } from "../config.json";
  import {
    auth,
    deleting,
    onMore,
    playlists,
    selectedPlaylist,
    selectedPlaylistVideos,
    selectedVideos,
    user,
    videos,
    youtube,
  } from "./stores";
  import Item from "./Item.svelte";
  import type { Video } from "./types";
  import { get } from "svelte/store";
  import { deleteVideo, RateLimitError } from "./api";

  let open = false;

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

  async function onDeleteAll() {
    $deleting = true;
    const inFlightLimit = 7;
    const timeout = 1500;
    const chunks = $selectedVideos.reduce(
      (acc, video) => {
        const [first, ...rest] = acc;
        if (first.length >= inFlightLimit) return [[video], first, ...rest];
        else return [[video, ...first], ...rest];
      },
      [[]]
    );

    const client = get(youtube);
    let stop = false;
    for (const chunk of chunks) {
      if (stop) break;
      await Promise.all([
        chunk.map(({ id }) =>
          deleteVideo(client, id)
            .then(() => {
              videos.update((v) => v.filter((v) => v.id !== id));
              selectedVideos.update((v) => v.filter((v) => v.id !== id));
            })
            .catch((e) => {
              console.error(e);
              if (e instanceof RateLimitError) {
                alert("Rate Limit reached.");
              } else {
                alert(e.message);
              }
              stop = true;
            })
        ),
        new Promise((resolve) => setTimeout(resolve, timeout)),
      ]);
    }
    $deleting = false;
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
  <details bind:open>
    <summary>
      <span>Selected</span>
      <button
        disabled={$selectedVideos.length === 0 || !open || $deleting}
        on:click={onDeleteAll}
        title={$deleting ? "deleting..." : "Delete All"}
      >
        Delete All
      </button>
    </summary>
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
