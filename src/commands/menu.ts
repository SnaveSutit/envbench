import { terminal as $, Terminal } from 'terminal-kit'
import { registerCommand } from '../commandRegistry'
import { getEnvironmentStates } from '../environmentHandler'
import { log } from '../util'
import { remove } from './delete'
import { info } from './info'
import { launch } from './launch'
import { rename } from './rename'

interface Action {
	action(name: string): Promise<void>
}

const ACTIONS: Record<string, Action> = {
	launch: {
		async action(name: string) {
			await launch(name, {})
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
	delete: {
		async action(name: string) {
			await remove(name, {})
		},
	},
}

export async function menu() {
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
}

registerCommand(program => {
	program
		.command('menu')
		.usage('[options]')
		.description('open the environment select menu')
		.action(menu)
})
