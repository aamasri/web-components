<script>
    // render an array of alerts recognizing highlighted classes "danger", "info", "warning"
    export let alerts = [ { message: 'test', level: 'secondary', format: 'inline'} ];
    export let format = 'inline';
    export let separator = ', ';

    const icons = {
        '': 'fas fa-info-circle',
        'secondary': 'fas fa-info-circle',
        'info': 'fas fa-info-circle',
        'warning': 'fas fa-exclamation-triangle',
        'danger': 'fas fa-exclamation-circle',
    }
    let output = [];
</script>




{#each alerts as alert, i}
    {#if ((alert.format || format) === 'text')}
        {#if i}{separator}{/if}
        <span class="text-{alert.level}">
            <i class="text-{alert.level} {icons[alert.level]}"></i>
            {alert.body || alert.message || ''}
        </span>
    {:else}
        <div class="alert alert-{alert.level} {format}" role="alert">
            <i class="{icons[alert.level]}"></i>&nbsp; {alert.body || alert.message || ''}
        </div>
    {/if}
{/each}




<style lang="stylus" global>
    .alert.inline
        display inline-block
        margin-right 1em
</style>