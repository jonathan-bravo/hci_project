function showHelp() {
    const markedInstance = new marked.Marked();
    const helpButton = document.getElementById('help-button');
    helpButton.classList.add('pressed');

    setTimeout(() => {
        helpButton.classList.remove('pressed');

        // Fetch the README from the /readme endpoint
        fetch('/readme')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to load the README file');
                }
                return response.text();
            })
            .then(data => {
                let htmlContent = markedInstance.parse(data);

                // Remove 'static/' from image paths
                htmlContent = htmlContent.replace(/src="static\//g, 'src="');
                
                // Parse and display the Markdown content
                const helpContent = document.getElementById('help-content');
                helpContent.innerHTML = htmlContent;

                // Show the modal
                const helpPopup = document.getElementById('help-popup');
                helpPopup.classList.remove('hidden');
            })
            .catch(error => {
                alert('Error: ' + error.message);
            });
    }, 100);
}

// Function to close the help popup
function closeHelpPopup() {
    const helpPopup = document.getElementById('help-popup');
    helpPopup.classList.add('hidden');
}