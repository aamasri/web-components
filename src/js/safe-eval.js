export default function safeEval(code) {
    // Check that code is a string to prevent potential vulnerabilities
    if (typeof code !== 'string') {
        throw new Error('Code must be a string');
    }

    try {
        // Create and invoke a new function to evaluate the code
        return new Function(`"use strict"; return (${code});`)();
    } catch (error) {
        console.error('Error evaluating code:', error);
        return null;
    }
};