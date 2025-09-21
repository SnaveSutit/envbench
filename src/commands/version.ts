import { version } from '../../package.json'
import { registerCommand } from '../commandRegistry'
import { log } from '../util'

registerCommand(program => {
	program
		.command('version')
		.alias('v')
		.description('Print the version of EnvBench.')
		.action(() => {
			log().green('v', version, '\n')
		})
})
