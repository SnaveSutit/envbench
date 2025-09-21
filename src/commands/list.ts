import { terminal as $ } from 'terminal-kit'
import { registerCommand } from '../commandRegistry'
import { environmentExists, getEnvironmentStates } from '../environmentHandler'
import { log } from '../util'

export async function list(options: { long?: true }) {
	const environments = await getEnvironmentStates()
	const length = Object.keys(environments).length
	if (length === 0) {
		log().red('No environments found!\n')
		log().yellow('Create a new environment with the "--create <name>" command.\n')
		process.exit(0)
	}

	if (options.long) {
		log().green('Available Environments:\n')
		for (const [name, status] of Object.entries(environments)) {
			switch (status) {
				case 'folder':
					$.gray(' ').yellow(name, ' (Missing environment file!)\n')
					continue
				case false:
					$.gray(' ').yellow(name, ' (Missing environment folder!)\n')
					continue
				default:
					$.gray(' ')
						.green(name, '\n')
						.gray(' ├ Blockbench Version: ')
						.cyan(status.envbench_version, '\n')
					if (status.launchArgs) {
						$.gray('├ Launch Args: ').cyan(status.launchArgs.join(' '), '\n')
					}
					$.gray(' └ Envbench Version: ').cyan(status.envbench_version, '\n')
			}
		}
		return
	}

	log().green('Available Environments:\n')
	for (const [index, name] of Object.keys(environments).entries()) {
		index === length - 1 ? $.gray('└ ') : $.gray('├ ')
		if (await environmentExists(name)) {
			$.green(name, '\n')
		} else {
			$.yellow(name, ' (Missing environment file!)\n')
		}
	}
}

registerCommand(program => {
	program
		.command('list')
		.usage('[options]')
		.description('list all available environments')
		.option('-l, --long', 'show detailed information about each environment')
		.action(list)
})
