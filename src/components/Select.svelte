<!-- Select logics -->
<script lang="ts">
  export let label: string;
  export let name = '';

  export let value: string = '';
</script>

<!-- Select contents -->
<label class="flex flex-column">
  <span>{label}</span>
  <div class="flex flex-align-center">
    <select {name} bind:value={value} on:input>
      <slot></slot>    
    </select>
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
  </div>
</label>

<!-- Select styles -->
<style>
  label {
    font-weight: 500;
  }

  label > span {
    margin-bottom: .5rem;
  }

  select {
    appearance: none;
    outline: none;
    font: inherit;
    padding: 0.5rem calc(1rem + 16px) 0.5rem 1rem;
    border: 1px solid var(--ring-color);
    border-radius: 8px;
    background-color: color-mix(in srgb, var(--background-color) 95%, #fff);
    width: 100%;
  }
  select:focus {
    border-color: var(--accent-color);
  }

  div {
    position: relative;
  }

  svg {
    pointer-events: none;
    width: 16px;
    height: 16px;
    margin: auto 0;
    position: absolute;
    right: 1rem;
  }
</style>