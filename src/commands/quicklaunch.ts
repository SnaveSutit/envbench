import { mkdir } from 'fs/promises'
import { join } from 'path'
import { version as envbenchVersion } from '../../package.json'
import {
	installVersion,
	isValidBlockbenchVersion,
	NamedBlockbenchVersion,
} from '../blockbenchVersionManager'
import { registerCommand } from '../commandRegistry'
import {
	EnvironmentError,
	environmentExists,
	removeEnvironment,
	setEnvironmentFile,
} from '../environmentHandler'
import { log } from '../util'
import { launch } from './launch'

/**
 * Create a temporary environment for a given Blockbench version and launch it.
 */
export async function quicklaunch(
	version: NamedBlockbenchVersion,
	options?: { launchArgs?: string; reset?: boolean }
) {
	if (!(await isValidBlockbenchVersion(version))) {
		log().red(`Invalid Blockbench version `).cyan(version).red(`!\n`)
		process.exit(1)
	}
	await installVersion(version)

	// Use the version name provided by the user, rather than the resolved version.
	// Prevents env from changing if "latest" is used and a new version is released.
	const environmentName = `.quicklaunch-${version}`

	if (await environmentExists(environmentName)) {
		if (options?.reset) {
			log().yellow(`Resetting environment for Blockbench ${version}...\n`)
			try {
				await removeEnvironment(environmentName)
			} catch (e) {
				if (!(e instanceof EnvironmentError)) {
					log().red('Failed to reset environment:\n')
					log().error(e)
					process.exit(1)
				}
			}
		}
	} else {
		await installVersion(version)

		const path = join(process.env.ENVBENCH_STORAGE_FOLDER, environmentName)
		log().green(`Creating temporary environment for Blockbench `).cyan(version).green(`...\n`)
		await mkdir(path, { recursive: true }).catch(err => {
			log().red(`Failed to create environment:\n`)
			log().error(err)
			process.exit(1)
		})

		await setEnvironmentFile(
			environmentName,
			{
				name: environmentName,
				envbench_version: envbenchVersion,
				blockbench_version: version,
			},
			true
		)
	}

	await launch(environmentName, {
		launchArgs: options?.launchArgs,
	})
}

registerCommand(program => {
	program
		.command('quicklaunch')
		.usage('<version> [options]')
		.description('creates and launches a temporary environment for a given Blockbench version')
		.argument('<version>', 'version of Blockbench to use')
		.option('-a, --launch-args "<arguments>"', 'additional arguments to pass to Blockbench')
		.option('-r, --reset', 'erase any existing environment for this version before launching')
		.action(quicklaunch)
})
