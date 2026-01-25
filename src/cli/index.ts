import 'dotenv/config'
import { Command } from 'commander'
import { runHook } from './commands/hook.js'
import { runInit } from './commands/init.js'
import { runReviewCommit } from './commands/review-commit.js'

export async function run() {
  const program = new Command()
  program.name('code-gate').description('AI commit review tool').version('1.0.4')

  program
    .command('init')
    .description('Initialize integration and generate config')
    .option('-m, --method <method>', 'init method: git|husky')
    .option('-f, --force', 'force overwrite/append')
    .option('--no-config', 'do not generate config file')
    .action(async (opts) => {
      await runInit(opts.method as string, !!opts.config, !!opts.force)
    })

  program
    .command('hook')
    .description('Run interactive pre-commit review')
    .option('-f, --force', 'force review even when non-interactive', false)
    .action(async (opts) => {
      await runHook(!!opts.force)
    })

  program
    .command('review-commit <commit-hash>')
    .alias('rc')
    .description('Review code changes from a specific commit')
    .action(async (commitHash: string) => {
      await runReviewCommit(commitHash)
    })

  program.parseAsync(process.argv)
}
