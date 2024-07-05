<!-- Button logics -->
<script lang="ts">
  import type { HTMLButtonAttributes } from "svelte/elements";

  export let variant: 'filled' | 'outlined' = 'filled';
  export let type: HTMLButtonAttributes['type'] = 'button';
</script>

<!-- Button contents -->
<button {type} class:filled={variant === 'filled'} class:outlined={variant === 'outlined'} on:click>
  <slot></slot>
</button>

<!-- Button styles -->
<style>
  button {
    border-radius: 8px;
    padding: 0.5rem 1.25rem;
    font-size: inherit;
    font-weight: 500;
    font-family: inherit;
    cursor: pointer;
    transition: background-color .2s;
    min-width: 36px;
  }

  button.filled {
    border: none;
    outline-offset: 2px;
    background-color: var(--accent-color);
    color: var(--background-color);
  }
  button.filled:hover {
    background-color: color-mix(in srgb, var(--accent-color) 95%, #00000040);
  }
  button.filled:focus,
  button.filled:focus-visible {
    background-color: color-mix(in srgb, var(--accent-color) 90%, #00000040);
    outline: 1px solid var(--accent-color);
  }
  
  button.outlined {
    border: 1px solid var(--ring-color);
    outline: none;
    background-color: transparent;
    color: var(--text-color);
  }
  button.outlined:hover {
    background-color: color-mix(in srgb, var(--accent-color) 15%, transparent);
  }
  button.outlined:focus,
  button.outlined:focus-visible {
    background-color: color-mix(in srgb, var(--accent-color) 20%, transparent);
    border: 1px solid var(--accent-color);
  }
</style>