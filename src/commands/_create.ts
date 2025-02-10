import type { Command } from 'commander'
import fs from 'fs/promises'
import pathjs from 'path'
import { version as envbenchVersion } from '../../package.json'
import {
	type NamedBlockbenchVersion,
	installVersion,
	isValidBlockbenchVersion,
} from '../blockbenchVersionManager'
import { checkArgs, confirmPrompt, environmentExists, log, setEnvironmentFile } from '../util'

export async function create(
	name: string,
	options: { force?: true; confirm?: true; launchArgs?: string; version: NamedBlockbenchVersion }
) {
	const path = pathjs.join(process.env.ENVBENCH_STORAGE_FOLDER, name)
	if (await environmentExists(name)) {
		if (!options.force) {
			log().red(`Environment `).cyan(name).red(` already exists!\n`)
			process.exit(1)
		}
		if (!options.confirm) {
			log().yellow(`An Environment named `).cyan(name).yellow(` already exists.\n`)
			log().yellow(`Do you want to delete it and create a new one? [y/n]\n`)
			if (!(await confirmPrompt())) {
				log().red('Operation cancelled!\n')
				process.exit(0)
			}
		}
		log().red(`Deleting existing environment `).cyan(name).red(`...\n`)
		// Erase the existing environment
		await fs.rm(path, { recursive: true }).catch(err => {
			log().red(`Failed to delete existing environment:\n`)
			log().error(err)
			process.exit(1)
		})
	} else {
		if (!options.confirm) {
			log().yellow(`Create a new environment named `).cyan(name).yellow(`? [y/n]\n`)
			if (!(await confirmPrompt())) {
				log().red('Operation cancelled!\n')
				process.exit(0)
			}
		}
	}

	if (!(await isValidBlockbenchVersion(options.version))) {
		log().red(`Invalid Blockbench version `).cyan(options.version).red(`!\n`)
		process.exit(1)
	}

	await installVersion(options.version)

	log().green(`Creating new environment `).cyan(name).green(`...\n`)
	await fs.mkdir(path, { recursive: true }).catch(err => {
		log().red(`Failed to create environment:\n`)
		log().error(err)
		process.exit(1)
	})

	const launchArgs = options.launchArgs?.split(' ') ?? []
	checkArgs(launchArgs)

	await setEnvironmentFile(
		name,
		{
			name,
			envbench_version: envbenchVersion,
			blockbench_version: options.version,
			launchArgs,
		},
		true
	)

	log().green('Environment created successfully!\n')
}

export default function register(program: Command) {
	program
		.command('create')
		.usage('<name> [options]')
		.description('create a new environment')
		.argument('<name>', 'the name of the new environment')
		.option('--confirm', 'skip confirmation prompts')
		.option('-f, --force', 'overwrite the environment if it already exists')
		.option('-v, --version <version>', 'the Blockbench version to use', 'latest')
		.option(
			'-a, --launch-args "<arguments>"',
			'additional arguments to pass to Blockbench when launching the environment'
		)
		.action(create)
}
