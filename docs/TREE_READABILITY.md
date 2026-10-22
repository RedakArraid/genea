# Tree readability review

22 October 2026 - proposed in PR #5, not deployed.

## Reading before overview

The previous screenshots exposed confusing crossings and tiny labels despite passing geometry tests. Families is a new reading mode: one clearly bordered group per exact recorded parent set, with the children below it. The same parent can appear in several groups but always opens the same person record; a caption makes this explicit. A missing second parent is labelled unknown, not inferred from a spouse. Unlinked people are separate. Co-parentage does not imply marriage.

Families is the initial genealogy view on narrow screens and for multiple parental unions. The Tree view, its three orientations and manual coordinates remain available. An explicit presentation choice is stored per tree. Organization charts retain their graphical presentation. Search and generation filters show matching groups with complete family context, accompanied by an explanatory message.

## Graphical safeguards

The graphical view has an exact-family selector. Shared parents use distinct union ports. A bounded orthogonal visibility search reroutes paths that intersect cards or share a segment with another family. Genuine family junctions are retained. If a manual placement covers a junction, the renderer attempts direct paths for each recorded parent/child instead of showing a broken bus. If routing still fails, the affected family paths are withheld and a visible warning directs the user to the exhaustive Families view. This is not a guarantee of a crossing-free graph.

Separate crossings have a background under-stroke and a legend. Dashed lines denote recorded spouses; solid lines denote parentage. Decorative genealogy card colors no longer suggest maternal groups. Floating plus buttons are removed from ambiguous intersections. Child creation and linking remain available in each Families group and in the existing partner section. Canvas paste temporarily uses the graphical view.

## Detail and form polish

The selected person's name stays in the fixed panel heading. Copy/paste controls wrap and stack. De-emphasized cards remain legible. Child creation has a contextual title and a translated photo picker; native date formatting still depends on the browser.

## Validation

- `node --test scripts/test-tree-clarity.cjs`: 78 cases for reading groups, complete context, card intersections, shared family segments and manual obstacles.
- Existing 163 half-sibling and 65 display geometry cases remain unchanged.
- `npx playwright test --config=playwright.clarity.config.ts`: responsive reading, light/dark themes, French/English, family actions, panel identity and graphical obstacle checks. Uses the compiled frontend and intercepted API responses with synthetic data.
- Existing 60 browser display cases and 12 real API/database family journeys explicitly choose Tree so they continue to test their original behavior.
- The workflow captures screenshots for visual inspection. Test presence alone is not proof of success: consult the latest completed run on the PR.

Backend and persisted family data are unchanged by this visual follow-up. Existing manual coordinates are preserved. Very large graphs can still require navigation; saved overlapping cards can prevent safe routing. Touch devices/Safari and representative staging data require validation before release.
