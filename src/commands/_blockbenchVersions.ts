import type { Command } from 'commander'
import { readdir } from 'fs/promises'
import { pruneBlockbenchVersions, ResolvedBlockbenchVersion } from '../blockbenchVersionManager'
import { log } from '../util'

type PortableFileName = `blockbench-${ResolvedBlockbenchVersion}.${'exe' | 'dmg' | 'AppImage'}`

export async function blockbenchVersions(options: { prune?: true }) {
	if (options.prune) {
		log().green(`Pruning Blockbench versions...\n`)
		await pruneBlockbenchVersions()
	}

	log().green(`Installed Blockbench versions:\n`)
	const portableFiles = (await readdir(
		process.env.BLOCKBENCH_PORTABLES_CACHE
	)) as PortableFileName[]
	for (const portable of portableFiles) {
		const version = portable.replace(/^blockbench-|\.exe|\.dmg|\.AppImage$/g, '')
		log().cyan(version).green(` (${portable})\n`)
	}
}

export default function register(program: Command) {
	program
		.command('blockbench_versions')
		.usage('[options]')
		.description('list the locally installed versions of Blockbench')
		.option(
			'-p, --prune',
			"uninstall any versions that aren't being used in an existing Environment from the cache"
		)
		.action(blockbenchVersions)
}
