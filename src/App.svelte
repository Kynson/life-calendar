<!-- App logics -->
<script lang="ts">
  import CalendarGenerator from '@lib/calendar-generator';

  import Input from './components/Input.svelte';
  import Separator from './components/Separator.svelte';
  import Button from './components/Button.svelte';

  import type { GenerateConfigurations } from '@lib/calendar-generator';

  const calendarGenerator = new CalendarGenerator();
  calendarGenerator.initialize();

  let generatedCalendarSVG: Promise<string>;
  let isInitialGeneration = true;

  async function generateCalendar(configurations: GenerateConfigurations): Promise<string> {
    const result = await calendarGenerator.generate(configurations);

    if (isInitialGeneration) {
      isInitialGeneration = false;
    }

    return result;
  }

  function handleFormSubmit({ target }: Event) {
    const formData = new FormData(target as HTMLFormElement);

    const configurations: Record<string, any> = { fonts: [{ name: 'Inter' }], direction: 'horizontal' };
    for (const [key, value] of formData) {
      if (key === 'showTitle') {
        configurations[key] = true;
        continue;
      }
      if (key === 'vertical') {
        configurations.direction = 'vertical';
        continue;
      }

      configurations[key] = value;
    }

    generatedCalendarSVG = generateCalendar(configurations as GenerateConfigurations);
  }
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
<section id="generator" class="flex flex-wrap">
  <form class="flex flex-column small-text flex-justify-center" on:submit|preventDefault={handleFormSubmit}>
    <h5>General</h5>
    <Input type="date" label="Date of Birth" name="dateOfBirth"></Input>
    <Input type="text" label="Title" value="Life Calendar" name="title"></Input>
    <h5>Theme</h5>
    <Input type="checkbox" label="Show Title" name="showTitle"></Input>
    <Input type="checkbox" label="Vertical" name="vertical"></Input>
    <Input type="color" label="Filled Cell Color" name="filledCellColor"></Input>
    <Input type="color" label="Non-filled Cell Color" name="unfilledCellColor"></Input>
    <Button variant="outlined">Add</Button>
    <Separator>Or upload an existing calendar</Separator>
    <Input type="file" label="Calendar"></Input>
    <Button type="submit">Generate!</Button>
  </form>
  <div id="calendar-container" class="flex flex-column">
    <h5>Generated Calendar</h5>
    {#if generatedCalendarSVG}
      {#await generatedCalendarSVG}
        <p>{isInitialGeneration ? 'Generating' : 'Re-regenerating'}</p>
      {:then calendarSVG} 
        {@html calendarSVG}
      {/await}
    {:else}
      <p>Fill the form and generate your life calendar!</p>
    {/if}
  </div>
</section>
<section>
  <h2>What is this?</h2>
  <p>Life is limited. Life calendar reminds us of the inevitable flow of time by recording the number of weeks that have passed since our birthdays. Each filled cell on the calendar represents a week that has elapsed, illustrating how our lives are made of a finite number of units. Hope it serves as a gentle reminder to live each week to the fullest.</p>
  <p>You can generate your own life calendar using above generator and embed it on your own website, markdown or anywhere you like (as long as it supports rendering remote svg)! You can customize the theme of the calendar, number of years displayed and mark events that are special in your life.</p>
  <p>This project aims to provide an open source and more feature-rich version of Luca Gesmundo's <a href="https://notionsparkles.com/life-calendar">The Notion Life Calendar</a>, please also check it out! Source code of this project is available on Github.</p>
</section>

<!-- App styles -->
<style>
  /* TODO: Finalize generator svg size, header size */
  header {
    margin-bottom: 3.5rem;
  }

  section:not(:last-child) {
    margin-bottom: 3.5rem;
  }

  form {
    flex: 1 0 calc(100vw - var(--page-padding) * 2);
    gap: 1rem 0;
  }

  form > h5 {
    margin: 0;
  }

  #generator {
    width: 100%;
    gap: 2.5rem;
  }

  #calendar-container {
    flex: 2 0 calc(100vw - var(--page-padding) * 2);
    /* min-height: 100vh; */
  }

  #logo {
    width: 56px;
    height: 56px;
  }

  @media (min-width: 480px) {
    form {
      flex-basis: 375px;
    }

    #calendar-container {
      flex-basis: 475px;
    }
  }
</style>
