import * as PACKAGE from '../package.json'
import { terminal as term } from 'terminal-kit'
import * as fs from 'fs/promises'
import * as pathjs from 'path'
import subprocess from 'child_process'
import { parseArgs } from 'util'
import { exists, readdirSafe, replaceEnv } from './util'

const BLOCKBENCH_PATH = pathjs.normalize(
	replaceEnv('%LOCALAPPDATA%/Programs/Blockbench/Blockbench.exe')
)
const ENVIRONMENT_STORAGE = pathjs.normalize(replaceEnv('%APPDATA%/EnvBench'))
const ENVIRONMENT_FILE = '.envbench.json'

interface EnvironmentFile {
	name: string
	version: string
}

interface Option {
	type: 'string' | 'boolean'
	description: string
	short?: string
}

const OPTIONS: Record<string, Option> = {
	version: {
		type: 'boolean',
		description: 'Display version',
		short: 'v',
	},
	list: {
		type: 'boolean',
		description: 'Lists all environments',
		short: 'l',
	},
	create: {
		type: 'string',
		description: 'Creates a new environment',
		short: 'c',
	},
	start: {
		type: 'string',
		description: 'Starts an environment by name',
		short: 's',
	},
	remove: {
		type: 'string',
		description: 'Removes an environment',
		short: 'r',
	},
	menu: {
		type: 'boolean',
		description: 'Opens a menu to select an environment',
		short: 'm',
	},
	rename: {
		type: 'string',
		description: 'Renames an environment',
		short: 'n',
	},
}

function termPrefix() {
	term.gray('[').blue('EnvBench').gray('] ')
}

async function startBlockbench(env: string) {
	return new Promise<void>((resolve, reject) => {
		subprocess
			.spawn(BLOCKBENCH_PATH, ['--userData', env], { shell: true })
			.on('error', (err) => {
				reject(err)
			})
			.on('exit', (code) => {
				if (code === 0) {
					resolve()
				} else {
					reject(new Error('Blockbench exited with code: ' + code))
				}
			})
	})
}

async function assertEnvironmentStorage() {
	if (!(await exists(ENVIRONMENT_STORAGE))) {
		await fs.mkdir(ENVIRONMENT_STORAGE, { recursive: true }).catch((err) => {
			term.red(err)
			process.exit(1)
		})
	}
}

async function list() {
	const folders = await readdirSafe(ENVIRONMENT_STORAGE)
	if (!folders || folders.length === 0) {
		termPrefix()
		term.red('No environments found!\n')
		termPrefix()
		term.yellow('Create a new environment with the "--create <name>" command.\n')
		process.exit(0)
	}

	termPrefix()
	term.green('Environments:\n')
	for (const folder of folders) {
		termPrefix()
		if (!(await exists(pathjs.join(ENVIRONMENT_STORAGE, folder, ENVIRONMENT_FILE)))) {
			term.yellow('- ', folder, ' (Missing environment file!)\n')
			continue
		}
		term('- ', folder, '\n')
	}
}

async function create(name: string) {
	await assertEnvironmentStorage()
	const folder = pathjs.join(ENVIRONMENT_STORAGE, name)
	termPrefix()
	term.yellow(`Create a new environment named: '${name}'?\n`)
	const result = await term.yesOrNo({ yes: ['y', 'ENTER'], no: ['n'] }).promise
	if (!result) {
		termPrefix()
		term.red('Cancelled!\n')
		process.exit(0)
	}
	termPrefix()
	term.green('Creating new environment...\n')
	await fs.mkdir(folder, { recursive: true }).catch((err) => {
		termPrefix()
		term.red(`\nFailed to create environment folder "${folder}": ${err.message}\n`)
		process.exit(1)
	})
	const envFile: EnvironmentFile = {
		name,
		version: PACKAGE.version,
	}
	await fs
		.writeFile(pathjs.join(folder, ENVIRONMENT_FILE), JSON.stringify(envFile), 'utf8')
		.catch(async (err) => {
			termPrefix()
			term.red(`\nFailed to create environment file: ${err.message}\n`)
			await fs.rmdir(folder).catch(() => {})
			process.exit(1)
		})
	termPrefix()
	term.green(`Environment created!\n`)
	termPrefix()
	term.yellow(`Run 'envbench --start ${name}' to launch Blockbench in this environment.\n`)
}

async function start(name: string) {
	await assertEnvironmentStorage()
	const folder = pathjs.join(ENVIRONMENT_STORAGE, name)
	if (!(await exists(folder))) {
		termPrefix()
		term.red(`Environment "${name}" not found!\n`)
		process.exit(1)
	}
	const envFile = await fs
		.readFile(pathjs.join(folder, ENVIRONMENT_FILE), 'utf8')
		.then((data) => JSON.parse(data) as EnvironmentFile)
		.catch((err) => {
			termPrefix()
			term.red(`Failed to read environment file: ${err.message}\n`)
			process.exit(1)
		})
	termPrefix()
	term.green(`Launching Blockbench environment '${name}'...\n`)
	await startBlockbench(folder)
	termPrefix()
	term.green('Blockbench closed!\n')
}

async function remove(name: string) {
	await assertEnvironmentStorage()
	const folder = pathjs.join(ENVIRONMENT_STORAGE, name)
	if (!(await exists(folder))) {
		termPrefix()
		term.red(`Environment "${name}" not found!\n`)
		process.exit(1)
	}
	termPrefix()
	term.red(`Remove environment "${name}"? It will be gone forever. (A long time!)\n`)
	const result = await term.yesOrNo({ yes: ['y', 'ENTER'], no: ['n'] }).promise
	if (!result) {
		termPrefix()
		term.red('Cancelled!\n')
		process.exit(0)
	}
	termPrefix()
	term.green('Removing environment...\n')
	await fs.rm(folder, { recursive: true }).catch((err) => {
		termPrefix()
		term.red(`Failed to remove environment: ${err.message}\n`)
		process.exit(1)
	})
	termPrefix()
	term.green('Environment removed!\n')
}

async function menu() {
	await assertEnvironmentStorage()
	const folders = await readdirSafe(ENVIRONMENT_STORAGE)
	if (!folders || folders.length === 0) {
		termPrefix()
		term.red('No environments found!\n')
		termPrefix()
		term.yellow('Create a new environment with the "--create <name>" command.\n')
		process.exit(0)
	}
	termPrefix()
	term.green(
		'Select an environment: (Use arrow keys to navigate, ENTER to select, ESC to cancel.)'
	)
	const result = await term.singleColumnMenu(folders, {
		cancelable: true,
		leftPadding: '- ',
		extraLines: 1,
	}).promise
	if (result.canceled) {
		termPrefix()
		term.red('Cancelled!\n')
		process.exit(0)
	}
	await start(result.selectedText)
}

async function rename(oldName: string) {
	termPrefix()
	term.yellow(`Preparing to rename environment "${oldName}"...\n`)
	termPrefix()
	term.bgRed('[ATTENTION]')
		.red(` Make sure to `)
		.red.underline('close Blockbench')
		.red(` before renaming an environment!\n`)
	await assertEnvironmentStorage()
	const oldFolder = pathjs.join(ENVIRONMENT_STORAGE, oldName)
	if (!(await exists(oldFolder))) {
		termPrefix()
		term.red(`Environment "${oldName}" not found!\n`)
		process.exit(1)
	}
	termPrefix()
	term.green(`Enter new name for environment "${oldName}": `)
	const newName = await term.inputField({
		cancelable: true,
	}).promise
	term('\n')
	if (!newName) {
		termPrefix()
		term.red('Cancelled!\n')
		process.exit(0)
	}
	const newFolder = pathjs.join(ENVIRONMENT_STORAGE, newName)
	if (await exists(newFolder)) {
		termPrefix()
		term.red(`Environment "${newName}" already exists!\n`)
		process.exit(1)
	}
	termPrefix()
	term.yellow(`Rename environment "${oldName}" to "${newName}"?\n`)
	const result = await term.yesOrNo({ yes: ['y', 'ENTER'], no: ['n'] }).promise
	if (!result) {
		termPrefix()
		term.red('Cancelled!\n')
		process.exit(0)
	}
	termPrefix()
	term.green('Renaming environment...\n')
	await fs.rename(oldFolder, newFolder).catch((err) => {
		termPrefix()
		term.red(`Failed to rename environment: ${err.message}\n`)
		process.exit(1)
	})
	termPrefix()
	term.green('Environment renamed!\n')
}

async function main() {
	if (process.platform !== 'win32') {
		termPrefix()
		term.red('EnvBench is only supported on Windows!\n')
		process.exit(1)
	}

	let args: ReturnType<typeof parseArgs>['values']
	try {
		args = parseArgs({
			args: process.argv.slice(2),
			options: OPTIONS,
		}).values
	} catch (err: any) {
		termPrefix()
		term.red(err.message, '\n')
		process.exit(1)
	}

	switch (true) {
		case args.version: {
			termPrefix()
			term.green('v', PACKAGE.version, '\n\n')
			break
		}
		case args.list: {
			await list()
			break
		}
		case !!args.create: {
			await create(args.create as string)
			break
		}
		case !!args.start: {
			await start(args.start as string)
			break
		}
		case !!args.remove: {
			await remove(args.remove as string)
			break
		}
		case args.menu: {
			await menu()
			break
		}
		case !!args.rename: {
			await rename(args.rename as string)
			break
		}
		default: {
			for (const [key, value] of Object.entries(OPTIONS)) {
				termPrefix()
				term.green(
					'--',
					key,
					value.short ? ` | -${value.short}` : '',
					' : ',
					value.description,
					'\n'
				)
			}
			process.exit(1)
		}
	}

	process.exit(0)
}

void main()
