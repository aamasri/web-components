<script>
    const debug = false;
    import { loader, resetLoading } from './pageProgressStore';   // allows this component to be globally reactive

    let loadingTimeout;
    let resetProgressTimeout;



    function progress(numCompleted, total) {
        if (debug) console.log(`page loading progress is ${numCompleted} of ${total}`);

        // reset loading and completion timeouts on every load change
        window.clearTimeout(resetProgressTimeout);
        window.clearTimeout(loadingTimeout);

        // start with loading animation 0 --> 10%
        let progressInitial = (total && numCompleted === 0) ? 10 : 0;
        if (debug) console.log(` initial progress: ${progressInitial}%`);

        if (total) {
            if (total !== numCompleted) {
                // set up a loading timeout on stall
                loadingTimeout = window.setTimeout(() => {
                    resetLoading();
                    console.warn(' page loading progress TIMED OUT');
                }, 3000);
            } else {
                // load complete fade-out progress animation
                if (debug) console.log(' page loading completed');
                resetProgressTimeout = window.setTimeout(() => {
                    resetLoading();
                    window.clearTimeout(loadingTimeout);
                }, 2000);
            }
        }

        const displayedProgress = progressInitial + (100 * numCompleted/total);
        if (debug) console.log(` displayed: ${displayedProgress || 0}%`);

        return displayedProgress || 0;
    }

    function loadingStatus(numCompleted, total) {
        if (total === 0)
            return '';

        if (numCompleted === total)
            return 'completed';

        return 'loading';
    }

    function timedOut(completeCount, loadingCount) {
        return (loadingCount === 0) && (completeCount === 0);
    }
</script>



<div class="pageProgress {loadingStatus($loader.completedCount, $loader.loadingCount)}">
    <div class="progress-bar progress-bar-striped bg-{timedOut($loader.completedCount, $loader.loadingCount) ? 'danger' : 'info'}" role="progressbar"
            style="width: {progress($loader.completedCount, $loader.loadingCount)}%"></div>
</div>


<style lang="stylus" global>
    .pageProgress
        opacity 0
        height 4px
        margin: 0;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        transition opacity cubic-bezier(0, 0.52, 1, 1) 1s   /* fast fade in slow fade out */

        &.loading
            opacity 1

        .progress-bar
            height 4px
            border-radius 0
            width 0
            transition width 500mS
</style>