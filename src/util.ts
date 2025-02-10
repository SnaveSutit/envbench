import chalk from 'chalk'
import * as subprocess from 'child_process'
import * as fs from 'fs/promises'
import * as pathjs from 'path'
import { terminal as $, type Terminal } from 'terminal-kit'
import { version } from '../package.json'
import { NamedBlockbenchVersion } from './blockbenchVersionManager'

export async function updateOnlineStatus() {
	process.env.IS_ONLINE = await fetch('https://api.github.com')
		.then(() => 'TRUE')
		.catch(() => 'FALSE')
}

export function isOnline() {
	return process.env.IS_ONLINE
}

export function log() {
	return $.gray('[').blue('EnvBench').gray('] ')
}

/**
 * Expands environment variables in a string.
 * @example
 * expandEnv('%APPDATA%/EnvBench') // C:\Users\<username>\AppData\Roaming\EnvBench
 */
export function expandEnv(str: string): string {
	return str.replace(/%([^%]+)%/g, (original, matched) => {
		const r = process.env[matched]
		return r ?? ''
	})
}

/**
 * Checks if a file or directory exists.
 */
export async function exists(path: string): Promise<boolean> {
	return await fs
		.access(path)
		.then(() => true)
		.catch(() => false)
}

/**
 * A wrapper for `fs.readdir` that returns `undefined` if an error occurs.
 */
export async function readdirSafe(path: string): Promise<string[] | undefined> {
	return await fs.readdir(path).catch(() => undefined)
}

export async function assertStorageFolder() {
	if (!(await exists(process.env.ENVBENCH_STORAGE_FOLDER))) {
		await fs.mkdir(process.env.ENVBENCH_STORAGE_FOLDER, { recursive: true }).catch(err => {
			$.red(err)
			process.exit(1)
		})
	}
}

export async function environmentExists(
	name: string,
	showWarning = false
): Promise<'env' | 'folder' | false> {
	const folderExists = await exists(pathjs.join(process.env.ENVBENCH_STORAGE_FOLDER, name))
	if (!folderExists) {
		if (showWarning) {
			log().yellow('Environment "', name, '" does not exist!\n')
		}
		return false
	}
	const environmentFileExists = await exists(
		pathjs.join(
			process.env.ENVBENCH_STORAGE_FOLDER,
			name,
			process.env.ENVBENCH_ENVIRONMENT_FILE
		)
	)
	if (folderExists && !environmentFileExists) {
		if (showWarning) {
			log().yellow('Environment "', name, '" is missing an environment file!\n')
		}
		return 'folder'
	} else if (!environmentFileExists) {
		if (showWarning) {
			log().yellow('Environment "', name, '" does not exist!\n')
		}
		return false
	}
	return 'env'
}

export async function confirmPrompt() {
	return await $.yesOrNo({
		yes: ['y', 'ENTER'],
		no: ['n', 'ESCAPE'],
	}).promise
}

export async function startEnvironment(userDataFolder: string, args: string[] = []) {
	if (args.includes('--userData')) {
		console.error(chalk.red('Cannot pass --userData as an Environment launch argument!'))
		process.exit(1)
	}
	args.push('--userData', userDataFolder)

	return new Promise<void>((resolve, reject) => {
		subprocess
			.spawn(process.env.BLOCKBENCH_PATH, args, { shell: true })
			.on('error', err => {
				log().red('Failed to launch Blockbench:\n', err.message, '\n')
				process.exit(1)
			})
			.on('spawn', () => {
				log().green('Blockbench launched successfully!\n')
			})
			.on('exit', code => {
				if (code === 0) {
					resolve()
				} else {
					reject(new Error('Blockbench exited with code: ' + code))
				}
			})
	})
}

export async function printError(toTry: Promise<any>, message: string) {
	try {
		await toTry
	} catch (e: any) {
		log().red(message, ':\n', e.message, '\n')
		process.exit(1)
	}
}

interface EnvironmentFile {
	name: string
	envbench_version: string
	blockbench_version: NamedBlockbenchVersion
	launchArgs?: string[]
}

export async function setEnvironmentFile(name: string, data: EnvironmentFile, force = false) {
	const path = pathjs.join(process.env.ENVBENCH_STORAGE_FOLDER, name)
	if (!force && !(await environmentExists(name, true))) {
		throw new Error(`Environment ${name} does not exist!`)
	}
	return await fs
		.writeFile(
			pathjs.join(path, process.env.ENVBENCH_ENVIRONMENT_FILE),
			JSON.stringify(data, null, '\t')
		)
		.catch(err => {
			log().red(`Failed to write environment file:\n`)
			log().error(err)
			process.exit(1)
		})
}

export async function getEnvironmentFile(name: string): Promise<EnvironmentFile> {
	const path = pathjs.join(process.env.ENVBENCH_STORAGE_FOLDER, name)
	if (!(await environmentExists(name, true))) {
		throw new Error(`Environment ${name} does not exist!`)
	}
	return await fs
		.readFile(pathjs.join(path, process.env.ENVBENCH_ENVIRONMENT_FILE), 'utf-8')
		.then(content => {
			const json = JSON.parse(content) as EnvironmentFile
			// Validate the environment file
			if (!json.name) {
				throw new Error('Environment file is missing a name!')
			}
			json.envbench_version ??= version
			json.blockbench_version ??= 'latest'
			if (typeof json.blockbench_version !== 'string') {
				throw new Error('Blockbench version must be a string!')
			}
			if (
				json.launchArgs !== undefined &&
				!(
					Array.isArray(json.launchArgs) &&
					(json.launchArgs.length === 0 ||
						json.launchArgs.every(arg => typeof arg === 'string'))
				)
			) {
				throw new Error(
					`Launch arguments must be an array of strings (or undefined), found '${typeof json.launchArgs}'`
				)
			}
			return json
		})
		.catch(err => {
			log().red(`Failed to read environment file:\n`)
			log().error(err, '\n\n')
			process.exit(1)
		})
}

export async function getEnvironmentStates() {
	const folders = await readdirSafe(process.env.ENVBENCH_STORAGE_FOLDER)
	if (!folders) {
		return {}
	}

	const environmentNames: Record<string, EnvironmentFile | 'folder' | false> = {}
	for (const name of folders) {
		if (!name || name.startsWith('.')) {
			continue
		}
		const result = await environmentExists(name)
		if (result === 'env') {
			environmentNames[name] = await getEnvironmentFile(name)
			// .catch(error => {
			// 	log().yellow('Failed to read environment file for ', name, '\n').error(error)
			// 	return 'folder'
			// })
		} else {
			environmentNames[name] = result
		}
	}
	return environmentNames
}

export async function getEnvironmentFiles() {
	const names = await getEnvironmentStates()
	if (!names) {
		return {}
	}
	const res: Record<string, EnvironmentFile | undefined> = {}
	for (const [name, status] of Object.entries(names)) {
		if (status === 'folder') {
			continue
		}
		res[name] = await getEnvironmentFile(name).catch(() => undefined)
	}
	return res
}

const SPINNER_CHARS = ['∙∙∙', '●∙∙', '∙●∙', '∙∙●', '∙●∙', '●∙∙', '∙∙∙', '∙∙∙']

interface CustomSpinnerOptions<T extends any> {
	style: Terminal
	waitFor: Promise<T> | (() => Promise<T>)
	prefix?: () => Terminal | void
	suffix?: () => Terminal | void
	interval?: number
}

/**
 * Creates a custom spinner in the terminal.
 * @param style The style of the spinner.
 * @param waitFor The promise to wait for.
 * @param interval The interval in milliseconds between each spinner update.
 * @returns A promise that resolves when {@link waitFor} resolves.
 */
export function customSpinner<T extends any>({
	style,
	waitFor,
	interval = 200,
	prefix,
	suffix,
}: CustomSpinnerOptions<T>): Promise<T> {
	let i = 0
	return new Promise<T>((resolve, reject) => {
		const intervalID = setInterval(() => {
			$.getCursorLocation((err, x, y) => {
				if (err) {
					reject(err)
				}
				const char = SPINNER_CHARS[i]
				$.moveTo(0, y).eraseLineBefore()
				prefix?.()
				style(char)
				suffix?.()
				i = (i + 1) % SPINNER_CHARS.length
				$.moveTo(x, y)
			})
		}, interval)
		// Wait for the passed in promise to resolve
		const promise = waitFor instanceof Function ? waitFor() : waitFor
		void promise.then((...args) => {
			clearInterval(intervalID)
			$('\n')
			resolve(...args)
		})
	})
}

export function checkArgs(args: string[]) {
	if (args.includes('--userData')) {
		log().red(
			'You cannot use the --userData flag with Envbench, as it would break the isolation of the Blockbench instance.\n'
		)
		process.exit(1)
	}
}

export function checkEnvironmentName(name: string) {
	if (name.startsWith('.')) {
		log().red('Environment names cannot start with a period!\n')
		process.exit(1)
	}
}
