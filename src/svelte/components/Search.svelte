<script>
    export let searchString = '';
    export let placeholder = 'Search';

    let debounceDelay;

    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();
    const dispatchChange = () => {
        window.clearTimeout(debounceDelay);
        debounceDelay = window.setTimeout(() => dispatch('change', searchString), 800);
    }

    function clearSearch() {
        searchString = '';
        dispatch('change', searchString);
    }
</script>



<div class="search input-group">
    <span class="input-group-text"><i class="fa-solid fa-search"></i></span>
    <input type="text"
           class="form-control"
           name="search"
           placeholder="{placeholder}"
           bind:value="{searchString}"
           on:input={dispatchChange} >

    {#if searchString}
        <button class="input-group-text" on:click={clearSearch}><i class="fa-solid fa-xmark"></i></button>
    {/if}
</div>



<style lang="stylus" global>
    .search
        max-width 20em
</style>