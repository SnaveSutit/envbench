import { terminal as $ } from 'terminal-kit'
import { registerCommand } from '../commandRegistry'
import { environmentExists, getEnvironmentFile } from '../environmentHandler'
import { log } from '../util'

export async function info(name: string) {
	if (!(await environmentExists(name))) {
		log().red(`Environment `).cyan(name).red(` does not exist!\n`)
		process.exit(1)
	}
	const environment = await getEnvironmentFile(name)
	log().green(`Information about environment `).cyan(name).green(`:\n`)
	$.gray('├ ').green(`Name: `).cyan(name).green(`\n`)
	$.gray('├ ').green(`Blockbench version: `).cyan(environment.blockbench_version).green(`\n`)
	if (environment.launchArgs) {
		$.gray('├ ').green(`Launch arguments: `).cyan(environment.launchArgs.join(' ')).green(`\n`)
	} else {
		$.gray('├ ').green(`Launch arguments: `).cyan('none').red(`\n`)
	}
	$.gray('└ ').green(`EnvBench Version: `).cyan(environment.envbench_version).green(`\n`)
}

registerCommand(program => {
	program
		.command('info')
		.usage('[options]')
		.description('display information about a specific environment')
		.argument('<name>', 'name of the environment to display information about')
		.action(info)
})
