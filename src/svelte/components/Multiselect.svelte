<script>
    // Manage members of a group from a fixed pool. E.g. project sectors, scopes, users etc.
    const debug = false;

    export let name = 'Fruit';
    export let icon = '';
    export let options = [
        { id: 0, value: 'Apples' },
        { id: 1, value: 'Oranges' },
        { id: 2, value: 'Bananas' }
    ];
    export let members = [ 0, 1 ];
    export let expectedNumMembers = 0;
    export let maxMembers = 0;
    export let mayEdit = false;

    let thisElement = null;
    let showOptionsList = false;

    import plusIcon from '$lib/web/src/vendor/@fortawesome/fontawesome-pro/svgs/solid/plus.svg?src';
    import iconCheck from '$lib/web/src/vendor/@fortawesome/fontawesome-pro/svgs/solid/check.svg?src';

    import {createEventDispatcher} from 'svelte';
    const dispatch = createEventDispatcher();
    import { onMount } from 'svelte';
    onMount(async () => {
        sortOptions();
        sortMembers();

        if (debug) console.log('sorted options', options);
        if (debug) console.log('sorted members', members);
    });


    function sortOptions() {
        options.sort((a, b) => {
            return a.value.localeCompare(b.value);
        });
    }


    function sortMembers() {
        members.sort((a, b) => {
            const objectA = options.find(option => option.id === a);
            if (objectA === undefined) {
                console.error(`${name} id #${a} not found in options`, options);
                return 0;   // This should never happen
            }
            const nameA = objectA.value.toUpperCase();

            const objectB = options.find(option => option.id === b);
            if (objectB === undefined) {
                console.error(`${name} id #${b} not found in options`, options);
                return 0;   // This should never happen
            }
            const nameB = objectB.value.toUpperCase();
            return nameA.localeCompare(nameB);
        });
    }


    async function toggleItem(id) {
        const remove = members.includes(id)

        if (!remove && maxMembers && (members.length >= maxMembers)) {
            if (!window.growl)
                window.growl = (await import('growl-js')).default;

            window.growl({
                message: `You're only allowed ${maxMembers} ${name.toLowerCase()}!`,
                type: 'warning',
                target: thisElement
            });
            return;
        }

        if (debug) console.log('toggleItem', id, members.includes(id));
        if (remove)
            members = members.filter(memberId => memberId !== id);
        else {
            members = [...members, id];
            sortMembers();
        }

        if (debug) console.log(`updated ${name} members`, members);
        dispatch('update', members);


        if (!remove && expectedNumMembers && (members.length > expectedNumMembers)) {
            if (!window.growl)
                window.growl = (await import('growl-js')).default;

            window.growl({
                message: `That's a lot of ${name.toLowerCase()}!`,
                type: 'warning',
                target: thisElement
            });
        }
    }

</script>


<div class="members" class:mayEdit bind:this={thisElement}>
    <h2>{@html icon} {name}</h2>

    <div on:focus={() => showOptionsList = true} on:blur={() => showOptionsList = false} tabindex="0">
        {#if showOptionsList && mayEdit}
            <ul class="options-list">
                {#each options as option}
                    <li class:selected={members.includes(option.id)} on:click={() => toggleItem(option.id)}>
                        {#if members.includes(option.id)}
                            {@html iconCheck}&nbsp;
                        {/if}
                        {option.value}
                    </li>
                {/each}
            </ul>
        {/if}

        <ul class="list">
            {#each options as option}
                {#if members.includes(option.id)}
                    <li>{option.value}</li>
                {/if}
            {/each}

            {#if mayEdit && (members.length < maxMembers || maxMembers === 0)}
                <li class="add-button">
                    {@html icon} &nbsp; {@html plusIcon}
                </li>
            {/if}
        </ul>

    </div>
</div>


<style lang="stylus">
  .members
    :global(svg)
      height 1em
      fill var(--text-color)

    ul
      padding 0
      margin 0.3em 0 0 0
      list-style none

    li
      cursor pointer
      padding 0
      margin 0
      line-height 1.8

      &.selected
        color var(--text-color-editable)

        :global(svg)
          fill var(--text-color-editable)

      &.add-button
        color var(--bs-success)

        :global(svg)
          fill var(--bs-success)

    &.mayEdit
      .list
        li
          color var(--text-color-editable)

    .options-list
      border-radius 0.5em
      position absolute
      background-color white
      margin -0.3rem 0 0 3%
      padding 0.8em
      box-shadow var(--bs-box-shadow)
      max-height 200%
      user-select none

      li:hover
        background-color var(--bs-light)

    button
      :global(svg)
        fill white

</style>