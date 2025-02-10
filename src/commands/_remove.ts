import type { Command } from 'commander'
import * as fs from 'fs/promises'
import * as pathjs from 'path'
import { confirmPrompt, environmentExists, log } from '../util'

export async function remove(name: string, options: { confirm?: true }) {
	if (!(await environmentExists(name))) {
		log().red(`Environment `).cyan(name).red(` does not exist!\n`)
		process.exit(1)
	}
	if (!options.confirm) {
		log()
			.yellow(`Are you sure you want to remove the environment `)
			.cyan(name)
			.yellow(`? [y/n]\n`)
		if (!(await confirmPrompt())) {
			log().red('Operation cancelled!\n')
			process.exit(0)
		}
	}
	log().green(`Removing environment `).cyan(name).green(`...\n`)
	const path = pathjs.join(process.env.ENVBENCH_STORAGE_FOLDER, name)
	await fs.rm(path, { recursive: true }).catch(err => {
		log().red(`Failed to remove environment:\n`)
		log().error(err)
		process.exit(1)
	})
	log().green(`Environment removed successfully!\n`)
}

export default function register(program: Command) {
	program
		.command('remove')
		.usage('<name> [options]')
		.description('remove an environment')
		.argument('<name>', 'name of the environment to remove')
		.option('-c, --confirm', 'remove the environment without confirmation')
		.action(remove)
}
