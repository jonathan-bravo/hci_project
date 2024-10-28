package main

import (
	"encoding/json"
	"log"
	"net/http"
	"strings"
)

var ignoreList = []string{
	".yaml",
	".py",
	".R",
	".txt",
	".yml",
	".md",
	".git",
	".sonarcloud.properties",
	"test",
	"docs",
	// Add more files or directories to ignore
}

func shouldIgnore(path string) bool {
	for _, ignore := range ignoreList {
		// Ignore specific files
		if strings.Contains(path, ignore) {
			return true
		}
	}
	return false
}

func flattenTree(node *Node) {
	// Flatten all child nodes first
	for i := range node.Children {
		flattenTree(&node.Children[i])
	}

	// Now attempt to flatten this node
	for {
		if node.Type == "dir" && len(node.Children) == 1 && node.Children[0].Type == "dir" {
			child := &node.Children[0]
			node.Name = node.Name + "/" + child.Name
			node.Path = child.Path
			node.Children = child.Children
		} else {
			break
		}
	}
}

type Node struct {
	Name     string `json:"name"`
	Path     string `json:"path"`
	Type     string `json:"type"` // "file" or "dir"
	Children []Node `json:"children,omitempty"`
}

func main() {
	fs := http.FileServer(http.Dir("./static"))
	http.Handle("/", fs)

	http.HandleFunc("/wrappers", wrappersHandler)
	//http.HandleFunc("/", indexHandler)
	log.Println("Server started on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}

func indexHandler(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, "index.html")
}

func wrappersHandler(w http.ResponseWriter, r *http.Request) {
	entries, err := getTree("master")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	staticInputs := []TreeEntry{
		{Path: "INPUTS/Single Fasta", Type: "blob"},
		{Path: "INPUTS/Single Fastq", Type: "blob"},
		{Path: "INPUTS/Paired End Fasta", Type: "blob"},
		{Path: "INPUTS/Paired End Fastq", Type: "blob"},
	}

	// Prepend staticInputs to entries
	entries = append(staticInputs, entries...)

	// fmt.Print(entries)

	tree := buildTree(entries)
	flattenTree(&tree)
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	json.NewEncoder(w).Encode(tree)
}

type TreeEntry struct {
	Path string `json:"path"`
	Type string `json:"type"` // "blob" or "tree"
}

func getTree(ref string) ([]TreeEntry, error) {
	url := "https://api.github.com/repos/snakemake/snakemake-wrappers/git/trees/" + ref + "?recursive=1"
	resp, err := http.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var result struct {
		Tree []TreeEntry `json:"tree"`
	}
	err = json.NewDecoder(resp.Body).Decode(&result)
	if err != nil {
		return nil, err
	}
	return result.Tree, nil
}

func buildTree(entries []TreeEntry) Node {
	root := Node{Name: "wrappers", Type: "dir", Children: []Node{}}
	for _, entry := range entries {
		// fmt.Println(entry.Path)
		if shouldIgnore(entry.Path) {
			continue // Skip this entry
		}

		parts := strings.Split(entry.Path, "/")
		//fmt.Println(root)
		current := &root
		for i, part := range parts {
			found := false
			for j := range current.Children {
				if current.Children[j].Name == part {
					current = &current.Children[j]
					found = true
					break
				}
			}
			if !found {
				newNode := Node{
					Name: part,
					Path: strings.Join(parts[:i+1], "/"),
					Type: "dir",
				}
				if i == len(parts)-1 && entry.Type == "blob" {
					newNode.Type = "file"
				}
				current.Children = append(current.Children, newNode)
				current = &current.Children[len(current.Children)-1]
			}
		}
	}
	return root
}
