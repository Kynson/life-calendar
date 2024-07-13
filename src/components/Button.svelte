<!-- Button logics -->
<script lang="ts">
  import type { HTMLButtonAttributes } from "svelte/elements";

  export let variant: 'filled' | 'outlined' | 'mini-icon' | 'link' = 'filled';
  export let type: HTMLButtonAttributes['type'] = 'button';
  
  let clazz = '';
  export { clazz as class };
</script>

<!-- Button contents -->
<button {type} class:filled={variant === 'filled'} class:outlined={variant === 'outlined'} class:mini-icon={variant === 'mini-icon'} class:link={variant === 'link'} class="{clazz}" on:click>
  <slot></slot>
</button>

<!-- Button styles -->
<style>
  button {
    font-weight: 500;
    font-family: inherit;
    cursor: pointer;
    transition: background-color .2s;
  }

  button:is(.filled, .outlined) {
    padding: 0.5rem 1.25rem;
    border-radius: 8px;
    min-width: 36px;
  }

  button:is(.filled, .mini-icon) {
    border: none;
  }

  button:is(.outlined, .mini-icon) {
    color: var(--text-color);
    background-color: transparent;
    outline: none;
  }

  button.filled {
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
  }
  button:is(.outlined, .mini-icon):hover {
    background-color: color-mix(in srgb, var(--accent-color) 15%, transparent);
  }
  button:is(.outlined, .mini-icon):focus,
  button:is(.outlined, .mini-icon):focus-visible {
    background-color: color-mix(in srgb, var(--accent-color) 20%, transparent);
    border: 1px solid var(--accent-color);
  }

  button.mini-icon {
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 4px;
    /* padding + border */
    padding: calc(.25rem + 1px);
  }

  button.mini-icon:focus,
  button.mini-icon:focus-visible {
    padding: .25rem;
  }

  button.link {
    background-color: transparent;
    padding: 0;
    border: none;
  }
</style>