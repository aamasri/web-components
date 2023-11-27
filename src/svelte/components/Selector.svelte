<script>
    const debug = false;

    import { createEventDispatcher, onMount, tick } from 'svelte';
    import { fly } from 'svelte/transition';
    const dispatch = createEventDispatcher();

    export let id = '';
    export let items = [];
    export let subItems = [];
    export let selectedItem = false;
    export let selectedSubItem = false;
    export let addOnLabel = '';
    export let addOnIcon = 'fas fa-search';
    export let placeholder = 'Search';
    export let persistent = true;   // retains the selected values like a browser select component
    export let size = '';   // bootstrap sm, lg etc. for input-group
    export let color = 'secondary';   // bootstrap success, primary etc. for button
    export let expanded = false;
    export let autofocus = false;

    let searchString = '';

    function getMatchingItems(searchString, items, expanded) {
        let matchingItems;
        if (searchString.length === 0)
            matchingItems = expanded ? items : [];
        else {
            matchingItems = items.filter(item => {
                return item.value.toLowerCase().includes(searchString);
            });
        }

        return matchingItems;
    }

    function search(eventOrSearchString) {
        searchString = (typeof eventOrSearchString === 'string') ? eventOrSearchString : eventOrSearchString.target.value.toLowerCase();
    }

    function clearSearch() {
        searchString = '';

        if (persistent !== true) {
            selectedItem = false;
            selectedSubItem = false;
        }
    }

    async function select(event) {
        const isItem = event.target.closest('.matchingItems');
        const isSubItem = event.target.closest('.subItems');

        if (isItem) {
            selectedItem = event.target.closest('li').dataset.key;
            if (debug) console.log(`selected ${selectedItem} from ${placeholder} selector`)

            // there are no sub-items then we've got our selection
            if (subItems.length) {
                // if the component overflows the screen width, then align the sub-item list with the window right edge
                await tick();
                const thisSelector = event.target.closest('.selector-component');
                const list = thisSelector.querySelector('.matchingItems');
                const subList = thisSelector.querySelector('.subItems');
                if ((list.offsetWidth + subList.offsetWidth) > window.innerWidth)
                    subList.style.position = 'absolute';
                else
                    subList.style.position = 'relative';

                if (debug) console.log(`${list.offsetWidth} + ${subList.offsetWidth} > ${window.innerWidth}`);
            } else {
                dispatch('change', { item: selectedItem });
                clearSearch();
            }
        } else if (isSubItem && selectedItem) {
            selectedSubItem = event.target.closest('li').dataset.key;
            if (debug) console.log(`selected ${placeholder} items ${selectedItem}:${selectedSubItem}`);
            dispatch('change', { item: selectedItem, subItem: selectedSubItem });
            clearSearch();
        }
    }

    function placeholderValue(itemKey, items, subItemKey, subItems) {
        let displayedPlaceholder = placeholder;

        if (itemKey) {
            let item = items.find(entry => entry.key == itemKey);
            if (item)
                displayedPlaceholder = item.value.replace(/<\/?[^>]+(>|$)/g, '');
        }

        if (displayedPlaceholder && subItemKey) {
            let subItem = subItems.find(entry => entry.key == subItemKey);
            if (subItem)
                displayedPlaceholder += '  ▶  ' + subItem.value.replace(/<\/?[^>]+(>|$)/g, '');
        }

        if (debug) console.log(`displaying placeholder ${displayedPlaceholder} (${itemKey + (subItemKey ? ':'+subItemKey : '')})`, items);

        return displayedPlaceholder || placeholder;
    }


    onMount(() => {
        if (selectedItem) {
            const selectedListElement = document.querySelector(`[data-key="${selectedItem}"]`);
            if (selectedListElement) {
                selectedListElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                if (debug) console.log(`scrolling to selected item ${selectedItem}`);
            }
        }
    });
</script>



<!-- svelte-ignore a11y-click-events-have-key-events -->
<div id="{id}" class="selector-component">
    <div class="input-group {size ? `input-group-${size}` : ''}">
        <input type="text" class="form-control"
                bind:value={searchString}
                on:keyup={search}
                on:cut={search}
                on:paste={search}
                on:change={search}
                placeholder="{placeholderValue(selectedItem, items, selectedSubItem, subItems)}"
               {autofocus}>
        {#if searchString}
            <button class="btn btn-outline-secondary" on:click={clearSearch}>
                <i class="reset fas fa-times"></i>
            </button>
        {/if}
        <button class="btn btn-outline-{color}" disabled>
            <i class="caret fas fa-chevron-down"></i>
            {#if addOnIcon}
                &nbsp;<i class="{addOnIcon}"></i>
            {/if}
            {#if addOnLabel}
                &nbsp;{addOnLabel}
            {/if}
        </button>
    </div>

    {#if getMatchingItems(searchString, items, expanded).length}
        <div class="lists">
            <ul class="matchingItems {subItems.length ? '' : 'last'}" in:fly="{{ y: -10, duration: 500 }}" out:fly="{{ y: -10, duration: 500 }}" role="menu">
                {#each getMatchingItems(searchString, items, expanded) as item}
                    <li on:click={select} data-key={item.key} class="{(item.key == selectedItem && selectedItem !== false) ? 'selected' : ''}" role="menuitem">
                        {@html item.value}
                    </li>
                {/each}
            </ul>

            {#if selectedItem !== false && subItems.length}
                <ul class="subItems" in:fly="{{ y: 10, duration: 500 }}" out:fly="{{ y: 20, duration: 500 }}" role="menu">
                    {#each subItems as item}
                        <li on:click={select} data-key={item.key} class="{(item.key == selectedSubItem && selectedSubItem !== false) ? 'selected' : ''}" role="menuitem">
                            {@html item.value || '-'}
                        </li>
                    {/each}
                </ul>
            {/if}

        </div>
    {/if}

</div>





<style lang="stylus" global>
    .selector-component
        display: inline-block

        .lists
            display flex
            justify-content start
            align-items start

            ul
                border-radius var(--form-border-radius, 0.5rem)
                border-top-left-radius 0
                border-top-right-radius 0
                border 1px solid var(--border-color-light)
                background-color #fff
                max-height 30vh
                overflow auto
                scrollbar-width thin

                li
                    line-height 1.1
                    margin 0
                    padding 0.5rem var(--variable-button-h-padding, 1rem)
                    opacity 0.9
                    cursor pointer

                    &.selected
                    .selected
                        cursor default

                    &.selected
                    .selected
                    &:hover
                    :hover
                        opacity 1
                        color var(--bs-success)

                &:not(.last)
                    li.selected::after
                        content "  ▶"

                &.subItems
                    border-top-right-radius var(--form-border-radius, 0.5rem)
                    margin 1rem 0 0 -1px
                    right 0

                    li.selected::after
                        content ""

</style>