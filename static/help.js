function showHelp() {
    const helpButton = document.getElementById('help-button');
    // Ensure the browser registers the class addition
    helpButton.classList.add('pressed');

    // Use a setTimeout to create a delay before removing the pressed class
    setTimeout(() => {
        helpButton.classList.remove('pressed');
        
        setTimeout(() => {
            alert('Help');
        }, 50);
    }, 100); // Keep this delay in sync with the CSS transition duration
}