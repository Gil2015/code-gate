import { Command } from 'commander'
import { runSetup } from './commands/setup.js'
import { runHook } from './commands/hook.js'
import { runInit } from './commands/init.js'

export async function run() {
  const program = new Command()
  program.name('code-gate').description('AI commit review tool').version('0.1.0')

  program
    .command('init')
    .description('Initialize integration and generate config')
    .option('-m, --method <method>', 'init method: git|husky|simple', 'git')
    .option('-f, --force', 'force overwrite/append')
    .option('--no-config', 'do not generate config file')
    .action(async (opts) => {
      await runInit(opts.method as string, !!opts.config, !!opts.force)
    })

  program
    .command('setup')
    .description('Install git hook integration')
    .action(async () => {
      await runSetup()
    })

  program
    .command('hook')
    .description('Run interactive pre-commit review')
    .option('-f, --force', 'force review even when non-interactive', false)
    .action(async (opts) => {
      await runHook(!!opts.force)
    })

  program.parseAsync(process.argv)
}
