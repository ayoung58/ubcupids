// Test the fixed q13 similarity calculation
// User A: friendship_like, casual_dating, open_to_serious
// User B: open_to_serious, friendship_like, seeking_long_term
// Expected overlap: friendship_like, open_to_serious (2 items in both)

function testJaccardSimilarity() {
  const aAnswer = ["friendship_like", "casual_dating", "open_to_serious"];
  const bAnswer = ["open_to_serious", "friendship_like", "seeking_long_term"];
  const aPreference = ["friendship_like", "open_to_serious", "casual_dating"];
  const bPreference = [
    "open_to_serious",
    "friendship_like",
    "seeking_long_term",
  ];

  // User A's satisfaction with B's answer
  const aPrefSet = new Set(aPreference);
  const bAnswerSet = new Set(bAnswer);
  const aPrefIntersection = new Set(
    [...aPrefSet].filter((x) => bAnswerSet.has(x)),
  );
  const aPrefUnion = new Set([...aPrefSet, ...bAnswerSet]);
  const aSatisfied =
    aPrefUnion.size > 0 ? aPrefIntersection.size / aPrefUnion.size : 0.5;

  console.log("A's Preference:", aPreference);
  console.log("B's Answer:", bAnswer);
  console.log("A's Preference Set:", aPrefSet);
  console.log("B's Answer Set:", bAnswerSet);
  console.log("Intersection:", aPrefIntersection);
  console.log("Union:", aPrefUnion);
  console.log(
    `A Satisfied: ${aPrefIntersection.size} / ${aPrefUnion.size} = ${aSatisfied}`,
  );
  console.log("");

  // User B's satisfaction with A's answer
  const bPrefSet = new Set(bPreference);
  const aAnswerSet = new Set(aAnswer);
  const bPrefIntersection = new Set(
    [...bPrefSet].filter((x) => aAnswerSet.has(x)),
  );
  const bPrefUnion = new Set([...bPrefSet, ...aAnswerSet]);
  const bSatisfied =
    bPrefUnion.size > 0 ? bPrefIntersection.size / bPrefUnion.size : 0.5;

  console.log("B's Preference:", bPreference);
  console.log("A's Answer:", aAnswer);
  console.log("B's Preference Set:", bPrefSet);
  console.log("A's Answer Set:", aAnswerSet);
  console.log("Intersection:", bPrefIntersection);
  console.log("Union:", bPrefUnion);
  console.log(
    `B Satisfied: ${bPrefIntersection.size} / ${bPrefUnion.size} = ${bSatisfied}`,
  );
  console.log("");

  const finalScore = (aSatisfied + bSatisfied) / 2;
  console.log(
    `Final Score: (${aSatisfied} + ${bSatisfied}) / 2 = ${finalScore}`,
  );
}

testJaccardSimilarity();
