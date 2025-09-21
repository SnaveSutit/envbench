import { NamedBlockbenchVersion } from '../blockbenchVersionManager'
import {
	environmentExists,
	getEnvironmentFile,
	setEnvironmentFile,
	validateBlockbenchLaunchArgs,
} from '../environmentHandler'
import { confirmPrompt, log } from '../util'

import { registerCommand } from '../commandRegistry'
import { rename } from './rename'

export async function modify(
	name: string,
	options: {
		force?: true
		rename?: string
		launchArgs?: string
		version?: NamedBlockbenchVersion
	}
) {
	if (!(await environmentExists(name))) {
		log().red(`Environment `).cyan(name).red(` does not exist!\n`)
		process.exit(1)
	}
	if (!options.force) {
		log()
			.yellow(`Are you sure you want to modify the environment `)
			.cyan(name)
			.yellow(` with the following changes?\n`)
		if (options.launchArgs) {
			log().yellow(`- Launch arguments: `).cyan(options.launchArgs).yellow(`\n`)
		}
		if (options.rename) {
			log().yellow(`- Rename to `).cyan(options.rename).yellow(`\n`)
		}
		log().yellow(`Confirm? [y/n]\n`)
		if (!(await confirmPrompt())) {
			log().red('Operation cancelled!\n')
			process.exit(0)
		}
	}

	log().green(`Modifying Environment `).cyan(name).green(`...\n`)
	const envFile = await getEnvironmentFile(name)

	if (options.launchArgs) {
		log()
			.green(`Setting launch arguments for `)
			.cyan(name)
			.green(` to `)
			.cyan(options.launchArgs)
			.green(`...\n`)
		const args = options.launchArgs.split(' ')
		validateBlockbenchLaunchArgs(args)
		envFile.launchArgs = args
	}

	if (options.version) {
		log()
			.green(`Setting Blockbench version for `)
			.cyan(name)
			.green(` to `)
			.cyan(options.version)
			.green(`...\n`)
		envFile.blockbench_version = options.version
	}

	await setEnvironmentFile(name, envFile)
	log().green(`Environment `).cyan(name).green(` modified successfully!\n`)

	if (options.rename) {
		await rename(name, options.rename, { confirm: true })
	}
}

registerCommand(program => {
	program
		.command('modify')
		.usage('<name> [options]')
		.description('modify an environment')
		.argument('<name>', 'name of the environment to modify')
		.option('-f, --force', 'modify the environment without confirmation')
		.option('-r, --rename <newName>', 'rename the environment to <newName>')
		.option('-v, --version <version>', 'change the Blockbench version of the environment')
		.option(
			'-a, --launch-args <arguments>',
			'set the launch arguments to pass to Blockbench when launching the environment'
		)
		.action(modify)
})
