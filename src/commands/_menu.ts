import type { Command } from 'commander'
import { terminal as $, Terminal } from 'terminal-kit'
import { getEnvironmentStates, log } from '../util'
import { info } from './_info'
import { remove } from './_remove'
import { rename } from './_rename'
import { start } from './_start'

interface Action {
	action(name: string): Promise<void>
}

const ACTIONS: Record<string, Action> = {
	start: {
		async action(name: string) {
			await start(name, {})
		},
	},
	info: {
		async action(name: string) {
			await info(name)
		},
	},
	rename: {
		async action(name: string) {
			log().green(`Enter a new name for `).cyan(name).green(`: `)
			const newName = await $.inputField({
				cancelable: true,
				style: $.cyan,
			}).promise
			$('\n')
			if (!newName) {
				log().red('Canceled!\n')
				process.exit(0)
			}
			await rename(name, newName, { confirm: true })
		},
	},
	remove: {
		async action(name: string) {
			await remove(name, {})
		},
	},
}

export default function register(program: Command) {
	program
		.command('menu')
		.usage('[options]')
		.description('open the environment select menu')
		.action(async () => {
			const environments = await getEnvironmentStates()
			const length = Object.keys(environments).length
			if (length === 0) {
				log().red('No environments found!\n')
				log().yellow('Create a new environment with the "--create <name>" command.\n')
				process.exit(1)
			}
			log().green(
				'Select an environment: (Use arrow keys to navigate, ENTER to select, ESC to cancel.)'
			)
			let response: Terminal.SingleLineMenuResponse
			response = await $.singleColumnMenu(Object.keys(environments), {
				cancelable: true,
				leftPadding: '- ',
				style: $.green,
				selectedStyle: $.black.bgGreen,
			}).promise
			if (response.canceled) {
				log().red('Canceled!\n')
				process.exit(0)
			}
			const environment = response.selectedText
			log().green(`Select an action for `).cyan(environment)
			response = await $.singleColumnMenu(Object.keys(ACTIONS), {
				cancelable: true,
				leftPadding: '- ',
				style: $.green,
				selectedStyle: $.black.bgGreen,
			}).promise
			if (response.canceled) {
				log().red('Canceled!\n')
				process.exit(0)
			}
			const action = response.selectedText
			await ACTIONS[action].action(environment)
		})
}
