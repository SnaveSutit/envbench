<div align=center>
    <picture>
        <img src="assets/envbench-logo.svg" alt="Envbench Logo" width="128" height="128">
    </picture>
    <summary>
        <h1>Envbench</h1>
    </summary>
    <p>Envbench is a powerful command-line tool that provides a simple interface for managing multiple Blockbench environments.</p>
</div>

---

# 💡 Why Use Envbench?

There are several reasons you might want to have multiple environments:

-   Keep work and personal projects separate to prevent NDA risks when opening Blockbench.
-   Maintain clean environments for developing and testing plugins.
-   Have multiple versions of Blockbench installed without conflicts.
-   Save different instances for different projects, ensuring your start menu only displays relevant models.

# 📦 Installation

### ⚠️ Requirements

-   [Node.js](https://nodejs.org/en/download/prebuilt-installer)

### 🪜 Steps

1. Open a terminal (`cmd` or `PowerShell` on Windows).
2. Run the following command:
    ```bash
    npm i -g envbench
    ```
3. Verify the installation by running:
    ```bash
    envbench
    ```
    If installed correctly, you should see Envbench's help information.

# ⌨️ Getting Started

### Usage

```bash
envbench <command> [options]
```

> [!TIP]
> Running `envbench` without arguments will list all available commands.

### Creating a new environment

```bash
envbench create my-environment
```

### Starting your environment

```bash
envbench start my-environment
```
