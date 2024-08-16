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
        dispatch('change', {field: field, value: checked});
    }
</script>


<button type="button"
        class="checkbox {classes} {checked ? 'active' : ''} {label ? 'hasLabel' : ''} btn {size ? `btn-${size}` : ''} btn-outline-{color ? 'light' : 'secondary'}"
        style="{color ? `color: ${color} !important; border-color: ${color};` : ''}"
        data-field={field}
        disabled="{disabled}"
        on:mousedown={handleEvent}
        on:touchstart={handleEvent}
        on:mouseup={handleEvent}
        on:touchend={handleEvent}
        on:contextmenu|preventDefault={() => dispatch('hold')}>
    <i class="fa-solid fa-check"></i><i class="spacer"> &nbsp; </i>{@html label }
</button>


<style lang="stylus" global>
  button.checkbox
    padding-left 0.65em
    padding-right 0.65em

    .fa-check
      visibility hidden
      display inline

    &.hasLabel:not(.active)
      padding-left 1.35em
      padding-right 1.35em

      .fa-check
        display none

    .spacer
      display none

    &.active
      box-shadow none

      .fa-check
        visibility visible

      &.hasLabel
        .spacer
          display inline

    .btn-outline-secondary:not(.active):not(:hover)
      background-color white
</style>