import type { Command } from 'commander'

// @ts-expect-error - TS no like glob imports
import commands from '../commands/_*.ts'

export default function registerCommands(program: Command) {
	for (const mod of commands as Array<{ default: (program: Command) => void }>) {
		if (typeof mod.default !== 'function') continue
		mod.default(program)
	}
}
