import { writable } from 'svelte/store';

// allows page loading progress bar to be reactive from any module or component
export const loader = writable({ loadingCount: 0, completedCount: 0 });

export function incrementLoadingCount() {
    loader.update(loader => {
        loader.loadingCount++;
        return loader;
    });
}
export function incrementLoadingComplete() {
    loader.update(loader => {
        loader.completedCount++;
        return loader;
    });
}
export function resetLoading() {
    loader.update(() => {
        return { loadingCount: 0, completedCount: 0 };
    });
}