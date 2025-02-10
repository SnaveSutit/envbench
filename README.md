# envbench

Envbench provides a simple interface for making and managing multiple separate Blockbench environments.

There are many reasons you might want to use multiple environments, such as:

-   You want to keep your work and personal projects separate to avoid NDA hazards whenever you open Blockbench.
-   You want clean environments for developing and testing plugins.
-   You want to keep your environments organized and easy to access.
-   You want to save completely different instances for different projects, so your start menu only contains the models you're currently working on.

## Installation

### Requirements

-   [Node.js](https://nodejs.org/en/download/prebuilt-installer)

### Install

1. Open a terminal, on windows you can use `cmd` or `powershell`.
2. Run the following command in the terminal:
    ```bash
    npm i -g envbench
    ```
3. To verify the installation, run `envbench` in the terminal. You should see the help information for EnvBench as shown below.

## Usage

```bash
envbench <command> [options]
```

Running `envbench` without any arguments will show help information.

![An example of the help command](/assets/basic-usage.png)
