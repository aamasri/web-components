<script>
    const debug = false;

    export let id = '';
    export let type = 'text';   // text, number, date, time, datetime, email, url, tel, password
    export let value = '';
    export let placeholder = '';
    export let classes = '';
    export let endpoint = '';
    export let field = '';
    export let editable = false;
    export let nullable = false;    // may be empty (in the case of dates and numbers)
    export let min=0;
    export let max=0;

    let status = '';
    let initialValue;
    let timeoutId;
    let inputElement = null;
    let shadowElement = null;

    import { apiUpdate, notify } from '@aamasri/web-components/src/js/json-api.js';
    import {
        parseDateString,
        monthDay,
        convertToMs,
    } from '@aamasri/web-components/src/js/date-utils';

    import {createEventDispatcher} from 'svelte';
    const dispatch = createEventDispatcher();
    import { onMount } from 'svelte';
    onMount(() => {
        initialValue = value;
        if (debug) console.log(`mounted Input ${field}:${value}`);
    });


    async function save(event) {
        adjustInputWidth(event);

        if (event.type === 'blur')
            dispatch('blur');   // this allows siblings (like a date picker) to know that this input has lost focus

        // If the event type is 'blur' or the key pressed is 'Enter' or 'Tab' save the heading
        if (event.type === 'blur' || event.key === 'Enter' || event.key === 'Tab') {
            let value = event.target.value.trim();

            console.log(`save ${type}`, value);
            // validation
            switch (type) {
                case 'number':
                    // is a number
                    if (!nullable || (/^[0-9,.]+$/).test(value.toString())) {
                        value = parseFloat(value.replace(/,/g, ''));
                        console.log('save number', value, initialValue, isNaN(value), isNaN(initialValue));
                        if (isNaN(value) && !isNaN(initialValue)) {
                            notify(`"${value}" is not a valid number!`, 'error', inputElement);
                            event.target.value = format(initialValue);
                            return;
                        }
                    }

                    // min/max
                    if (min && value < min) {
                        notify(`must be no less than ${min}!`, 'error', inputElement);
                        event.target.value = format(initialValue);
                        return;
                    }
                    if (max && value > max) {
                        notify(`must be no greater than ${max}!`, 'error', inputElement);
                        event.target.value = format(initialValue);
                        return;
                    }
                    break;

                case 'date':
                    value = toDate(value);
                    if (value && !(value instanceof Date)) {
                        notify(`"${value}" is not a valid date!`, 'error', inputElement);
                        event.target.value = format(initialValue);
                        return;
                    }

                    // min/max
                    if (min && value < min) {
                        notify(`cannot be before ${monthDay(min)}!`, 'error', inputElement);
                        event.target.value = format(initialValue);
                        return;
                    }
                    if (max && value > max) {
                        notify(`cannot be after ${monthDay(max)}!`, 'error', inputElement);
                        event.target.value = format(initialValue);
                        return;
                    }

                    break;

                case 'text':
                    if (min && value.length < min) {
                        notify(`"${value}" must be at least ${min} characters!`, 'error', inputElement);
                        event.target.value = format(initialValue);
                        return;
                    }
                    if (max && value.length > max) {
                        notify(`"${value}" must be no more than ${max} characters!`, 'error', inputElement);
                        event.target.value = format(initialValue);
                        return;
                    }
                    break;
            }

            if ((format(value) !== format(initialValue)) && status !== 'saving') {
                if (debug) console.log(`save Input ${field} ${value}`);

                if (endpoint) {
                    try {
                        setStatus('saving');
                        const response = await apiUpdate(endpoint, '', { [field]: value });
                        setStatus('saved');
                        value = response.data[field];
                        event.target.value = format(value);
                        initialValue = value;

                        dispatch('saved', response.data);    // update parent component
                        event.target.blur();
                    } catch (response) {
                        console.warn(`updating ${field} failed with ${response.message}`, 'error');
                        event.target.value = format(initialValue);
                        notify(`Sorry, something went wrong updating the ${field}!`, 'error', inputElement);
                        setStatus('error');
                    }
                } else {
                    setStatus('');   // clear any previous status
                    dispatch('update', { [field]: value });    // update parent component
                }
            }

        } else if (event.type !== 'keypress' && event.key === 'Escape') {
            event.target.value = format(initialValue);
            if (debug) console.log(` heading restored to "${initialValue}"`);
            event.target.blur();
            status = '';
        }
    }



    function setStatus(newStatus) {
        window.clearTimeout(timeoutId);
        status = newStatus;
        if (debug) console.log('status', status);
        timeoutId = window.setTimeout(() => {
            if (status === 'saving')
                setStatus('error');
            else
                status = '';
        }, 3000);
    }



    function adjustInputWidth(event) {
        if (event) {
            if (event.key && [ 'Enter', 'Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Escape', 'Shift', 'Control', 'CapsLock', 'Meta', 'Alt' ].includes(event.key))
                return;
        }

        if (!inputElement || !shadowElement)
            return;

        const extraWidth = inputElement === document.activeElement ? 18 : 2;
        shadowElement.textContent = inputElement.value || placeholder;
        inputElement.style.width = (shadowElement.offsetWidth + extraWidth) + 'px';
        if (debug) console.log(`adjust input width for "${shadowElement.textContent}" to ${inputElement.style.width}`);
    }


    /**
     * Convert any type of date into a valid Date (else null)
     * Fixes native Date's inability to parse yyyy-mm-dd correctly in negative timezones
     *
     * @param {Date|string|number} anything - a date in any format
     * @return {Date|null} - native date object or null (i.e. unparsable)
     */
    function toDate(anything) {
        let date;
        if (anything instanceof Date)                               // easy - it's already a date
            return anything;
        else if (typeof anything === 'undefined' || !anything)      // empty
            return null;
        else if (['object', 'function'].includes(typeof anything))  // whatever it is it's not a date
            return null;
        else if ((/^[0-9,.]+$/).test((anything || '').toString()))  // if it's a number assume unix timestamp
            date = new Date(convertToMs(anything));
        else if (typeof anything === 'string')                      // human date - try to parse it
            date = parseDateString(anything); // add the current year (if year missing)
        else
            return null;

        return (date instanceof Date) ? date : null;                // parsed date else null
    }


    function format(value) {
        window.setTimeout(adjustInputWidth, 100);   // resize input after rendering

        switch (type) {
            case 'number':
                value = ([null, undefined, ''].includes(value) || isNaN(value)) ? '' : value.toLocaleString();
                break;

            case 'date':
                value = toDate(value)
                value = (value instanceof Date) ? monthDay(value) : '';
                break;
        }

        return value;
    }
</script>


<input type="text" bind:this={inputElement}
       data-id={id}
       class="input {classes} {field} {status}"
       class:editable={editable}
       on:blur={save} on:keydown={save}
       {placeholder}
       on:cut={adjustInputWidth}
       on:paste={adjustInputWidth}
       on:keyup={adjustInputWidth}
       on:click
       value={format(value)}><span bind:this={shadowElement} class="input-shadow">{format(value)}</span>


<style lang="stylus" global>
  input.input
    background-color transparent
    font-size inherit
    font-weight inherit
    line-height inherit
    padding 0
    margin 0
    border 1px solid transparent
    color inherit
    outline none
    transition all 300ms ease-in-out
    overflow visible

    &.editable
      color var(--text-color-editable)

      &:hover
      &:focus
        border-bottom 1px solid var(--text-color-editable)

      &.saving
        border-bottom 1px solid var(--bs-warning)

      &.saved
        border-bottom 1px solid var(--bs-success)

      &.error
        border-bottom 1px solid var(--bs-danger)

  .input-shadow
    position absolute
    font-size inherit
    font-weight inherit
    visibility hidden;
    z-index -1
    white-space nowrap

  // So it doesn't wrap and gives correct width
</style>