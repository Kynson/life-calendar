<!-- App logics -->
<script lang="ts">
  import CalendarGenerator from '@lib/calendar-generator';
  import { fontVariantToHumanReadableRepresentation } from '@lib/font-variant-utils';

  import Input from './components/Input.svelte';
  import Separator from './components/Separator.svelte';
  import Button from './components/Button.svelte';
  import Select from './components/Select.svelte';

  import { onMount } from 'svelte';

  import type { GenerateConfigurations, CalendarEvent } from '@lib/calendar-generator';
  import type { Fonts } from '@lib/font-loader';

  type ConfigurationsFromData = Omit<GenerateConfigurations, 'numberOfYears' | 'direction'> & {
    numberOfYears: string,
    direction: boolean
  };

  const calendarGenerator = new CalendarGenerator();

  // Proxy used to serialize and deserialize configurations to match what are stored in form controls
  let configurationsFromData = new Proxy(
    calendarGenerator.configurations,
    {
      set(target, properity, value) {
        let serializedValue = value;

        // Convert numberOfYears to number
        if (properity === 'numberOfYears') {
          serializedValue = parseInt(value, 10);
        }

        if (properity === 'direction') {
          serializedValue = value ? 'vertical' : 'horizontal';
        }

        target[properity] = serializedValue;

        return true;
      },
      get(target, properity) {
        // Convert numberOfYears to string
        if (properity === 'numberOfYears') {
          return target[properity].toString();
        }

        if (properity === 'direction') {
          return target[properity] === 'vertical';
        }

        return target[properity];
      }
    }
  ) as any as ConfigurationsFromData;

  let eventEditFormData: CalendarEvent = {
    name: '',
    from: new Date().toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
    color: '#ffffff'
  }
  let currentlyEditingEventIndex: number;
  let isNewEvent: boolean;

  let availableFonts: Fonts = {};
  let availableFontFamilies: (keyof Fonts)[] = [];

  $: selectedFontFamilyVariants = availableFonts[configurationsFromData.fontFamily]?.variants || [];

  let generatedCalendarSVG: Promise<string>;
  let isInitialGeneration = true;
  let isCalendarGenerating = false;

  let calendarMaximumHeight: number;

  let calendarContainer: HTMLDivElement;
  let calendarActionButtonsContainer: HTMLDivElement;
  let calendarContainerHeader: HTMLHeadingElement;

  let eventEditDialog: HTMLDialogElement;

  let invalidConfigurationsDialog: HTMLDialogElement;

  let isLinkCopied = false;

  function shouldUseIntrinsicCalendarSize(intrinsicWidth: number, intrinsicHeight: number) {
    const calendarContainerWidth = calendarContainer.clientWidth;
    // calendarMaximumHeight is available after onMount
    return intrinsicWidth < calendarContainerWidth && intrinsicHeight < calendarMaximumHeight;
  }

  function injectSizeAttributesToCalendar(svg: string, intrinsicWidth: number, intrinsicHeight: number) {
    const shouldUseIntrinsicSize = shouldUseIntrinsicCalendarSize(intrinsicWidth, intrinsicHeight);
    const width = shouldUseIntrinsicSize ? intrinsicWidth.toString() : '100%';
    const height = shouldUseIntrinsicSize ? intrinsicHeight.toString() : '100%';

    return svg.replace(
      '<svg',
      `<svg width="${width}" height="${height}"`
    );
  }

  function computeMaximumCalendarHeight() {
    const calendarContainerHeight = calendarContainer.clientHeight;
    const calendarContainerHeaderHeight = calendarContainerHeader.clientHeight;
    const calendarActionButtonsContainerHeight = calendarActionButtonsContainer.clientHeight;

    const calendarContainerHeaderMarginBottom = parseInt(getComputedStyle(calendarContainerHeader).marginBottom, 10);

    return calendarContainerHeight - calendarContainerHeaderHeight - calendarActionButtonsContainerHeight - calendarContainerHeaderMarginBottom;
  }

  function generateCalendar() {
    isCalendarGenerating = true;

    // Configurations are updated by form controls already
    return calendarGenerator.generate()
      .then(({ result, width, height }) => {
        isCalendarGenerating = false;

        if (isInitialGeneration) {
          isInitialGeneration = false;
        }

        return injectSizeAttributesToCalendar(result, width, height);
      });
  }

  function handleGenerateCalendarFormSubmit() {
    generatedCalendarSVG = generateCalendar();
  }

  function handleFontFamilyInput() {
    // Select the first varient when the font family is changed
    configurationsFromData.fontVariant = Object.keys(availableFonts[configurationsFromData.fontFamily])[0];
  }

  function handleEditEventButtonClick(eventIndex: number) {
    isNewEvent = false;

    const { name, from, to, color } = configurationsFromData.events[eventIndex];

    eventEditFormData = { name, from, to, color };
    currentlyEditingEventIndex = eventIndex;

    eventEditDialog.showModal();
  }

  function handleEventEditFormClose() {
    if (eventEditDialog.returnValue === 'cancelled') {
      return;
    }

    configurationsFromData.events[currentlyEditingEventIndex] = eventEditFormData;
  }

  function handleAddEventButtonClick() {
    isNewEvent = true;

    eventEditFormData = {
      name: '',
      from: new Date().toISOString().split('T')[0],
      to: new Date().toISOString().split('T')[0],
      color: '#ffffff'
    };
    currentlyEditingEventIndex = configurationsFromData.events.length;

    eventEditDialog.showModal();
  }

  function handleDeleteEventButtonClick(eventIndex: number) {
    configurationsFromData.events = configurationsFromData.events.toSpliced(eventIndex, 1);
  }

  function handleDownloadConfigurationsButtonClick() {
    const configurationsBlob = new Blob(
      [
        JSON.stringify(configurationsFromData)
      ],
      { type: 'application/json' }
    );
    const configurationsBlobURL = URL.createObjectURL(configurationsBlob);

    const downloadLink = document.createElement('a');
    downloadLink.href = configurationsBlobURL;
    downloadLink.download = 'life-calendar-configurations.json';
    downloadLink.style.display = 'none';
    downloadLink.click();
  }

  async function handleCopyLinkButtonClick() {
    const encodedConfigurations = btoa(JSON.stringify(calendarGenerator.configurations))
      .replaceAll(/\+/g, '-')
      .replaceAll(/\//g, '_')
      .replaceAll(/=/g, '');
  
    await navigator.clipboard
      .writeText(`${location.origin}/embed?configurations=${encodedConfigurations}`);

    isLinkCopied = true;

    setTimeout(() => {
      isLinkCopied = false;
    }, 2500);
  }

  function isValidColor(value: any) {
    return /^#[0-9a-f]{6}$/.test(value);
  }

  function isValidDate(value: any) {
    return new Date(value).toString() !== 'Invalid Date';
  }

  function isValidEvent(value: Record<any, any>) {
    return typeof value.name === 'string'
      && typeof value.from === 'string' && isValidDate(value.from)
      && typeof value.to === 'string' && isValidDate(value.to)
      && isValidColor(value.color);
  }

  const configurationFromDataValidators = {
    dateOfBirth: (value: any) => isValidDate(value),
    numberOfYears: (value: any) => typeof value === 'string',
    filledCellColor: (value: any) => isValidColor(value),
    unfilledCellColor: (value: any) => isValidColor(value),
    titleColor: (value: any) => isValidColor(value),
    eventLegendsColor: (value: any) => isValidColor(value),
    progressColor: (value: any) => isValidColor(value),
    direction: (value: any) => typeof value === 'boolean',
    events: (value: any) => Array.isArray(value) && value.every(isValidEvent)
  }

  // While the generator will validate the configurations,
  // we don't want invalid data to be rendered in the form
  // This function only checks the type and format of the configurations data so that they can be rendered correctly
  function isValidConfigurationFormData(configurations: Record<any, any>) {
    for (const [key, value] of Object.entries(configurations)) {
      if (configurationFromDataValidators[key] && !configurationFromDataValidators[key](value)) {
        return false;
      }
    }

    return true;
  }

  async function handleConfigurationsUpload({ detail: event }: CustomEvent<Event>) {
    const target = event.target as HTMLInputElement;

    const configurationsFile = target.files?.item(0);

    if (!configurationsFile) {
      return;
    }

    
    let configurations: Record<any, any>;
    try {
      configurations = JSON.parse(await configurationsFile.text());
    } catch (_error) {
      invalidConfigurationsDialog.showModal();
  
      return;
    }

    if (!isValidConfigurationFormData(configurations)) {
      invalidConfigurationsDialog.showModal();
  
      return;
    }

    configurationsFromData = {
      ...configurationsFromData,
      ...configurations
    }
  }

  onMount(async () => {
    calendarMaximumHeight = computeMaximumCalendarHeight();

    await calendarGenerator.initialize();

    availableFonts = calendarGenerator.availableFonts;
    availableFontFamilies = Object.keys(availableFonts);
  });
</script>

<!-- App contents -->
<header class="flex">
  <svg id="logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080" fill="none">
    <rect width="1080" height="1080" fill="none"/>
    <path d="M617.084 83.5355C619.036 81.5829 622.202 81.5829 624.155 83.5355L731.989 191.369C733.941 193.322 733.941 196.488 731.989 198.44L275.905 654.524L164.536 543.155C162.583 541.202 162.583 538.036 164.536 536.084L617.084 83.5355Z" fill="#fff"/>
    <path d="M164.536 543.155C162.583 541.202 162.583 538.036 164.536 536.084L275.905 424.715L731.989 880.798C733.941 882.751 733.941 885.917 731.989 887.869L624.155 995.703C622.202 997.656 619.036 997.656 617.084 995.703L164.536 543.155Z" fill="#fff"/>
    <path d="M617.084 83.5355C619.036 81.5829 622.202 81.5829 624.155 83.5355L731.989 191.369C733.941 193.322 733.941 196.488 731.989 198.44L505.715 424.715L390.81 309.81L617.084 83.5355Z" fill="#90CAF9"/>
    <path d="M731.989 880.798C733.941 882.751 733.941 885.917 731.989 887.869L624.155 995.703C622.202 997.656 619.036 997.656 617.084 995.703L390.81 769.429L505.715 654.524L731.989 880.798Z" fill="#90CAF9"/>
    <path d="M846.894 536.084C848.846 538.036 848.846 541.202 846.894 543.155L735.524 654.524L505.715 424.715L620.619 309.81L846.894 536.084Z" fill="#90CAF9"/>
    <path d="M735.524 424.715L846.894 536.084C848.846 538.036 848.846 541.202 846.894 543.155L620.619 769.429L505.715 654.524L735.524 424.715Z" fill="#90CAF9"/>
  </svg>
</header>
<dialog bind:this={eventEditDialog} on:close={handleEventEditFormClose}>
  <h6>{isNewEvent ? 'Add New Event' : 'Edit Event'}</h6>
  <form class="flex flex-column small-text" on:submit|preventDefault>
    <Input type="text" label="Event Name" name="eventName" bind:value={eventEditFormData.name}></Input>
    <div class="flex flex-gap-1">
      <Input type="date" label="From" name="eventFrom" class="flex-grow-1" bind:value={eventEditFormData.from}></Input>
      <Input type="date" label="To" name="eventTo" class="flex-grow-1" bind:value={eventEditFormData.to}></Input>
    </div>
    <Input type="color" label="Event Color" name="eventColor" class="margin-bottom-1" bind:value={eventEditFormData.color}></Input>
    <div id="event-edit-form-actions-container" class="flex">
      <Button type="button" variant="outlined" on:click={() => eventEditDialog.close('cancelled')}>Cancel</Button>
      <Button type="submit" on:click={() => eventEditDialog.close('submit')}>Save</Button>
    </div>
  </form>
</dialog>
<dialog bind:this={invalidConfigurationsDialog}>
  <h6>Invalid Configurations</h6>
  <p class="low-emphasis small-text">Fail to parse the uploaded configurations as it is invalid. Please check your configurations and try again</p>
  <Button class="float-right" on:click={() => invalidConfigurationsDialog.close()}>Close</Button>
</dialog>
<section id="generator" class="flex flex-wrap">
  <form id="generation-form" class="flex flex-column small-text flex-justify-center" on:submit|preventDefault={handleGenerateCalendarFormSubmit}>
    <h5>General</h5>
    <Input type="date" label="Date of Birth" name="dateOfBirth" bind:value={configurationsFromData.dateOfBirth}></Input>
    <Input type="text" label="Title" name="title" disabled={!configurationsFromData.showTitle} bind:value={configurationsFromData.title}></Input>
    <Input type="number" label="Number of Years" name="numberOfYears" bind:value={configurationsFromData.numberOfYears}></Input>
    <details>
      <summary>Advanced</summary>
      <div id="advanced-general-configurations-container" class="flex flex-column">
        <Input type="checkbox" label="Show Title" name="showTitle" bind:checked={configurationsFromData.showTitle}></Input>
        <Input type="checkbox" label="Show Event Legends" name="showEventLegends" bind:checked={configurationsFromData.showEventLegends}></Input>
        <Input type="checkbox" label="Show Progress" name="showProgress" bind:checked={configurationsFromData.showProgress}></Input>
        <Input type="checkbox" label="Enable Emoji Support" name="enableEmojiSupport" bind:checked={configurationsFromData.enableEmojiSupport}></Input>
      </div>
    </details>
    <h5>Theme</h5>
    <Input type="color" label="Filled Cell Color" name="filledCellColor" bind:value={configurationsFromData.filledCellColor}></Input>
    <Input type="color" label="Unfilled Cell Color" name="unfilledCellColor" bind:value={configurationsFromData.unfilledCellColor}></Input>
    <Input type="color" label="Title Color" name="titleColor" disabled={!configurationsFromData.showTitle} bind:value={configurationsFromData.titleColor}></Input>
    <Input type="color" label="Event Legends Color" name="eventLegendsColor" disabled={!configurationsFromData.showEventLegends} bind:value={configurationsFromData.eventLegendsColor}></Input>
    <Input type="color" label="Progress Color" name="progressColor" disabled={!configurationsFromData.showProgress} bind:value={configurationsFromData.progressColor}></Input>
    <Input type="checkbox" label="Vertical" name="vertical" bind:checked={configurationsFromData.direction}></Input>
    <div class="flex flex-gap-1">
      <Select label="Font Family" name="fontFamily" bind:value={configurationsFromData.fontFamily} class="flex-grow-1" on:input={handleFontFamilyInput}>
        {#each availableFontFamilies as fontFamily}
          <option value={fontFamily} selected={fontFamily === configurationsFromData.fontFamily}>{fontFamily}</option>
        {/each}
      </Select>
      <Select label="Font Variant" name="fontVariant" class="flex-grow-1" bind:value={configurationsFromData.fontVariant}>
        {#each selectedFontFamilyVariants as fontVariant}
          <option value={fontVariant} selected={fontVariant === configurationsFromData.fontVariant}>{fontVariantToHumanReadableRepresentation(fontVariant)}</option>
        {/each}
      </Select>
    </div>
    {#if configurationsFromData.events.length > 0}
      <h5>Events</h5>
      {#each configurationsFromData.events as event, index}
        <div class="flex flex-space-between event-container">
          <div class="flex">
            <div class="event-color-indicator" style="background-color: {event.color}"></div>
            <Button variant="link" on:click={() => handleEditEventButtonClick(index)}>{event.name} <i class="low-emphasis">{event.from} to {event.to}</i></Button>
          </div>
          <Button variant="mini-icon" class="event-delete-button" on:click={() => handleDeleteEventButtonClick(index)}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>                    
          </Button>      
        </div>
      {/each}
    {/if}
    <Button variant="outlined" on:click={handleAddEventButtonClick}>Add Event</Button>
    <Separator>Or upload an existing calendar</Separator>
    <Input type="file" label="Calendar" on:input={handleConfigurationsUpload}></Input>
    <Button type="submit">Generate!</Button>
  </form>
  <div id="calendar-container" class="flex flex-column" bind:this={calendarContainer}>
    <h5 bind:this={calendarContainerHeader}>Generated Calendar</h5>
    {#if generatedCalendarSVG}
      {#await generatedCalendarSVG}
        <p>{isInitialGeneration ? 'Generating' : 'Re-generating'}</p>
      {:then svg}
        <div style="max-height: {calendarMaximumHeight}px">
          {@html svg}
        </div>
      {:catch error}
        <p>Failed to generate the calendar. {error.message || ''}</p>
      {/await}
    {:else}
      <p>Fill the form and generate your life calendar!</p>
    {/if}
    <div class="flex flex-gap-1" class:invisible={isCalendarGenerating || !generatedCalendarSVG} bind:this={calendarActionButtonsContainer}>
      <Button on:click={handleCopyLinkButtonClick}>{isLinkCopied ? 'Copied!' : 'Copy link'}</Button>
      <Button variant="outlined" on:click={handleDownloadConfigurationsButtonClick}>Download Configurations</Button>
    </div>
  </div>
</section>
<section>
  <h2>What is this?</h2>
  <p>Life is limited. Life calendar reminds us of the inevitable flow of time by recording the number of weeks that have passed since our birthdays. Each filled cell on the calendar represents a week that has elapsed, illustrating how our lives are made of a finite number of units. Hope it serves as a gentle reminder to live each week to the fullest.</p>
  <p>You can generate your own life calendar using above generator and embed it on your own website, markdown or anywhere you like (as long as it supports rendering remote svg)! You can customize the theme of the calendar, number of years displayed and mark events that are special in your life.</p>
  <p>This project aims to provide an open source and more feature-rich version of Luca Gesmundo's <a href="https://notionsparkles.com/life-calendar">The Notion Life Calendar</a>, please also check it out! Source code of this project is available on <a href="https://github.com/Kynson/life-calendar">Github</a>.</p>
</section>

<!-- App styles -->
<style>
  header {
    margin-bottom: 3.5rem;
  }

  section:not(:last-child) {
    margin-bottom: 3.5rem;
  }

  form {
    gap: 1rem 0;
  }

  details {
    max-height: calc(1rem + 2px);
    overflow: hidden;
    transition: max-height .2s;
  }

  details[open] {
    /* Height approx. that fit the content */
    max-height: 10rem;
  }

  summary {
    cursor: pointer;
  }

  details[open] > summary {
    margin-bottom: .5rem;
  }

  dialog {
    border: none;
    border-radius: 16px;
    padding: 1.75rem 1.25rem;
    background-color: color-mix(in srgb, var(--background-color) 90%, #fff);
    width: calc(100% - var(--page-padding) * 2);
    max-width: 512px;
    /* Will transition to the following when closing */
    opacity: 0;
    transform: scale(50%);
    /* Use the following when major browser support overlay */
    /* transition: opacity .25s, transform .25s, display .25s allow-discrete, overlay .25s allow-discrete; */
    transition: all .25s allow-discrete;
  }

  dialog[open] {
    opacity: 1;
    transform: scale(1);

    /* This allow transition from the following to the above ruleset */
    @starting-style {
      opacity: 0;
      transform: scale(50%);
    }
  }

  dialog::backdrop {
    background-color: #ffffff00;
    backdrop-filter: blur(0);
    -webkit-backdrop-filter: blur(0);
    transition: all .25s allow-discrete;
  }

  dialog[open]::backdrop {
    background-color: #ffffff01;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);

    @starting-style {
      background-color: #ffffff00;
      backdrop-filter: blur(0);
      -webkit-backdrop-filter: blur(0);
    }
  }

  #generator {
    width: 100%;
    gap: 2.5rem;
  }

  #generation-form {
    flex: 1 0 calc(100vw - var(--page-padding) * 2);
  }

  #generation-form > h5 {
    margin: 0;
  }

  #advanced-general-configurations-container {
    gap: 1rem 0;
  }

  #calendar-container {
    flex: 2 0 calc(100vw - var(--page-padding) * 2);
  }

  #logo {
    width: 56px;
    height: 56px;
  }

  #event-edit-form-actions-container {
    justify-content: flex-end;
    gap: 0 1.25rem;
  }

  /* Opt out scoping for this, so that it can be leaked to components */
  :global(.event-delete-button) {
    opacity: 0;
    /* Overrides the button's style */
    transition: background-color .2s, opacity .2s !important;
  }

  /* Opt out scoping for this, so that it can be leaked to components */
  .event-container:hover :global(.event-delete-button) {
    opacity: 1;
  }

  .event-color-indicator {
    height: 20px;
    width: 20px;
    border-radius: 4px;
    margin: auto .5rem auto 0;
  }

  /* Layout utilities specific to App.svelte */
  /* Opt out scoping for the followings, so that they can be leaked to components */
  :global(.flex-grow-1) {
    flex-grow: 1;
  }
  :global(.flex-gap-1) {
    gap: 1rem;
  }

  :global(.margin-bottom-1) {
    margin-bottom: 1rem;
  }

  :global(.float-right) {
    float: right;
  }

  .invisible {
    visibility: hidden;
  }

  @media (min-width: 480px) {
    #generation-form {
      flex-basis: 375px;
    }

    #calendar-container {
      flex-basis: 475px;
    }
  }
</style>
