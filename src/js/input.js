const debug = true;

import '../css/core.css';
import '../css/input.css';



// create delegated event listeners on body element
['keydown', 'keyup', 'cut', 'paste', 'change'].forEach(eventType => {
    document.querySelector('body').addEventListener(eventType, inputChangeHandler);
});



// event handler
function inputChangeHandler(event) {
    if (debug) console.debug(`input changed to "${event.target.value}" on ${event.type}`);

    let parent = event.target.parentElement;
    let container;
    let input;

    if (event.target.nodeName === 'INPUT' && parent.classList.contains('web-component')) {
        input = event.target;
    }
    else if (event.target.nodeName === 'LABEL' && parent.classList.contains('web-component')) {
        container = parent;
        input = container.querySelector('input');
    }
    else if (event.target.classList.contains('web-component')) {
        container = event.target;
        input = container.querySelector('input');
    }
    else
        return;

    const value = input.value;
    if (value)
        input.classList.add('active');
    else
        input.classList.remove('active');

    if (event.type === 'change') {
        const dataId = input.getAttribute('data-id');
        if (dataId) {
            input.classList.add('dirty');
            import(/* webpackChunkName: "api" */ './api').then(api => {
                api.update(dataId, value).then(response => {
                    if (response.status === 'success') {
                        input.classList.remove('dirty');
                    } else {

                    }
                });
            });
        }

    }

}


function initInputs() {
    document.querySelectorAll('.web-component input').forEach(input => {
        if (input.value)
            input.classList.add('active');
        else
            input.classList.remove('active');
    });
}



initInputs();