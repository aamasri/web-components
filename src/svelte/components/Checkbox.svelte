<script>
    const debug = false;
    import { createEventDispatcher, tick } from 'svelte';

    export let checked = false;
    export let disabled = false;
    export let field = 'checkbox';
    export let label = 'Label';
    export let size = '';
    export let color = '';
    export let classes = '';

    const dispatch = createEventDispatcher();

    // analyze mouse and touch events to dispatch tap/click or hold/contextmenu,
    const LONG_PRESS_THRESHOLD = 700;   // click/hold threshold
    const DEBOUNCE_THRESHOLD = 4;       // touch devices fire duplicate start/end events. On IOS 4mS kills the noise while detecting the shortest taps.
    let startedInteractionAt = 0;
    let pressTimer;
    async function handleEvent(event) {
        window.clearTimeout(pressTimer);

        const leftMouseButton = ['mousedown', 'mouseup'].includes(event.type) && event.button === 0;
        const touch = ['touchstart', 'touchend'].includes(event.type);

        if (!leftMouseButton && !touch)
            return;

        const startOfInteraction = ['touchstart', 'mousedown'].includes(event.type);

        if (startOfInteraction) {
            startedInteractionAt = Date.now();
            pressTimer = window.setTimeout(function () {
                dispatch('hold');
            }, LONG_PRESS_THRESHOLD);
            return;
        }

        // discard debounce noise and long press
        // btw native onclick doesn't distinguish between short and long press
        const clickDuration = Date.now() - startedInteractionAt;
        if (clickDuration < DEBOUNCE_THRESHOLD || clickDuration > LONG_PRESS_THRESHOLD)
            return;

        checked = !checked;     // toggle checkbox
        await tick();           // so that parent component sees updated checkbox DOM
        dispatch('change', { field: field, value: checked });
    }
</script>




<button type="button"
        class="checkbox {classes} {checked ? 'active' : ''} btn {size ? `btn-${size}` : ''} btn-outline-{color ? 'light' : 'secondary'}"
        style="{color ? `color: ${color} !important; border-color: ${color};` : ''}"
        data-field = {field}
        disabled="{disabled}"
        on:mousedown={handleEvent}
        on:touchstart={handleEvent}
        on:mouseup={handleEvent}
        on:touchend={handleEvent}
        on:contextmenu|preventDefault={() => dispatch('hold')}>
    <span class="fa-solid fa-check"> &nbsp;</span> {@html label}
</button>




<style lang="stylus" global>
    button.checkbox
        // try to make button stay the same size checked or unchecked
        padding-left 1.5em
        padding-right 1.5em

        .fa-check
            display none

        &.active
            padding-left 0.75rem
            padding-right 0.75rem
            box-shadow none

            .fa-check
                display inline

        .btn-outline-secondary:not(.active):not(:hover)
            background-color white  // hide shadow spill from sibling button
</style>