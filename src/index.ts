import * as PACKAGE from '../package.json'
import { terminal as term } from 'terminal-kit'
import * as fs from 'fs/promises'
import * as pathjs from 'path'
import subprocess from 'child_process'

const BLOCKBENCH_PATH = '%LOCALAPPDATA%/Programs/Blockbench/Blockbench.exe'

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

async function main() {
	let i = 0
	while (i < process.argv.length) {
		const arg = process.argv[i]

		switch (arg) {
			case 'help': {
				term('Help: \n')
				term('  help - Display this message\n')
				term('  version - Display version\n')
				term('  new <folder> - Create a new Blockbench environment\n')
				term(
					'  run [folder] - Run a Blockbench environment. If no folder is provided, the current directory is used.\n'
				)
				break
				break
			}
			case 'version': {
				term('BBEnv Version: ', PACKAGE.version, '\n')
				break
			}
			case 'new': {
				const folder = process.argv[i + 1]
				if (!folder) {
					term.red('Please provide a folder name!\n')
					break
				}

				term(`Create a new Blockbench environment in folder: ${folder}?\n`)
				const result = await term.yesOrNo({ yes: ['y', 'ENTER'], no: ['n'] }).promise
				if (result) {
					term.green('Creating new Blockbench environment...\n')
					await fs.mkdir(folder, { recursive: true }).catch((err) => {
						term.red(err)
						process.exit(1)
					})
					// check if the folder has a .bbenv.json file
					const exists = await fs
						.access(pathjs.join(folder, '.bbenv.json'))
						.then(() => true)
						.catch(() => false)
					if (exists) {
						term.red('Folder already contains a Blockbench environment!\n')
						term.red('Are you sure you want to overwrite it?\n')
						const result = await term.yesOrNo({ yes: ['y', 'ENTER'], no: ['n'] })
							.promise
						if (!result) {
							term.red('Cancelled!\n')
							process.exit(0)
						}
					}
					// Create the new environment
					await fs
						.writeFile(pathjs.join(folder, '.bbenv.json'), JSON.stringify({}), 'utf8')
						.catch((err) => {
							term.red(err)
							process.exit(1)
						})
				} else {
					term.red('Cancelled!\n')
					process.exit(0)
				}
				break
			}
			case 'run': {
				let folder = process.argv[i + 1]
				folder ??= process.cwd()
				folder = pathjs.resolve(folder)
				// check if the folder has a .bbenv.json file
				const exists = await fs
					.access(pathjs.join(folder, '.bbenv.json'))
					.then(() => true)
					.catch(() => false)
				if (!exists) {
					term.red('Folder does not contain a Blockbench environment!\n')
					process.exit(1)
				}
				term.green('Starting Blockbench...\n')
				await startBlockbench(folder)
				break
			}
		}
		i++
	}
	process.exit(0)
}

void main()
