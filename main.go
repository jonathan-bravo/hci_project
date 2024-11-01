package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"

	"golang.ngrok.com/ngrok"
	"golang.ngrok.com/ngrok/config"
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

type LineConnection struct {
	Button1 string `json:"button1"`
	Button2 string `json:"button2"`
	LineID  string `json:"lineId"`
}

// New struct for storing DAG information to handle more complicated user input down the line.
type DAGNode struct {
	Id        string   `json:"id"`
	Name      string   `json:"name"`
	Inputs    string   `json:"inputs"`
	Outputs   string   `json:"outputs"`
	Path      string   `json:"path"`
	Params    string   `json:"params"`
	Threads   string   `json:"threads"`
	DependsOn []string `json:"depends_on"`
}

func main() {
	fs := http.FileServer(http.Dir("./static"))
	http.Handle("/", fs)

	// README.md handler
	http.HandleFunc("/readme", readmeHandler)

	// Handle the POST request
	http.HandleFunc("/your-endpoint", handlePostRequest)

	http.HandleFunc("/wrappers", wrappersHandler)

	if err := run(context.Background()); err != nil {
		log.Fatal(err)
	}
	//http.HandleFunc("/", indexHandler)
	//log.Println("Server started on :8080")
	//log.Fatal(http.ListenAndServe(":8080", nil))
}

func run(ctx context.Context) error {
	listener, err := ngrok.Listen(ctx,
		config.HTTPEndpoint(),
		ngrok.WithAuthtokenFromEnv(),
	)
	if err != nil {
		return err
	}

	log.Println("Ingress established at:", listener.URL())

	return http.Serve(listener, nil)
}

// func handler(w http.ResponseWriter, r *http.Request) {
// 	fmt.Fprintln(w, "Hello from ngrok-go!")
// }

func readmeHandler(w http.ResponseWriter, r *http.Request) {
	content, err := os.ReadFile("README.md")
	if err != nil {
		http.Error(w, "Failed to read README file", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "text/plain")
	w.Write(content)
}

func handlePostRequest(w http.ResponseWriter, r *http.Request) {
	// Check if the request method is POST
	if r.Method != http.MethodPost {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

	// Read the request body
	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Failed to read request body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	// Parse the JSON array into a slice of structs
	// var lineConnections []LineConnection
	var dagNodes []DAGNode
	err = json.Unmarshal(body, &dagNodes)
	if err != nil {
		http.Error(w, "Invalid JSON data", http.StatusBadRequest)
		return
	}

	fmt.Printf("Received Dag Nodes: %+v\n", dagNodes)

	//Generate Snakemake content
	snakemakeContent := generateSmk(dagNodes)

	fmt.Printf("Generated Snakemake Content: %s\n", snakemakeContent)

	//Output .smk file
	err = saveSnakemakeFile(snakemakeContent)
	if err != nil {
		http.Error(w, "Failed to save Snakemake file", http.StatusInternalServerError)
		return
	}

	// Send a JSON response back to the client
	response := map[string]string{"status": "success", "message": "DAG data received"}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// func indexHandler(w http.ResponseWriter, r *http.Request) {
// 	http.ServeFile(w, r, "index.html")
// }

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
		if shouldIgnore(entry.Path) {
			continue // Skip this entry
		}

		parts := strings.Split(entry.Path, "/")
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

// Generates the snakemake file content as a string, need to update to add output from dependencies to input section of rule
// Additionally check for correctness
func generateSmk(dagNodes []DAGNode) string {
	var content strings.Builder
	content.WriteString("# Snakemake Wrapper Generated File\n\n")

	for _, node := range dagNodes {
		if strings.Contains(node.Path, "INPUTS") {
			continue //Pure input nodes dont need a rule
		}
		content.WriteString(fmt.Sprintf("rule %s:\n", node.Name)) // Print rule header/name

		content.WriteString(fmt.Sprintf("	input:\n		\"%s\"", node.Inputs))
		if len(node.DependsOn) > 0 {
			for _, dep := range node.DependsOn {
				content.WriteString(fmt.Sprintf(",\n		\"Node ID: %s's outputs\"", dep))
			}
		}
		content.WriteString(fmt.Sprintf("\n	output:\n		\"%s\"", node.Outputs))
		content.WriteString(fmt.Sprintf("\n	params:\n		\"%s\"", node.Params))
		content.WriteString(fmt.Sprintf("\n	threads: %s", node.Threads))
		content.WriteString(fmt.Sprintf("\n	wrapper:\n		\"%s\"\n\n", node.Path))
	}
	return content.String()
}

// Writes out the snakemake string to a file
func saveSnakemakeFile(content string) error {
	filePath := "./Snakefile"
	err := os.WriteFile(filePath, []byte(content), 0644)
	if err != nil {
		return fmt.Errorf("could not write Snakemake file: %v", err)
	}
	return nil
}
