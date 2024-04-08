<script>
    // render an array of alerts recognizing highlighted classes "danger", "info", "warning"
    export let alerts = [ { message: 'test', level: 'secondary', format: 'inline'} ];

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
    {#if (alert.format === 'text')}
        {#if i}, {/if}
        <i class="text-{alert.level} {icons[alert.level]}"></i>
        <span class="text-{alert.level}">{alert.body || alert.message || ''}</span>
    {:else if (alert.format === 'box')}
        <div class="alert alert-{alert.level}" role="alert">
            <i class="{icons[alert.level]}"></i>&nbsp; {alert.body || alert.message || ''}
        </div>
    {:else}
        <div style="display: inline-block; margin-right: 1em;" class="alert alert-{alert.level}" role="alert">
            <i class="{icons[alert.level]}"></i>&nbsp; {alert.body || alert.message || ''}
        </div>
    {/if}
{/each}




<style lang="stylus" global>
</style>