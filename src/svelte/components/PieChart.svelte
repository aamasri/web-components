<script>
    export let progress;    // 0 - 100
</script>




{#if typeof progress === 'number' && progress >= 0}
    <div class="pieChart">
        <div class="icon {progress > 50 ? 'greaterThan180' : ''}">
            <div class="background"></div>
            <div class="hold">
                <div class="pie" style="transform: rotate({(progress > 50) ? (progress * 3.6) - 360 : progress * 3.6}deg);"></div>
            </div>
        </div>
        <p class="noTranslate">{Math.round(progress)}%</p>
    </div>
{/if}




<style lang="stylus" global>
    .pieChart
        display flex
        justify-content space-around
        align-items center

        p
            color silver
            font-size 12px
            margin 0 0 0 1em

        .icon
            height 20px

            .background
                background-color white
                position absolute
                width 20px
                height 20px
                border-radius 10px
                box-shadow 0 0 1px silver

            .pie
                position absolute
                background-color silver
                width 20px
                height 20px
                border-radius 10px
                clip rect(0px, 10px, 20px, 0px)

            .hold
                position absolute
                width 20px
                height 20px
                border-radius 10px
                clip rect(0px, 20px, 20px, 10px)

        &.greaterThan180
            .background
                background-color silver

            .pie
                background-color white
                clip rect(0px, 20px, 20px, 10px)

            .hold
                clip rect(0px, 10px, 20px, 0px)
</style>