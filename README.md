# google-images-cli

A command-line tool to download images from Bing image search.

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/google-images-cli.git

# Navigate to the project directory
cd google-images-cli

# Install dependencies
npm install

# Link the package globally
npm link
```

## Usage

```bash
google-images -q "search query" [-o output_directory] [-l number_of_images]
```

### Options

- `-q, --query <string>`: Search query (required)
- `-o, --output <directory>`: Output directory (default: current directory)
- `-l, --limit <number>`: Number of images to download (default: 10)

### Examples

```bash
# Download 10 cat images to current directory
google-images -q "cats"

# Download 20 dog images to specific directory
google-images -q "dogs" -o "D:\images\dogs" -l 20
```

## License

MIT
