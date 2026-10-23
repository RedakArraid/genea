# Uniform person cards and multi-partner hierarchy

PR #5. No production deployment.

## Card rule

A person has the same card dimensions and the same interactions whether that
person is displayed as a parent, partner or child. The union projection no longer
switches large sibling groups to smaller cards, and the former "Fratries compactes"
control is removed.

Spacing may become tighter for a large family, but the card itself does not change:
portrait, name, generation badge, keyboard selection and person-panel opening use
the same component and dimensions for every role.

## Adult placement rule

The rule is gender-neutral and depends only on the number of recorded partners.

- With one, two or three partners, the common person and those partners remain on
  the same adult line whenever the layout can do so without overlap.
- With more than three partners, the one common person is placed on a line above.
  Every partner is aligned on the next line.
- The children are aligned on the following line. A long child row is panned rather
  than wrapped into visual rows that could be mistaken for different generations.
- A family group with an unknown / unrecorded second parent does not count as an
  additional partner for the threshold.

The same behavior applies to one father with several women, one mother with several
men, or any equivalent data shape. No gender assumption is used by the layout.

## Data and navigation

The common person is still one record and one card. No duplicate is introduced.
The projection is temporary and does not rewrite saved node coordinates.

On a narrow viewport, focusing a partnership may move the single common card
horizontally above the selected partner so both remain useful anchors. Other people
remain mounted in the graph and can be reached by panning or by the overview action.

No intermediate "Union renseignée" card is reintroduced. A missing co-parent keeps
a normal one-card-sized placeholder and does not block relationship routing.

## Regression evidence

The union geometry suite verifies:

- identical card dimensions across parent / partner / child roles;
- one common card only;
- one through three partners on the same adult line;
- four or more partners as common person -> aligned partners -> aligned children;
- the same rule for a common father and a common mother;
- incomplete parentage not counted as another partner;
- all parent/child routes preserved, without crossing person cards.

The Playwright 4x7 scenario verifies the same 33-person graph in both orientations,
multiple viewport widths and dark/light themes. Mobile is allowed to pan instead of
shrinking or wrapping cards into false generations.

Consult the latest GitHub Actions run for the effective pass/fail result.

## Scope

Very wide generations can require panning. "Vue d'ensemble" may reduce the entire
graph when explicitly requested. This is preferable to changing card sizes or
creating false visual generations.

No chronology of partnerships is inferred, and no historical filiation is modified
automatically. Safari, physical-device and staging checks remain separate promotion
steps.
