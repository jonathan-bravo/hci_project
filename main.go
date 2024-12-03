package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"

	// "os/user"
	// "path/filepath"
	// "strconv"
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
	http.HandleFunc("/generate-snakefile", handleGenerateSnakemake)

	http.HandleFunc("/download-snakefile", handleDownloadSnakemake)

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

func handleGenerateSnakemake(w http.ResponseWriter, r *http.Request) {
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
	response := map[string]string{
		"status":           "success",
		"message":          "DAG data received",
		"snakemakeContent": snakemakeContent,
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func handleDownloadSnakemake(w http.ResponseWriter, r *http.Request) {
	filePath := "./Snakefile" // Update to the actual file path
	snakemakeContent, err := os.ReadFile(filePath)
	if err != nil {
		fmt.Printf("Error reading file: %v\n", err)
		http.Error(w, "Snakefile does not exist", http.StatusNotFound)
		return
	}
	fmt.Printf("Read Snakemake Content: %s\n", snakemakeContent)
	w.Header().Set("Content-Type", "application/octet-stream")
	w.Header().Set("Content-Disposition", "attachment; filename=Snakefile")
	w.Write([]byte(snakemakeContent))
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
		{Path: "INPUTS/Reference Fasta", Type: "blob"},
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
	idToIndex := make(map[string]int)
	for index, node := range dagNodes {
		idToIndex[node.Id] = index
	}
	var content strings.Builder
	content.WriteString("# Snakemake Wrapper Generated File\n\n")

	// fmt.Println(dagNodes)
	ruleNameCount := make(map[string]int)

	for _, node := range dagNodes {
		// fmt.Println(index)
		if strings.Contains(node.Path, "INPUTS") {
			// if strings.Contains(node.Path, "Reference") {
			// 	content.WriteString(fmt.Sprintf("REFERENCE = %s\n\n", node.Outputs))
			// } else {
			// 	content.WriteString(fmt.Sprintf("INPUT = %s\n\n", node.Outputs))
			// }
			continue //Pure input nodes dont need a rule
		}

		// strings.ReplaceAll(node.Name, " \u2193", "")

		// if strings.Contains(node.Name, "\u2193") {
		// 	fmt.Println(node.Name[:len(node.Name)-2])
		// }

		// ruleName := strings.ReplaceAll(node.Name, " \u2193", "")
		node.Path = strings.ReplaceAll(strings.ReplaceAll(node.Path, "  \u2193", ""),"  \u2191", "" )
		ruleName := node.Name
		if count, exists := ruleNameCount[node.Name]; exists {
			ruleName = fmt.Sprintf("%s_%d", node.Name, count+1)
			ruleNameCount[node.Name] = count + 1
		} else {
			ruleNameCount[node.Name] = 1
		}

		content.WriteString(fmt.Sprintf("rule %s:\n", ruleName))

		content.WriteString("    input:\n")
		if len(node.DependsOn) > 0 {
			for _, dep := range node.DependsOn {
				index, exists := idToIndex[dep]
				if exists {
					content.WriteString(fmt.Sprintf("        %s,\n", dagNodes[index].Outputs))
				} else {
					content.WriteString(fmt.Sprintf("        # Missing dependency: %s\n", dep))
				}
			}
		}

		content.WriteString(fmt.Sprintf("    output:\n        %s,\n", node.Outputs))
		content.WriteString(fmt.Sprintf("    params:\n        \"%s\"\n", node.Params))
		content.WriteString(fmt.Sprintf("    threads: %s\n", node.Threads))
		content.WriteString(fmt.Sprintf("    wrapper:\n        \"%s\"\n\n", node.Path))
	}
	return content.String()
}

// Writes out the snakemake string to a file
// func saveSnakemakeFile(w http.ResponseWriter, content string) error {
// 	usr, err := user.Current()
// 	if err != nil {
// 		http.Error(w, "Unable to determine user's desktop path", http.StatusInternalServerError)
// 		return fmt.Errorf("unable to determine user's desktop path: %v", err)
// 	}
// 	desktopPath := filepath.Join(usr.HomeDir, "Desktop", "Snakefile")

// 	// Write the file to the user's desktop
// 	err = os.WriteFile(desktopPath, []byte(content), 0644)
// 	if err != nil {
// 		http.Error(w, "Unable to write Snakefile to desktop", http.StatusInternalServerError)
// 		return fmt.Errorf("could not write Snakemake file: %v", err)
// 	}

// 	// Serve the file as a downloadable attachment
// 	w.Header().Set("Content-Type", "application/octet-stream")
// 	w.Header().Set("Content-Disposition", "attachment; filename=Snakefile")
// 	w.Write([]byte(content))

// 	return nil
// }

// Writes out the snakemake string to a file
func saveSnakemakeFile(content string) error {
	filePath := "./Snakefile"
	err := os.WriteFile(filePath, []byte(content), 0644)
	if err != nil {
		return fmt.Errorf("could not write Snakemake file: %v", err)
	}
	return nil
}
