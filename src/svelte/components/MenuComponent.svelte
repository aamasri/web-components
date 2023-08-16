<script>
    const debug = true;

    import {createEventDispatcher} from "svelte";
    const dispatch = createEventDispatcher();

    export let id = '';
    export let disabled = false;
    export let classes = '';
    export let items = [
        { key: 'sliders', icon: 'fas fa-sliders-h' },
        { key: 'toggle', icon: 'fas fa-stopwatch' },
        { key: 'tabular', icon: 'fas fa-table' },
    ];
    export let selected = 'tabular';
    export let highlighted = '';
    export let visible = true;

    // send change event on menu change
    async function selectMenuItem(event) {
        if (disabled)
            return;

        const clickedItem = event.target.closest('[data-key]').dataset.key;
        if (debug) console.log(`clicked on menu item ${clickedItem}`);
        if (clickedItem === selected)
            return;     // no change

        selected = clickedItem;
        dispatch('change');
    }
</script>


<!-- svelte-ignore a11y-click-events-have-key-events -->
<ul id="{id}" class="menuComponent" class:classes class:disabled class:notVisible={!visible}>
    {#each items as item}
        <li class:selected={item.key === selected}
            class:disabled={item.disabled}
            class:highlighted={item.key === highlighted}
            on:click={selectMenuItem} data-key={item.key}
        >
            {#if item.icon}
                <i class="{item.icon}"></i>
            {/if}
            {#if item.label}
                 {item.label}
            {/if}
        </li>
    {/each}
</ul>



<style lang="stylus" global>
    ul.menuComponent
        display flex
        justify-content space-around
        flex-wrap wrap

        &.disabled
            opacity 0.4

        li
            list-style none
            display inline
            padding 1rem
            opacity 0.9
            text-align center
            user-select none

        &:not(.disabled)
            li
                cursor pointer

                &.disabled
                    cursor auto
                    pointer-events none
                    opacity 0.2 !important

                &.selected
                &:hover
                    opacity 1 !important

                &.highlighted
                    opacity 0.6 !important
                    color var(--bs-blue) !important
                    animation pulse 2s infinite
                    &:hover
                        opacity 1 !important

                    @keyframes pulse
                        20%
                            transform scale(1.4)

                        80%
                            transform scale(1)

</style>