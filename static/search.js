document.addEventListener('DOMContentLoaded', () => {
    const searchBar = document.getElementById('search-bar');
    const treeContainer = document.getElementById('tree');

    searchBar.addEventListener('input', function() {
        const searchText = searchBar.value.toLowerCase();
        filterListItems(treeContainer, searchText);
    });

    const snakemakeDisplay = document.getElementById('snakemake-display');
    if (snakemakeDisplay) {
        snakemakeDisplay.value = 'No Snakemake file generated yet.';
    }
});

function filterListItems(container, searchText) {
    // Get all list items
    const allListItems = container.querySelectorAll('li');
    const allSubLists = container.querySelectorAll('li > ul');
    
    if (!searchText) {
        // When search is cleared:
        // 1. Show all list items
        allListItems.forEach(item => {
            item.style.display = '';
            for (const c of item.children) {
                if (c.tagName === "BUTTON" && !c.classList.contains("draggable-button")) {
                    c.textContent = c.textContent.replace(/[^\x00-\x7F]/g, "")
                    c.disabled = false;
                    if (c.classList.contains("expanded")){
                        c.textContent = c.textContent + "\u2191"
                    } else{
                        c.textContent = c.textContent + "\u2193"
                    }
                }
            }
        });
        // 2. Collapse all sublists
        allSubLists.forEach(ul => {
            ul.style.display = '';
        });
        return;
    }

    // First: Reset visibility of all items
    allListItems.forEach(item => {
        item.style.display = 'none';
    });
    allSubLists.forEach(ul => {
        ul.style.display = 'none';
    });

    // Then: Find and process matches
    allListItems.forEach(item => {
        const label = item.querySelector('.node-label, .draggable-button');
        const itemText = label ? label.textContent.toLowerCase() : '';
        
        if (itemText.includes(searchText)) {
            // Show the matching item
            item.style.display = '';
            
            // Show and expand all parent lists up to the root
            let parent = item.parentElement;
            while (parent) {
                if (parent.tagName === 'UL') {
                    parent.style.display = 'block';
                }
                if (parent.tagName === 'LI') {
                    for (const c of parent.children) {
                        if (c.tagName === "BUTTON") {
                            c.disabled = true;
                            c.textContent = c.textContent.replace(/[^\x00-\x7F]/g, "")
                        }
                    }
                    parent.style.display = '';
                }
                parent = parent.parentElement;
            }
            
            // Show and expand all immediate children
            const childList = item.querySelector(':scope > ul');
            if (childList) {
                childList.style.display = 'block';
                const children = childList.querySelectorAll(':scope > li');
                children.forEach(child => {
                    child.style.display = '';
                });
            }
        }
    });
}

// function filterListItems(container, searchText) {
//     if (!searchText) {
//         // Show all items if search is empty
//         container.querySelectorAll('li').forEach(item => {
//             item.style.display = '';
//         });
//         return;
//     }

//     // First pass: Mark matching items and their ancestors
//     const matches = new Set();
//     container.querySelectorAll('li').forEach(item => {
//         const label = item.querySelector('.node-label, .draggable-button');
//         const itemText = label ? label.textContent.toLowerCase() : '';
        
//         if (itemText.includes(searchText)) {
//             // Mark this item and all its ancestors
//             let current = item;
//             while (current && current.tagName === 'LI') {
//                 matches.add(current);
//                 current = current.parentElement.closest('li');
//             }
            
//             // Mark all direct children of matching items
//             item.querySelectorAll(':scope > ul > li').forEach(child => {
//                 matches.add(child);
//             });
//         }
//     });

//     // Second pass: Show/hide items based on matches
//     container.querySelectorAll('li').forEach(item => {
//         item.style.display = matches.has(item) ? '' : 'none';
//     });
// }
