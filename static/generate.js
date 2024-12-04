function handleGenerateClick() {
    // const generateButton = document.getElementById('generate-button');
    const snakemakeDisplay = document.getElementById('snakemake-display');

    // Ensure the browser registers the class addition
    // generateButton.classList.add('pressed');

    setTimeout(() => {
        // generateButton.classList.remove('pressed');

        // if (lines.length === 0) {
        //     setTimeout(() => {
        //         alert('No connections to generate output from.');
        //     }, 50); // Slight delay to prevent blocking CSS animation
        //     return;
        // }

        const nodes = [...canvasOverlay.querySelectorAll('button')].map(button => ({
            id: button.getAttribute('id'),
            name: button.textContent,
            path: button.getAttribute('data-parents'),
            inputs: button.getAttribute('inputs'),
            outputs: button.getAttribute('outputs'),
            params: button.getAttribute('params'),
            threads: button.getAttribute('threads'),
            depends_on: []
        }));

        const connections = lines.map(({ button1, button2 }) => ({
            source: button1.getAttribute('id'),
            target: button2.getAttribute('id')
        }));

        connections.forEach(({ source, target }) => {
            const targetNode = nodes.find(node => node.id === target);
            if (targetNode) {
                targetNode.depends_on.push(source);
            }
        });

        fetch('/generate-snakefile', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(nodes),
        })
            .then(response => response.json())
            .then(result => {
                console.log('Server response:', result);

                // Update textarea or show fallback message
                if (result.snakemakeContent) {
                    snakemakeDisplay.value = result.snakemakeContent;
                } else {
                    snakemakeDisplay.value = 'No Snakemake content received from the server.';
                }

                showTab('snakemake');
            })
            .catch(error => {
                console.error('Error fetching Snakemake file:', error);
                snakemakeDisplay.value = 'Error generating Snakemake file.';
            });
            
    }, 100);
}

function downloadSnakemake() {
    fetch('/download-snakefile')
        .then(response => {
            if (!response.ok) {
                throw new Error('Snakefile not found. Please generate it first.');
            }
            return response.blob();
        })
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = 'Snakefile';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        })
        .catch(error => {
            console.error('Error downloading Snakefile:', error);
            alert(error.message);
        });
}