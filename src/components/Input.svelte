<!-- Input logics -->
<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';

  import type { HTMLInputTypeAttribute } from 'svelte/elements';
  interface Events {
    input: Event
  }

  const dispatchEvent = createEventDispatcher<Events>();

  let input: HTMLInputElement;
  let selectedFileName: string;

  export let label: string;
  export let type: HTMLInputTypeAttribute;
  export let name: string = '';
  export let placeholder: string = '';
  export let checked: boolean = false;
  export let disabled: boolean = false;

  export let value: string = '';
  export let files: FileList = null;

  function assignDefaultValue() {
    switch (type) {
      case 'date':
        value = new Date().toISOString().split('T')[0];
        break;
      case 'color':
        value = '#ffffff';
        break;
    }
  }

  onMount(() => {
    if (!value) {
      assignDefaultValue();
    }

    input.value = value;
  });

  function handleChooseFileClick() {
    input.click();
  }

  function handleInput(event: Event) {
    const target = event.target as HTMLInputElement;

    value = target.value;
    dispatchEvent('input', event);

    if (target.type === 'checkbox') {
      checked = target.checked;
    }

    if (target.type !== 'file') {
      files = target.files;

      selectedFileName = target.files?.item(0)?.name;
    }
  }
</script>

<!-- Input contents -->
<label class="flex flex-space-between">
  <span>{label}</span>
  <div class="input-container">
    <input bind:this={input} on:input={handleInput} {value} {disabled} {placeholder} {type} {name} {...(type === 'checkbox' && {checked})}>
    {#if type === 'file'}
      <div>
        <button {disabled} type="button" on:click={handleChooseFileClick}>Choose file</button>
        <span>{selectedFileName || 'No file chosen'}</span>
      </div>
    {/if}
    {#if type === 'color'}
      <div style="background-color: {value}"></div>
    {/if}
  </div>
</label>

<!-- Input styles -->
<style>
  input, :is(input[type='file'], input[type='color']) + div {
    border: 1px solid var(--ring-color);
    border-radius: 8px;
    /* min-width: 275px; */
    width: 100%;
    outline: none;
    transition: border-color .2s;
  }

  input, input[type='file'] + div {
    appearance: none;
    background-color: color-mix(in srgb, var(--background-color) 95%, #fff);
    font: inherit;
    font-weight: 400;
    color: inherit;
  }

  input:not([type='file'], [type='color'], [type='checkbox']) {
    padding: 0.5rem 1rem;
  }

  input:not([type='file'], [type='color'], [type='checkbox']):focus {
    border-color: var(--accent-color);
  }

  input[type='color'], input[type='checkbox'], input[type='color'] + div {
    min-width: initial;
    margin: auto 0;
  }

  /* The foucs of color falls on the original input */
  input[type='checkbox']:focus, input[type='color']:focus + div {
    border-color: var(--accent-color);
  }

  input[type='color'], input[type='color'] + div {
    width: 20px;
    height: 20px;
    border-radius: 4px;
  }

  input[type='file'] {
    display: none;
  }

  input[type='color'] {
    position: absolute;
    z-index: -1;
    visibility: hidden;
  }

  input[type='color'] + div {
    cursor: pointer;
  }

  input[type='checkbox'] {
    position: relative;
    appearance: none;
    width: 40px;
    height: 20px;
    border-radius: 10px;
    background-color: var(--background-color);
    transition: background-color .2s;
  }

  input[type='checkbox']:checked {
    background-color: var(--accent-color);
  }

  input[type='checkbox']:checked:focus {
    outline: 1px solid var(--accent-color);
    outline-offset: 2px;
  }

  input[type='checkbox']::before {
    position: absolute;
    top: 0;
    left: 0;
    content: '';
    display: block;
    /* size - borders - margin */
    width: calc(20px - 1px * 2 - 2px * 2);
    height: calc(20px - 1px * 2 - 2px * 2);
    margin: 2px;
    border-radius: 50%;
    background-color: #fff;
    transition: left .2s;
  }

  input[type='checkbox']:checked::before {
    /* size - borders */
    left: calc(100% - (20px - 1px * 2));
  }

  input:disabled, input:disabled + div {
    opacity: 0.75;
    cursor: not-allowed;
  }

  button {
    border: none;
    border-radius: 8px 0 0 8px;
    padding: 0.5rem 1rem;
    margin-right: .25rem;
    font-size: .833rem;
    font-weight: 500;
    font-family: inherit;
    background-color: transparent;
    color: var(--text-color);
    border-right: 1px solid var(--ring-color);
    cursor: pointer;
    transition: background-color .2s;
    min-width: 36px;
  }

  button:hover {
    background-color: color-mix(in srgb, var(--accent-color) 15%, transparent);
  }
  button:focus,
  button:focus-visible {
    background-color: color-mix(in srgb, var(--accent-color) 20%, transparent);
    outline: 1px solid var(--accent-color);
  }

  label {
    flex-direction: column;
    font-weight: 500;
  }

  label:has(input[type='file']) {
    cursor: pointer;
  }

  label:has(input[type='color'], input[type='checkbox']) {
    flex-direction: row;
  }

  label > span {
    margin-bottom: .5rem;
  }

  label:has(input:disabled) {
    opacity: 0.75;
  }

  label:has(input[type='color'], input[type='checkbox']) > span {
    margin-top: auto;
    margin-bottom: auto;
  }

  label:has(input[type='color'], input[type='checkbox']) > span {
    margin-right: .5rem;
  }

  .input-container {
    position: relative;
  }
</style>