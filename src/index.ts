import './env'
//
import { Command, Help } from 'commander'
import { description } from '../package.json'
import registerCommands from './commands'
import { EnvBenchHelp } from './commands/_help'
import { assertStorageFolder, updateOnlineStatus } from './util'

class EnvBenchCommand extends Command {
	createCommand(name?: string): Command {
		return new EnvBenchCommand(name)
	}
	createHelp(): Help {
		return new EnvBenchHelp()
	}
}

export const PROGRAM = new EnvBenchCommand()

PROGRAM.name('envbench').description(description)

registerCommands(PROGRAM)

async function main() {
	try {
		await Promise.all([updateOnlineStatus(), assertStorageFolder()])
		await PROGRAM.parseAsync()
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
