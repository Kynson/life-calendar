<!-- Separator contents -->
<div class="flex flex-justify-center flex-align-center">
  <hr>
  <span class="low-emphasis">
    <slot></slot>
  </span>
</div>

<!-- Separator styles -->
<style>
  div {
    position: relative;
    margin: 1.25rem 0;
  }

  div > hr {
    position: absolute;
    width: 100%;
    border: 1px solid var(--ring-color);
    z-index: 0;
  }

  div > span {
    /* position: absolute; */
    /* color: color-mix(in srgb, var(--text-color) 80%, transparent); */
    background-color: var(--background-color);
    padding: 0 4px;
    z-index: 1;
  }
</style>