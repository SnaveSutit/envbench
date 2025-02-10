import type { Command } from 'commander'
import fs from 'fs/promises'
import pathjs from 'path'
import {
	confirmPrompt,
	environmentExists,
	getEnvironmentFile,
	log,
	setEnvironmentFile,
} from '../util'

export async function rename(name: string, newName: string, options: { confirm?: true }) {
	if (!(await environmentExists(name))) {
		log().red(`Environment `).cyan(name).red(` does not exist!\n`)
		process.exit(1)
	}
	if (await environmentExists(newName)) {
		log().red(`Environment `).cyan(newName).red(` already exists!\n`)
		process.exit(1)
	}
	if (!options.confirm) {
		log()
			.yellow(`Are you sure you want to rename the environment `)
			.cyan(name)
			.yellow(` to `)
			.cyan(newName)
			.yellow(`? [y/n]\n`)
		if (!(await confirmPrompt())) {
			log().red('Operation cancelled!\n')
			process.exit(0)
		}
	}
	log().green(`Renaming environment `).cyan(name).green(` to `).cyan(newName).green(`...\n`)
	const oldPath = pathjs.join(process.env.ENVBENCH_STORAGE_FOLDER, name)
	const newPath = pathjs.join(process.env.ENVBENCH_STORAGE_FOLDER, newName)
	await fs.rename(oldPath, newPath).catch(err => {
		log().red(`Failed to rename environment:\n`)
		log().error(err)
		process.exit(1)
	})
	const envFile = await getEnvironmentFile(newName)
	envFile.name = newName
	await setEnvironmentFile(newName, envFile)
	log().green(`Environment renamed successfully!\n`)
}

export default function register(program: Command) {
	program
		.command('rename')
		.description('rename an environment')
		.argument('<name>', 'name of the environment to rename')
		.argument('<newName>', 'new name of the environment')
		.option('-c, --confirm', 'skip confirmation prompt')
		.action(rename)
}
