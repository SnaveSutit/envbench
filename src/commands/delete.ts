import { registerCommand } from '../commandRegistry'
import { environmentExists, removeEnvironment } from '../environmentHandler'
import { confirmPrompt, log } from '../util'

export async function remove(name: string, options: { confirm?: true }) {
	if (!(await environmentExists(name))) {
		log().red(`Environment `).cyan(name).red(` does not exist!\n`)
		process.exit(1)
	}
	if (!options.confirm) {
		log().yellow(`Are you sure you want to delete environment `).cyan(name).yellow(`? [y/n]\n`)
		if (!(await confirmPrompt())) {
			log().red('Operation cancelled!\n')
			process.exit(0)
		}
	}
	log().green(`Deleting environment `).cyan(name).green(`...\n`)
	await removeEnvironment(name)
	log().green(`Environment deleted successfully!\n`)
}

registerCommand(program => {
	program
		.command('delete')
		.alias('remove')
		.usage('<name> [options]')
		.description('remove an environment')
		.argument('<name>', 'name of the environment to remove')
		.option('-c, --confirm', 'remove the environment without confirmation')
		.action(remove)
})
