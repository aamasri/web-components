<script>
    import { createEventDispatcher } from 'svelte';

    export let searchString = '';
    export let placeholder = 'Search';

    let debounceDelay;
    const dispatch = createEventDispatcher();
    const dispatchChange = () => {
        window.clearTimeout(debounceDelay);
        debounceDelay = window.setTimeout(() => dispatch('change'), 800);
    }
</script>

<div class="search input-group">
    <span class="input-group-text"><i class="fas fa-search"></i></span>
    <input type="text"
            class="form-control"
            placeholder="{placeholder}"
            bind:value="{searchString}"
            on:input={dispatchChange} >
</div>



<style lang="stylus" global>
    .search
        max-width 20em
</style>