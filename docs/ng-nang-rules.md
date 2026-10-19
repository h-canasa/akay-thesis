# G7: High-confidence ng/nang checks

Akay uses **narrow context rules**, not general part-of-speech tagging, to suggest corrections to the particles **ng** and **nang**. Both are correctly spelled, so a dictionary lookup cannot choose between them. The rule belongs to **Gramatika** and is labeled **G7**.

## Source and linguistic basis

Komisyon sa Wikang Filipino, *Manwal sa Masinop na Pagsulat* (2014), §9, "Kailan ng at Kailan nang," explains five uses of **nang**: (1) as *noong*; (2) as *upang/para*; (3) contracted *na + ng*; (4) manner/degree; and (5) linking repeated actions. All other uses generally take **ng**.

See: https://studylib.net/doc/27313972/fl3118-manwal-sa-masinop-na-pagsulat-kwf

The following implementation **does not** cover every use. It only corrects deliberately whitelisted short collocations whose context indicates the grammatical role.

## Implemented scored patterns

| Pattern | Incorrect text | Proposed correction | Why |
| --- | --- | --- | --- |
| Manner after specified action verbs | Nag-aral siya **ng** mabuti. | **nang** | Adverb of manner |
| Direct object after specified action verbs | Kumain ako **nang** tinapay. | **ng** | Marks the object eaten |
| Relationship between two specified nouns | Bahay **nang** kaibigan ko. | **ng** | Possession or relationship |
| Repetition of a specified action verb | Takbo **ng** takbo ang bata. | **nang** | Links repeated actions |
| Purpose after selected action verbs | Nag-aral siya **ng** makapasa. | **nang** | Can mean *upang* |

All patterns require an explicit preceding verb/noun and matching following word/phrase from a limited list. They do not attempt general syntactic inference. The manner pattern avoids the common noun-modifying construction with *na* (e.g. "Sumulat siya ng maayos na liham"), and none of these patterns span newlines.

The G7 issue highlights **only** the incorrect ng or nang, while the contextual Mungkahi card explains the correction. The live editor can accept or ignore it. Essay Exam Mode still hides all feedback until submission and preserves the original submitted score.

## Scoring and validation

Unlike tentative dictionary-only flags, G7's limited matches are treated as **rule-based, grade-bearing grammar issues**, following the existing policy of 12 points deducted from the Gramatika category per non-overlapping active rule issue. Since Gramatika has a 1.5/3.0 weight, one G7 error usually lowers the overall result by 6 points before floors/rounding.

This decision is **provisional for research**: a pattern whitelist is not a substitute for a validated grammar analyzer. For pre-/post-test studies, have a Filipino language expert review the test sentences and label false positives/negatives before treating these detections as ground truth.

## Deliberately unsupported cases

The rules leave unfamiliar or context-dependent phrases untouched, including some real errors (false negatives). They do not currently detect general uses of *nang* meaning *noong*, broad verb-purpose subordinate clauses, contracted *na + ng*, many valid adverb constructions, or arbitrary noun phrases. They do not make recommendations for sentences with unrecognized vocabulary.

Before extending G7, add positive and negative fixtures to the ng-nang test suite and check for regressions. Run npm test and npm run build.
