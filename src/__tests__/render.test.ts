import { renderHTML } from '../ui/render.js'

const sampleDiff = `diff --git a/a.txt b/a.txt
index e69de29..4b825dc 100644
--- a/a.txt
+++ b/a.txt
@@ -0,0 +1,1 @@
+hello
`

function run() {
  const html = renderHTML(sampleDiff, 'review')
  if (!html.includes('Code Review')) throw new Error('render failed')
  process.stdout.write('render.test passed\n')
}

run()
