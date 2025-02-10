import { Command } from 'commander'
import { version } from '../../package.json'
import { log } from '../util'

export default function register(program: Command) {
	program
		.command('version')
		.alias('v')
		.description('Print the version of EnvBench.')
		.action(() => {
			log().green('v', version, '\n')
		})
}
