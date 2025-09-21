import { launchBlockbench } from '../blockbenchVersionManager'
import { registerCommand } from '../commandRegistry'
import {
	environmentExists,
	getEnvironmentFile,
	validateBlockbenchLaunchArgs,
} from '../environmentHandler'
import { log } from '../util'

/**
 * Start an environment.
 */
export async function launch(name: string, options?: { launchArgs?: string }) {
	if (!(await environmentExists(name, false))) {
		log().red(`Environment `).cyan(name).red(` does not exist!\n`)
		process.exit(1)
	}

	const envFile = await getEnvironmentFile(name)
	const args = [...(envFile.launchArgs ?? []), ...(options?.launchArgs?.split(' ') ?? [])]
	validateBlockbenchLaunchArgs(args)

	log().green(`Launching environment `).cyan(name).green(`...\n`)
	await launchBlockbench(envFile.blockbench_version, name, args)
}

registerCommand(program => {
	program
		.command('launch')
		.alias('start')
		.usage('<name> [options]')
		.description('launch an existing environment')
		.argument('<name>', 'name of the environment to launch')
		.option('-a, --launch-args "<arguments>"', 'additional arguments to pass to Blockbench')
		.action(launch)
})
