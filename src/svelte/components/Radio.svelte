<script>
    const debug = false;
    import {createEventDispatcher, tick} from 'svelte';

    export let selectedValue = false;
    export let items = [
        {label: 'Active', value: false, color: ''},
        {label: 'Archived', value: true, color: ''}
    ];
    export let size = '';

    const dispatch = createEventDispatcher();


    // radio buttons
    async function setRadioValue(event) {
        const radioValue = event.target.dataset.value;
        if (debug) console.log(`clicked on radio button ${radioValue}`)
        if (radioValue === selectedValue)
            return;     // no change

        selectedValue = radioValue;
        if (debug) console.log(`setRadio to ${selectedValue}`)

        await tick();   // so that parent component sees updated radio DOM
        dispatch('change', selectedValue);
    }
</script>


{#if items.length > 1}
    <div class="radio btn-group {size ? `btn-group-${size}` : ''}">
        {#each items as item}
            <button type="button"
                    class="{item.value == selectedValue ? 'active' : ''} btn btn-outline-{item.color ? 'light' : 'secondary'}"
                    style="{item.color ? `color: ${item.color} !important; border-color: ${item.color};` : ''}"
                    data-value={item.value}
                    on:click={setRadioValue}>
                <span class="fa-solid fa-check"> &nbsp;</span> {item.label}
            </button>
        {/each}
    </div>
{/if}


<style lang="stylus" global>
  .radio
    display flex
    align-items center

    .fa-check
      display none

    button.active
      cursor default
      box-shadow none

      .fa-check
        display inline

    .btn-outline-secondary:not(.active):not(:hover)
      background-color white

  // hide shadow spill from sibling button
</style>