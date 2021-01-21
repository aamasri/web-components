const debug = true;

import '../css/core.css';
import '../css/input.css';



// create delegated event listeners on body element
['keydown', 'keyup', 'cut', 'paste', 'change', 'blur' ].forEach(eventType => {
    const inputs = document.querySelector('.web-component input');
    document.querySelector('.web-component input').addEventListener(eventType, inputChangeHandler);
});




/**
 * Input element (change) event handler.
 *
 * @returns {void}
 **/
async function inputChangeHandler(event) {
    if (debug) console.debug(`input changed to "${event.target.value}" on ${event.type}`);

    const webComponent = event.target.closest('.web-component');
    const form = webComponent.closest('form');
    let input;

    if (event.target.nodeName === 'INPUT' && webComponent)
        input = event.target;
    else if (event.target.nodeName === 'LABEL' && webComponent)
        input = webComponent.querySelector('input');
    else if (webComponent)
        input = webComponent.querySelector('input');
    else
        return;

    // handle dynamic label/placeholder
    const value = input.value;
    if (value)
        input.classList.add('active');
    else
        input.classList.remove('active');

    let isSubmit = (form) ? event.key === 'Enter': [ 'Enter', 'Escape', 'Tab' ].includes(event.key) || event.type === 'blur';
    if (debug) console.debug(`  treat as submit: ${isSubmit}`);
    const valid = await validate(input, isSubmit);

    if (event.type === 'change' && valid && isSubmit) {
        const dataId = input.getAttribute('data-id');

        if (dataId) {
            input.classList.add('dirty');

            const api = await import(/* webpackChunkName: "api" */ './api');
            const response = await api.update(dataId, value);
            if (response.status === 'success') {
                input.classList.remove('dirty');
            } else {

            }
        }
    }
}



/**
 * Input element (change) event handler.
 * @param {HTMLInputElement} input
 * @param {boolean} showErrorsImmediately

 * @returns {boolean}
 **/
async function validate(input, showErrorsImmediately= true) {
    const validation = await import(/* webpackChunkName: "validation" */ './validation');

    const type = input.getAttribute('data-validation-type') || input.type || false;
    input.value = validation.reformat(type, input.value);
    let valid = validation.isValid(type, input.value);

    if (debug) console.debug(`input "${input}" = ${input.value} is ${valid ? 'valid' : 'NOT valid'}`);

    if (valid) {
        input.classList.remove('is-invalid');

        // cache values for user convenience
        let cacheId = input.getAttribute('data-cache') || false;
        if (cacheId)
            localStorage.setItem(cacheId, input.value);
        else {
            cacheId = input.getAttribute('data-cache-ephemeral') || false;
            if (cacheId)
                sessionStorage.setItem(cacheId, input.value);
        }

    } else {
        if (showErrorsImmediately) {
            let errorMessage;
            if (input.value)
                errorMessage = validation.errorMessages[type] || '';
            else
                errorMessage = input.required ? 'Required' : '';

            if (debug) console.debug(`error in field ${input}: "${errorMessage}"`);

            const parent = input.parentNode;

            if (parent.querySelector('.invalid-feedback'))
                parent.querySelector('.invalid-feedback').innerHTML = errorMessage;
            else {
                const feedback = document.createElement('div');
                feedback.classList.add('invalid-feedback');
                feedback.innerHTML = errorMessage;
                parent.appendChild(feedback);
            }

            input.classList.add('is-invalid');
        }

        return false;
    }

    return true;
}





/**
 * Input element (change) event handler.
 *
 * @returns {void}
 **/
function initInputs() {
    document.querySelectorAll('.web-component input[value]:not([value=""])').forEach(input  => {
        input.classList.add('active');
    });
}



initInputs();