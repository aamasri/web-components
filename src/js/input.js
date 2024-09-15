const debug = false;

import '../css/core.css';
import '../css/input.css';
import { update } from './api.js';


const body = document.querySelector('body');

// create delegated event listeners on body element

[ 'keyup', 'cut', 'paste', 'change', 'blur' ].forEach(eventType => {
    body.addEventListener(eventType, inputChangeHandler);
});



/**
 * Input element (change) event handler.
 *
 * @returns {void}
 **/
async function inputChangeHandler(event) {
    const webComponent = event.target.closest('.web-component');
    if (!webComponent)
        return;

    event.preventDefault();
    event.stopPropagation();

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

    if (debug) console.debug(`input changed to "${event.target.value}" on ${event.type}`);

    // handle dynamic label/placeholder
    const value = input.value;
    if (value)
        input.classList.add('active');
    else
        input.classList.remove('active');

    let isSubmit = (form) ? event.key === 'Enter': ['Enter', 'Tab'].includes(event.key) || [ 'change', 'blur' ].includes(event.type);
    const valid = await validate(input, isSubmit);

    if (isSubmit && valid) {
        const dataId = input.getAttribute('data-id');
        if (debug) console.debug(`  submitting input[data-id="${dataId}"]`);
        const dataProps = dataId.split('-');

        if (dataProps.length === 2) {
            const entity = dataProps[0];
            const field = dataProps[1];
            const patch = {};
            patch[field] = value;

            if (debug) console.debug(`  submitting ${entity}:`, patch);

            input.classList.add('dirty');

            //const api = await import(/* webpackChunkName: "api" */ './api');
            const response = await update(entity, patch);
            if (response.status === 'success') {
                input.classList.remove('dirty');
            } else {
                console.error(`  api operation failed`);
            }
        } else
            console.error(`  handling submission for ${dataId} failed (input[data-id] format should be entity-field)`);
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