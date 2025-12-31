import { renderReviewItem } from '../ui/render/html.js'

const sampleDiff = `diff --git a/a.txt b/a.txt
index e69de29..4b825dc 100644
--- a/a.txt
+++ b/a.txt
@@ -0,0 +1,1 @@
+hello
`

const sampleReview = 'Looks good'

function test(name: string, fn: () => void) {
  try {
    fn()
    console.log(`PASS: ${name}`)
  } catch (e) {
    console.error(`FAIL: ${name}`, e)
    process.exit(1)
  }
}

function expect(actual: any) {
  return {
    toContain(expected: string) {
      if (!actual.includes(expected)) throw new Error(`Expected "${actual}" to contain "${expected}"`)
    }
  }
}

test('renders diff and review', () => {
  const item = renderReviewItem({ file: 'a.txt', review: sampleReview, diff: sampleDiff })
  expect(item.reviewHtml).toContain('Looks good')
  expect(item.diffHtml).toContain('d2h-file-header')
})
