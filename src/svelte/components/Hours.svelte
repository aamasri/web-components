<script>
    import { toHoursMinutes } from '../../js/date-utils';
    import { onDestroy } from 'svelte';

    export let values = {
            hours: [],          // single value or array of values
            timerStartedAt: [], // single value or array of values
            subtotal: 0
        };
    export let padding = true;
    export let includeSeconds = false;

    let minutesPrecision = window.timesheetMinutePrecision || 5;
    let timerStartedAt = 0;
    let clock = 0;
    let clockId;


    $: {
        if (Array.isArray(values.timerStartedAt))
            timerStartedAt = values.timerStartedAt.find(timestamp => timestamp > 0) || 0;
        else
            timerStartedAt = values.timerStartedAt || 0;

        if (timerStartedAt && !clockId) {
            clockId = setInterval(() => {
                clock = clock + 1;
            }, includeSeconds ? 1000 : 2000);   // go easy on the CPU where possible
        } else if (!timerStartedAt && clockId) {
            clearInterval(clockId);
            clockId = null;
        }
    }

    onDestroy(() => {
        if (clockId) clearInterval(clockId);
    })


    // data can represent a single value or an array of values
    // i.e. this can be for a single day or a week subtotal for a project row
    function dynamicHours(values) {
        let hours;

        if (Array.isArray(values.hours))
            hours = values.hours.reduce((a, b) => (a || 0) + (b || 0), 0);
        else
            hours = values.subtotal || values.hours || 0;

        if (timerStartedAt)
            hours += (Date.now() - timerStartedAt) / 3600000;   // 1000 * 60 * 60

        return timerStartedAt ? hoursMinsSecs(hours) : hoursMins(hours);
    }

    // format decimal hours as hh:mm:ss (TOGGLE MODE)
    function hoursMinsSecs(hoursDecimal) {
        return toHoursMinutes(hoursDecimal, { includeSeconds: includeSeconds });
    }

    // format decimal hours as hh:mm rounded to nearest 5 minutes
    function hoursMins(hoursDecimal) {
        const options = { minutesPrecision: minutesPrecision };
        if (!padding)
            options.padding = '';
        return toHoursMinutes(hoursDecimal, options);
    }
</script>



{dynamicHours(values, clock)}
