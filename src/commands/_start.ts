import { type Command } from 'commander'
import { runBlockbench } from '../blockbenchVersionManager'
import { checkArgs, environmentExists, getEnvironmentFile, log } from '../util'

/**
 * Start an environment.
 */
export async function start(name: string, options?: { launchArgs?: string }) {
	if (!(await environmentExists(name, false))) {
		log().red(`Environment `).cyan(name).red(` does not exist!\n`)
		process.exit(1)
	}

	const envFile = await getEnvironmentFile(name)
	const args = [...(envFile.launchArgs ?? []), ...(options?.launchArgs?.split(' ') ?? [])]
	checkArgs(args)

	log().green(`Starting environment `).cyan(name).green(`...\n`)
	await runBlockbench(envFile.blockbench_version, name, args)
	log().green('Blockbench closed!\n')
}

export default function register(program: Command) {
	program
		.command('start')
		.usage('<name> [options]')
		.description('start an environment')
		.argument('<name>', 'name of the environment to start')
		.option('-a, --launch-args "<arguments>"', 'additional arguments to pass to Blockbench')
		.option('-i, --ignore-missing', 'ignore if the environment does not exist')
		.action(start)
}
