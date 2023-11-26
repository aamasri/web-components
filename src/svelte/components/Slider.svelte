<script>
    /* USAGE
        // this component was adapted from https://github.com/simeydotme/svelte-slider-pips#slider-props
        // homepage: https://simeydotme.github.io/svelte-slider-pips
        // Thank You, Simon Goellner!

        <Slider id="slider1"
            range=true
            suffix="%"
            float=true
            selected=true           // pulsating effect
            hoverable=false
            timerEnabled=false      // start/stop timer mode (slider still functions as normal)
            step={10}
            values={[ 20 , 200]}
            min={-200}
            max={200} />
    */

    const debug = false;

    import { spring } from "svelte/motion";
    import { createEventDispatcher, onDestroy } from "svelte";

    // dom references
    export let slider = undefined;

    // range slider props
    export let range = false;   // false: handle only, 'min': 0-->value, 'max': value<--100, true: value1<-->value2
    export let pushy = false;   // if range is true, then this boolean decides if the active handle will push the dormant one along
    export let min = 0;         // Minimum value for the slider
    export let max = 100;       // Maximum value for the slider
    export let step = 1;        // slider notches
    export let values = [ (max + min) / 2 ];    // default [ 50 ]. Array of values to apply on the slider. Multiple values creates multiple handles. (note: A slider with range property set can only have two values max)
    export let vertical = false;    // render the slider vertically
    export let float = false;       // set true to add a floating label above focussed handles
    export let reversed = false;
    export let hoverable = true;
    export let disabled = false;
    export let timerEnabled = false;    // show start/stop button
    export let timerStartedAt = 0;      // unix timestamp of when the timer started (mSecs)
    export let timerUnit = 'ms';        // 'ms', 's', 'm', 'h'
    export let tabIndex = 0;            // sliders require a tabindex

    // formatting props
    export let id = undefined;  // optional id attribute to the component for styling/other reasons
    export let prefix = "";     // a string to prefix to all displayed values
    export let suffix = "";     // a string to suffix to all displayed values
    export let formatter = (v) => v;  // a function {(v) => v} to re-format values before they are displayed

    // stylistic props
    export let precision = 2;       // number of decimal places to round off to
    export let springValues = { stiffness: 0.15, damping: 0.4 };    // Svelte spring physics object to change the behaviour of the handle when moving
    export let color = '#B8BBC0';   // any css parseable color eg. rgba(...)
    export let selected = false;    // animate the handle

    // prepare dispatched events
    const dispatch = createEventDispatcher();

    // state management
    let valueLength = 0;
    let focus = false;
    let handleActivated = false;
    let handlePressed = false;
    let keyboardActive = false;
    let activeHandle = values.length - 1;
    let startValue;
    let previousValue;
    let interactionInProgress;  // suspend timer updates while users interact with the slider
    let handleDragged = false;  // whether user interaction was a click or drag (clicks toggle the timer)

    // timer state and dynamic value
    let timerInitialValue;
    let timerId;
    let timerDivider;
    let dynamicValue = 0;
    let overflow = false;


    // copy the initial values in to a spring function which
    // will update every time the values array is modified

    let springPositions;

    $: {
        // check that "values" is an array, or set it as array
        // to prevent any errors in springs, or range trimming
        if (!Array.isArray(values)) {
            values = [ (max + min) / 2 ];
            console.error("'values' prop should be an Array (https://github.com/simeydotme/svelte-slider-pips#slider-props)");
        }
        // trim the range, so it remains as a min/max (only 2 handles)
        // and also align the handles to the steps
        values = trimRange(values.map((v) => alignValueToStep(v)));

        // check if the valueLength (length of values[]) has changed,
        // because if so we need to re-seed the spring function with the
        // new values array.
        if (valueLength !== values.length) {
            // set the initial spring values when the slider initialises,
            // or when values array length has changed
            springPositions = spring(values.map((v) => percentOf(v)), springValues);
        } else {
            // update the value of the spring function for animated handles
            // whenever the values has updated
            springPositions.set(values.map((v) => percentOf(v)));
        }
        // set the valueLength for the next check
        valueLength = values.length;

        if (timerStartedAt && !timerId)
            timer('start', timerStartedAt);

        overflow = timerStartedAt && values[0] >= max;
    }

    onDestroy(() => {
        if (timerId)
            clearInterval(timerId);    // prevent memory leak
    });


    /**
     * take in a value, and then calculate that value's percentage
     * of the overall range (min-max);
     * @param {number} val the value we're getting percent for
     * @return {number} the percentage value
     **/
    $: percentOf = function (val) {
        let percent = ((val - min) / (max - min)) * 100;
        if (isNaN(percent) || percent <= 0)
            return 0;
        else if (percent >= 100)
            return 100;
        else
            return fixFloat(percent);
    };

    /**
     * clamp a value from the range so that it always
     * falls within the min/max values
     * @param {number} val the value to clamp
     * @return {number} the value after it's been clamped
     **/
    $: clampValue = function (val) {
        // return the min/max if outside of that range
        return val <= min ? min : val >= max ? max : val;
    };

    /**
     * align the value with the steps so that it
     * always sits on the closest (above/below) step
     * @param {number} val the value to align
     * @return {number} the value after it's been aligned
     **/
    $: alignValueToStep = function (val) {
        // sanity check for performance
        if (val <= min)
            return fixFloat(min);
        else if (val >= max)
            return fixFloat(max);

        // find the middle-point between steps
        // and see if the value is closer to the
        // next step, or previous step
        let remainder = (val - min) % step;
        let aligned = val - remainder;
        if (Math.abs(remainder) * 2 >= step)
            aligned += remainder > 0 ? step : -step;

        // make sure the value is within acceptable limits
        aligned = clampValue(aligned);
        // make sure the returned value is set to the precision desired
        // this is also because javascript often returns weird floats
        // when dealing with odd numbers and percentages

        return fixFloat(aligned);
    };

    /**
     * the orientation of the handles/pips based on the
     * input values of vertical and reversed
     **/
    $: orientationStart = vertical ? reversed ? 'top' : 'bottom' : reversed ? 'right' : 'left';
    $: orientationEnd = vertical ? reversed ? 'bottom' : 'top' : reversed ? 'left' : 'right';

    function fixFloat(value) {
        return parseFloat(Number(value).toFixed(precision));
    }

    /**
     * helper func to get the index of an element in its DOM container
     * @param {object} el dom object reference we want the index of
     * @returns {number} the index of the input element
     **/
    function index(el) {
        if (!el) return -1;
        let i = 0;
        while (el === el.previousElementSibling)
            i++;

        return i;
    }

    /**
     * normalise a mouse or touch event to return the
     * client (x/y) object for that event
     * @param {event} e a mouse/touch event to normalise
     * @returns {object} normalised event client object (x,y)
     **/
    function normalisedClient(e) {
        if (e.type.includes("touch"))
            return e.touches[0];
        else
            return e;
    }

    /**
     * check if an element is a handle on the slider
     * @param {object} el dom object reference we want to check
     * @returns {boolean}
     **/
    function targetIsHandle(el) {
        const handles = slider.querySelectorAll(".handle");
        const isHandle = Array.prototype.includes.call(handles, el);
        const isChild = Array.prototype.some.call(handles, (e) => e.contains(el));
        return isHandle || isChild;
    }

    /**
     * trim the values array based on whether the property
     * for 'range' is 'min', 'max', or truthy. This is because we
     * do not want more than one handle for a min/max range, and we do
     * not want more than two handles for a true range.
     * @param {array} values the input values for the slider
     * @return {array} the range array for creating a slider
     **/
    function trimRange(values) {
        if ([ 'min', 'max' ].includes(range))
            return values.slice(0, 1);
        else if (range)
            return values.slice(0, 2);
        else
            return values;
    }

    /**
     * helper to return the slider dimensions for finding
     * the closest handle to user interaction
     * @return {object} the range slider DOM client rect
     **/
    function getSliderDimensions() {
        return slider.getBoundingClientRect();
    }

    /**
     * helper to return closest handle to user interaction
     * @param {object} clientPos the client{x,y} positions to check against
     * @return {number} the index of the closest handle to clientPos
     **/
    function getClosestHandle(clientPos) {
        // first make sure we have the latest dimensions
        // of the slider, as it may have changed size
        const dims = getSliderDimensions();
        // calculate the interaction position, percent and value
        let handlePos;
        let handlePercent;
        let handleVal = 0;
        if (vertical) {
            handlePos = clientPos.clientY - dims.top;
            handlePercent = (handlePos / dims.height) * 100;
            handlePercent = reversed ? handlePercent : 100 - handlePercent;
        } else {
            handlePos = clientPos.clientX - dims.left;
            handlePercent = (handlePos / dims.width) * 100;
            handlePercent = reversed ? 100 - handlePercent : handlePercent;
        }
        handleVal = ((max - min) / 100) * handlePercent + min;

        let closest;

        // if we have a range, and the handles are at the same
        // position, we want a simple check if the interaction
        // value is greater than return the second handle
        if (range === true && values[0] === values[1]) {
            if (handleVal > values[1])
                return 1;
            else
                return 0;

            // if there are multiple handles, and not a range, then
            // we sort the handles values, and return the first one closest
            // to the interaction value
        } else {
            closest = values.indexOf(
                    [ ...values ].sort((a, b) => Math.abs(handleVal - a) - Math.abs(handleVal - b))[0]
            );
        }
        return closest;
    }

    /**
     * take the interaction position on the slider, convert
     * it to a value on the range, and then send that value
     * through to the moveHandle() method to set the active
     * handle's position
     * @param {object} clientPos the client{x,y} of the interaction
     **/
    function handleInteract(clientPos) {
        if (debug) console.log('handle moved')
        // first make sure we have the latest dimensions
        // of the slider, as it may have changed size
        const dims = getSliderDimensions();
        // calculate the interaction position, percent and value
        let handlePos = 0;
        let handlePercent = 0;
        let handleVal = 0;
        if (vertical) {
            handlePos = clientPos.clientY - dims.top;
            handlePercent = (handlePos / dims.height) * 100;
            handlePercent = reversed ? handlePercent : 100 - handlePercent;
        } else {
            handlePos = clientPos.clientX - dims.left;
            handlePercent = (handlePos / dims.width) * 100;
            handlePercent = reversed ? 100 - handlePercent : handlePercent;
        }
        handleVal = ((max - min) / 100) * handlePercent + min;

        // move handle to the value
        handleDragged = true;
        timer('stop');
        moveHandle(activeHandle, handleVal);
    }

    /**
     * move a handle to a specific value, respecting the clamp/align rules
     * @param {number} index the index of the handle we want to move
     * @param {number} value the value to move the handle to
     * @return {number} the value that was moved to (after alignment/clamping)
     **/
    function moveHandle(index, value) {
        // align & clamp the value, so we're not doing extra
        // calculation on an out-of-range value down below
        value = alignValueToStep(value);
        // use the active handle if handle index is not provided
        if (typeof index === 'undefined')
            index = activeHandle;

        // if this is a range slider perform special checks
        if (range) {
            // restrict the handles of a slider from
            // going past one-another unless "pushy" is true
            if (index === 0 && value > values[1]) {
                if (pushy)
                    values[1] = value;
                else
                    value = values[1];

            } else if (index === 1 && value < values[0]) {
                if (pushy)
                    values[0] = value;
                else
                    value = values[0];
            }
        }

        // if the value has changed, update it
        if (values[index] !== value)
            values[index] = value;

        // fire the change event when the handle moves,
        // and store the previous value for the next time
        if (previousValue !== value) {
            if (debug) console.log('moveHandle value changed');
            eChange();
            previousValue = value;
        }

        return value;
    }

    /**
     * helper to find the beginning range value for use with css style
     * @param {array} values the input values for the slider
     * @return {number} the beginning of the range
     **/
    function rangeStart(values) {
        if (range === "min")
            return 0;
        else
            return values[0];
    }

    /**
     * helper to find the ending range value for use with css style
     * @param {array} values the input values for the slider
     * @return {number} the end of the range
     **/
    function rangeEnd(values) {
        if (range === 'max')
            return 0;
        else if (range === 'min')
            return 100 - values[0];
        else
            return 100 - values[1];
    }

    /**
     * when the user has unfocused (blurred) from the
     * slider, deactivate all handles
     **/
    function sliderBlurHandle() {
        if (keyboardActive) {
            focus = false;
            handleActivated = false;
            handlePressed = false;
        }
    }

    /**
     * when the user focuses the handle of a slider
     * set it to be active
     * @param {event} e the event from browser
     **/
    function sliderFocusHandle() {
        if (!disabled)
            focus = true;
    }

    /**
     * handle the keyboard accessible features by checking the
     * input type, and modifier key then moving handle by appropriate amount
     * @param {event} e the event from browser
     **/
    function sliderKeydown(e) {
        if (!disabled) {
            const handle = index(e.target);
            let jump = e.ctrlKey || e.metaKey || e.shiftKey ? step * 10 : step;
            let prevent = false;
            let timerStatus = 'stop';   // for key inputs (apart from space-bar) we're going to stop the timer

            // noinspection FallThroughInSwitchStatementJS
            switch (e.key) {
                case "PageDown":
                    jump *= 10;
                case "ArrowRight":
                case "ArrowUp":
                    moveHandle(handle, values[handle] + jump);
                    prevent = true;
                    break;
                case "PageUp":
                    jump *= 10;
                case "ArrowLeft":
                case "ArrowDown":
                    moveHandle(handle, values[handle] - jump);
                    prevent = true;
                    break;
                case "Home":
                    moveHandle(handle, min);
                    prevent = true;
                    break;
                case "End":
                    moveHandle(handle, max);
                    prevent = true;
                    break;
                case "Spacebar":    // IE9 and Firefox < 37
                case ' ':
                    timerStatus = 'toggle';   // space-bar toggles the timer
                    prevent = true;
                    break;
            }

            if (prevent) {
                e.preventDefault();
                e.stopPropagation();
            }

            timer(timerStatus);
        }
    }

    /**
     * function to run when the user touches
     * down on the slider element anywhere
     * @param {event} e the event from browser
     **/
    function sliderInteractStart(e) {
        if (!disabled) {
            interactionInProgress = true;   // prevent timer interference with user interaction
            const clientPos = normalisedClient(e);
            // set the closest handle as active
            focus = true;
            handleActivated = true;
            handlePressed = true;
            activeHandle = getClosestHandle(clientPos);

            // fire the start event
            startValue = previousValue = alignValueToStep(values[activeHandle]);
            eStart();

            // for touch devices we want the handle to instantly
            // move to the position touched for more responsive feeling
            if (e.type === "touchstart")
                handleInteract(clientPos);
        }
    }

    /**
     * function to run when the user stops touching
     * down on the slider element anywhere
     * @param {event} e the event from browser
     **/
    function sliderInteractEnd(e) {
        // stop or toggle the timer on drag
        if (handleDragged)
            handleDragged = false;
        else
            timer('toggle');

        // fire the stop event for touch devices
        if (e.type === "touchend") {
            if (debug) console.log('calling eStop() on slider interact end');
            eStop();
        }

        handlePressed = false;
    }

    /**
     * unfocus the slider if the user clicked off of
     * it, somewhere else on the screen
     * @param {event} e the event from browser
     **/
    function bodyInteractStart(e) {
        keyboardActive = false;
        handleDragged = false;
        if (focus && e.target !== slider && !slider.contains(e.target))
            focus = false;
    }

    /**
     * send the clientX through to handle the interaction
     * whenever the user moves across screen while active
     * @param {event} e the event from browser
     **/
    function bodyInteract(e) {
        if (!disabled) {
            if (handleActivated)
                handleInteract(normalisedClient(e));
        }
    }

    /**
     * if user triggers mouseup on the body while
     * a handle is active (without moving) then we
     * trigger an interact event there
     * @param {event} e the event from browser
     **/
    function bodyMouseUp(e) {
        if (debug) console.log('bodyMouseUp(e)', e);
        if (!disabled) {
            const el = e.target;
            // this only works if a handle is active, which can only happen if
            // there was sliderInteractStart triggered on the slider, already
            if (handleActivated) {
                if (el === slider || slider.contains(el)) {
                    focus = true;
                    // don't trigger interact if the target is a handle (no need)
                    if (!targetIsHandle(el))
                        handleInteract(normalisedClient(e));
                }
                // fire the stop event for mouse device
                // when the body is triggered with an active handle
                if (debug) console.log('calling eStop() because mouseup on body');
                eStop();
            }
        }
        handleActivated = false;
        handlePressed = false;
    }

    /**
     * if user triggers touchend on the body then we
     * unfocus the slider completely
     **/
    function bodyTouchEnd() {
        handleActivated = false;
        handlePressed = false;
    }

    function bodyKeyDown(e) {
        if (!disabled) {
            if (e.target === slider || slider.contains(e.target)) {
                keyboardActive = true;
            }
        }
    }

    function eStart() {
        !disabled && dispatch('start', {
            slider: slider,
            activeHandle: activeHandle,
            value: startValue,
            values: values.map((v) => alignValueToStep(v)),
        });
    }

    function eStop() {
        !disabled && dispatch('stop', {
            slider: slider,
            activeHandle: activeHandle,
            startValue: startValue,
            value: values[activeHandle],
            timerStartedAt: timerStartedAt,
            values: values.map((v) => alignValueToStep(v)),
        });
    }

    function eChange() {
        !disabled && dispatch('change', {
            slider: slider,
            activeHandle: activeHandle,
            startValue: startValue,
            previousValue: typeof previousValue === 'undefined' ? startValue : previousValue,
            value: values[activeHandle],
            timerStartedAt: timerStartedAt,
            values: values.map((v) => alignValueToStep(v)),
        });
    }


    function timer(startStopToggle, resumeFrom=0) {
        if (!['start', 'stop', 'toggle'].includes(startStopToggle))
            throw new Error('timer() must be called with "start", "stop" or "toggle"');

        if (debug) console.log(`timer(${startStopToggle}) timerStartedAt=${timerStartedAt}`);

        interactionInProgress = false;   // assume the user interaction is over and allow the timer to run

        // stop condition
        if (startStopToggle === 'stop' || (startStopToggle === 'toggle' && timerStartedAt)) {
            clearInterval(timerId);
            timerId = null;
            timerStartedAt = 0;
            dynamicValue = 0;
            return;
        }

        if (startStopToggle === 'start' && timerStartedAt && timerId)
            return;     // already started

        // start or resume after component mount
        timerStartedAt = resumeFrom || Date.now();    // start timer
        timerInitialValue = values[activeHandle];

        // update handle position with an interval timer
        // it doesn't have to fire precisely because we timestamp the previous value
        timerDivider = timerUnit === 's' ? 1000 : timerUnit === 'm' ? 60000 : timerUnit === 'h' ? 3600000 : 1;  // default 'ms'
        timerUpdateHandle();    // run once immediately
        timerId = setInterval(timerUpdateHandle, 1000);
        if (debug) console.log(`timer started at ${timerStartedAt} mS`);
    }


    // update handle position based on timer start time and initial value
    function timerUpdateHandle() {
        if (interactionInProgress)   // prevent timer interference with user interaction
            return;     // don't fight with the user dragging the handle

        // timer has been stopped by parent component
        if (!timerStartedAt) {
            clearInterval(timerId);
            timerId = null;
            dynamicValue = 0;
            return;
        }

        dynamicValue = timerInitialValue + ((Date.now() - timerStartedAt) / timerDivider);
        if (debug) console.log(`timer time lapse: ${dynamicValue} hours`);
        if (dynamicValue >= max)
            dynamicValue = max;

        if (values[activeHandle] < dynamicValue) {
            if (debug) console.log(`  timer value updated ${values[activeHandle]} -> ${dynamicValue}`);
            values[activeHandle] = dynamicValue;
        }
    }
</script>





<div {id}
     bind:this={slider}
     class="slider"
     tabindex={tabIndex}
     class:range={range === true}
     class:disabled
     class:hoverable
     class:vertical
     class:reversed
     class:focus
     class:min={range === 'min'}
     class:max={range === 'max'}
     on:mousedown={sliderInteractStart}
     on:mouseup={sliderInteractEnd}
     on:touchstart|preventDefault={sliderInteractStart}
     on:touchend|preventDefault={sliderInteractEnd}
     role="slider"
     aria-valuemin={min}
     aria-valuemax={max}
     aria-valuenow={range === true ? `${prefix}${values[0]} to ${values[1]}${suffix}` : `${prefix}${values[0]}${suffix}`}
     aria-orientation="{vertical ? 'vertical' : 'horizontal'}"
     aria-disabled="{disabled}">

    {#each values as value, index}
        <span class="handle"
              class:active={focus && activeHandle === index}
              class:press={handlePressed && activeHandle === index}
              class:selected={selected || (timerEnabled && timerStartedAt)}
              class:timerEnabled
              class:overflow
              data-handle={index}
              on:blur={sliderBlurHandle}
              on:focus={sliderFocusHandle}
              on:keydown={sliderKeydown}
              style="{orientationStart}: {$springPositions[index]}%; z-index: {activeHandle === index ? 3 : 2};"
              {disabled}
              role="button" tabindex="0">

            <span class="ring" style="box-shadow: 0 0 0 {handlePressed && activeHandle === index ? 12 : 8}px {overflow ? 'var(--bs-danger)' : color};"></span>

            {#if timerEnabled}
                {#if timerStartedAt}
                    <svg class="nub pause" style="background-color: {color}; border-color: {color};" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><path d="M128 64H0V448H128V64zm192 0H192V448H320V64z"/></svg>
                {:else}
                    <svg class="nub play" style="background-color: {color}; border-color: {color};" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path d="M384 256L0 32V480L384 256z"/></svg>
                {/if}
            {:else}
                <svg class="nub" style="background-color: {color}; border-color: {color};" />
            {/if}

            {#if float && value}
                <span class="float" style="background-color: {focus ? color : 'var(--handle-inactive)'};">
                    {#if prefix}<span class="float-prefix">{prefix}</span>{/if}
                    {formatter(dynamicValue || value, index, percentOf(dynamicValue || value))}
                    {#if suffix}<span class="float-suffix">{suffix}</span>{/if}
                </span>
            {/if}
        </span>
    {/each}

    {#if range}
        <span class="bar"
              style="{orientationStart}: {rangeStart($springPositions)}%; {orientationEnd}: {rangeEnd($springPositions)}%; background-color: {color};">
        </span>
    {/if}
</div>

<svelte:window
    on:mousedown={bodyInteractStart}
    on:touchstart={bodyInteractStart}
    on:mousemove={bodyInteract}
    on:touchmove={bodyInteract}
    on:mouseup={bodyMouseUp}
    on:touchend={bodyTouchEnd}
    on:keydown={bodyKeyDown}
/>






<style lang="stylus" global>
    /* Style Guide
    // The component can be further styled after the props have been defined by overriding the default css styling.
    // The best way to do this is to use the id="" prop and then scope your global css with this id.

    // main slider element
    .slider {}
    .slider.vertical {}       // if slider is vertical
    .slider.focus {}          // if slider is focussed
    .slider.range {}          // if slider is a range
    .slider.min {}            // if slider is a min-range
    .slider.max {}            // if slider is a max-range
    .slider.pips {}           // if slider has visible pips
    .slider.pip-labels {}     // if slider has labels for pips

    // slider handles
    .slider > .handle {}                 // positioned wrapper for the handle/float
    .slider > .handle.active {}          // if a handle is active in any way
    .slider > .handle.press {}           // if a handle is being pressed down
    .slider > .handle.hoverable {}       // if the handles allow hover effect
    .slider > .handle > .nub {}     // the actual nub rendered as a handle
    .slider > .handle > .float {}   // the floating value above the handle

    // slider range
    .slider > .bar {}                    // the range between the two handles

    // CSS Variables for color-theming if only color changes are desired

    --slider-track:             #d7dada                            // slider main background color
    --slider-handle-inactive:   #99a2a2                            // inactive handle color
    --slider-handle:            #838de7                            // non-focussed handle color
    --slider-handle-focus:      #4a40d4                            // focussed handle color
    --slider-handle-border:     var(--slider-handle)
    --slider-range-inactive:    var(--slider-handle-inactive)      // inactive range bar background color
    --slider-range:             var(--slider-handle-focus)         // active range bar background color
    --slider-float-inactive:    var(--slider-handle-inactive)      // inactive floating label background color
    --slider-float:             var(--slider-handle-focus)         // floating label background color
    --slider-float-text:        white                              // text color on floating label
    */
    .slider
        --slider var(--slider-track, #e9ecef)
        --handle-inactive var(--slider-handle-inactive, #99a2a2)
        --handle var(--slider-handle, #838de7)
        --handle-focus var(--slider-handle-focus, #4a40d4)
        --handle-border var(--slider-handle-border, var(--handle))
        --range-inactive var(--slider-range-inactive, var(--handle-inactive))
        --range var(--slider-range, var(--handle-focus))
        --float-inactive var(--slider-float-inactive, var(--handle-inactive))
        --float var(--slider-float, var(--handle-focus))
        --float-text var(--slider-float-text, white)

        position relative
        background-color var(--slider)
        height 4px
        margin 1em
        transition opacity 0.2s ease
        user-select none

        *
            user-select none


        &.vertical
            display inline-block
            width 0.5em
            min-height 200px


        .handle
            position absolute
            display block
            height 1.2rem
            width 1.2rem
            top 50%
            bottom auto
            transform translateY(-50%) translateX(-50%)
            z-index 2
            border-radius 50%; /* this is so the browser focus outline isn't square */


            &.timerEnabled
                height 2rem
                width 2rem


        &.reversed .handle
            transform translateY(-50%) translateX(50%)


        &.vertical .handle
            left 0.25em
            top auto
            transform translateY(50%) translateX(-50%)


        &.vertical.reversed .handle
            transform translateY(-50%) translateX(-50%)


        .nub,
        .handle .ring
            position absolute
            left 0
            top 0
            display block
            border-radius 50%
            height 100%
            width 100%

        .handle
            .ring
                left 1px
                top 1px
                bottom 1px
                right 1px
                height auto
                width auto
                box-shadow 0 0 0 0 var(--handle-border)
                opacity 0

            &.overflow .ring
                box-shadow 0 0 0 0 var(--danger-color, #DC3545)

        &.hoverable:not(.disabled) .handle.selected:not(.press):not(:hover) .ring
            animation pulse 4s infinite
            opacity unset

            @keyframes pulse
                0%
                    opacity 0
                    transform scale(0.6)

                80%
                    opacity 0.4
                    transform scale(1.2)

                100%
                    opacity 0
                    transform scale(0.6)


        &.hoverable:not(.disabled) .handle:hover .ring,
        &.hoverable:not(.disabled).focus .handle .ring
            box-shadow 0 0 0 8px var(--handle-border)
            opacity 0.2


        &.hoverable:not(.disabled) .handle.press .ring,
        &.hoverable:not(.disabled) .handle.press:hover .ring
            box-shadow 0 0 0 12px var(--handle-border)
            opacity 0.4


        &.range:not(.min):not(.max) .nub
            border-radius 10em 10em 10em 1.6em

        &.range .handle:nth-of-type(1) .nub
            transform rotate(-135deg)


        &.range .handle:nth-of-type(2) .nub
            transform rotate(45deg)

        &.range.reversed .handle:nth-of-type(1) .nub
            transform rotate(45deg)

        &.range.reversed .handle:nth-of-type(2) .nub
            transform rotate(-135deg)

        &.range.vertical .handle:nth-of-type(1) .nub
            transform rotate(135deg)

        &.range.vertical .handle:nth-of-type(2) .nub
            transform rotate(-45deg)

        &.range.vertical.reversed .handle:nth-of-type(1) .nub
            transform rotate(-45deg)

        &.range.vertical.reversed .handle:nth-of-type(2) .nub
            transform rotate(135deg)


        .float
            display block
            position absolute
            left 50%
            top -0.5em
            transform translate(-50%, -100%)
            text-align center
            opacity 0
            pointer-events none
            white-space nowrap
            transition all 0.2s ease
            font-size 0.9em
            padding 0.1em 0.4em
            border-radius 0.2em
            line-height 1.5

        .handle.active .float,
        &.hoverable .handle:hover .float
            opacity 1
            top -0.2em
            transform translate(-50%, -150%)

        .bar
            position absolute
            display block
            transition background 0.2s ease
            border-radius 1em
            height inherit
            top 0
            user-select none
            z-index 1


        &.vertical .bar
            width 0.5em
            height auto

        &.focus .handle:focus,
        &.focus .handle:focus-visible
            outline none

        .bar
            background-color var(--range-inactive)

        .nub
            background-color var(--handle-inactive)
            border 4px solid var(--handle-inactive)
            fill white
            padding 4px 0 4px 0
            &.play
                padding-left 4px

        &.focus .nub
            border-color var(--focus-color) !important

        .handle.active .nub
            background-color var(--handle-focus)

        .float
            color var(--float-text)
            background-color var(--float-inactive)

        &.focus .float
            background-color var(--float)

        &.disabled
            opacity 0.5

        &.disabled .nub
            background-color var(--slider)
</style>