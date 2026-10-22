# Compact siblings and readable family framing

PR #5, 22 October 2026. No production deployment.

## Behavior

Terminal sibling sets of at least five children can use compact person cards in
two columns, inside their existing parental frame. Rows are siblings of the same
generation, not a new parent-child level. Children with unions or descendants keep
the multi-generation layout. The full-card switch and free layout remain available.

The common parent is still one record and one card. On narrow screens its temporary
position follows the selected family. All 33 people remain in the graph; there are
no saved-coordinate writes and no intermediate Union card. Names, generation badges,
portraits and keyboard selection remain in the compact cards.

The initial frame prioritizes readable text. If the complete selected family is
just below the 85% scale threshold because of decorative padding, it tries a four
pixel margin instead of immediately centering only the parents. The threshold is
unchanged and 60 pixels below the content remain reserved for zoom controls.

## Regression evidence

`node --test scripts/test-union-overview.cjs scripts/test-union-viewport.cjs`

The five viewport tests cover the measured read-only toolbar height (185 pixels),
375/390 pixel widths, the former 172 pixel toolbar, desktop framing and a shorter
screen fallback. Two of these cases fail with the previous viewport code. All five
pass with the fix. The existing geometry tests are retained.

`npx playwright test --config=playwright.unions.config.ts`

The existing 4x7 browser tests must still show the father and all seven children of
the selected couple at >=85% on the tested 375x900 vertical viewport. At 1600x1000,
the complete vertical tree must show all 33 cards. No assertion is weakened.
The real API/PostgreSQL suite also creates the exact 4x7 family, reloads it and rejects
a conflicting mother. Consult the latest Actions run for completed results.

## Scope

A short viewport or an expanded multi-generation graph may still require panning.
The horizontal projection and explicit overview are not claimed to fit every name
legibly on every device. Safari, physical devices, real photos, import/copy workflows
and staging promotion remain separate validation steps. No historical filiation is
changed automatically and no union chronology is inferred.
