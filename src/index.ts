import './env'
// The order of these imports is important
import './commands//'
//
import { Command, Help } from 'commander'
import { description } from '../package.json'
import { registerCommands } from './commandRegistry'
import { EnvBenchHelp } from './commands/help'
import { assertStorageFolder } from './environmentHandler'
import { updateOnlineStatus } from './util'

class EnvBenchCommand extends Command {
	createCommand(name?: string): Command {
		return new EnvBenchCommand(name)
	}
	createHelp(): Help {
		return new EnvBenchHelp()
	}
}

async function main() {
	const program = new EnvBenchCommand()
	program.name('envbench').description(description)

	await registerCommands(program)

	try {
		await Promise.all([updateOnlineStatus(), assertStorageFolder()])
		await program.parseAsync()
	} catch (err: any) {
		if (process.env.NODE_ENV === 'development') {
			console.error(err)
		} else {
			console.error(err.message)
		}
		process.exit(1)
	}
	process.exit(0)
}

void main()
