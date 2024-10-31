function clearSearchBar() {
    const searchBar = document.getElementById('search-bar');
    const treeContainer = document.getElementById('tree');

    searchBar.value = '';

    filterListItems(treeContainer, '');
}