fetch('/wrappers')
    .then(response => response.json())
    .then(data => {
        const treeContainer = document.getElementById('tree');

        // Skip the "Wrappers" root and process its children
        if (data.name.toLowerCase() === 'wrappers' && data.children) {
            data.children.forEach(child => {
                const li = createList(child);
                treeContainer.appendChild(li);
            });
        } else {
            // If "Wrappers" is not the root, process normally
            const ul = document.createElement('ul');
            ul.appendChild(createList(data));
            treeContainer.appendChild(ul);
        }

        function createList(node) {
            const li = document.createElement('li');
            li.classList.add(node.type, 'my-1', 'relative');

            // Toggle button for collapsing if node has children
            if (node.children && node.children.length > 0) {
                const toggleButton = document.createElement('button');
                toggleButton.textContent = '+';
                toggleButton.className = 'toggle-button mr-2 text-lg text-gray-600 focus:outline-none';
                toggleButton.onclick = function() {
                    const childList = li.querySelector('ul');
                    if (childList) {
                        childList.classList.toggle('hidden');
                        toggleButton.textContent = childList.classList.contains('hidden') ? '+' : '−';
                    }
                };
                li.appendChild(toggleButton);

                // Add label for non-leaf nodes
                const label = document.createElement('span');
                label.textContent = node.name;
                label.className = 'node-label';
                li.appendChild(label);
            } else {
                // Add button only for leaf nodes
                const button = document.createElement('button');
                button.textContent = node.name;
                button.className = 'draggable-button px-4 py-2 bg-blue-500 text-white rounded cursor-move';
                button.setAttribute('draggable', true);

                // Set drag behavior
                button.ondragstart = function(event) {
                    event.dataTransfer.setData('text', node.name);
                };

                li.appendChild(button);
            }

            // Add children if present
            if (node.children && node.children.length > 0) {
                const ul = document.createElement('ul');
                ul.classList.add('pl-4', 'list-none', 'hidden'); // Initially hidden
                node.children.forEach(child => {
                    ul.appendChild(createList(child));
                });
                li.appendChild(ul);
            }

            return li;
        }

    })
    .catch(error => console.error(error));