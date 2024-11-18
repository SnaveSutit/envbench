# envbench

A simple CLI tool that helps you make and manage exclusive Blockbench environments.

## Installation

### Requirements

-   [Node.js](https://nodejs.org/en/download/prebuilt-installer)

### Install

1. Open a terminal, on windows you can use `cmd` or `powershell`.
2. Run the following command in the terminal:

```bash
npm i -g envbench
```

## Usage

```bash
envbench [command] [options]
```

Running `envbench` without any arguments will show help information.

## Commands

-   `--version | -v` - Displays the version of envbench
-   `--list | -l` - Lists all environments
-   `--create | -c` - Creates a new environment
-   `--start | -s` - Starts an environment by name
-   `--remove | -r` - Removes an environment
-   `--menu | -m` - Opens a menu to select an environment
-   `--rename | -n` - Renames an environment
