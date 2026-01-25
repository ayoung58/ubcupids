// Quick test of gender compatibility logic
const userA = {
  gender: "man",
  interestedInGenders: ["women", "men"],
};

const userB = {
  gender: "man",
  interestedInGenders: ["men"],
};

console.log(`User A gender: "${userA.gender}" (type: ${typeof userA.gender})`);
console.log(`User B gender: "${userB.gender}" (type: ${typeof userB.gender})`);
console.log(`User A interested array:`, userA.interestedInGenders);
console.log(`User B interested array:`, userB.interestedInGenders);
console.log();

// Test each element
userA.interestedInGenders.forEach((g, i) => {
  console.log(
    `userA.interestedInGenders[${i}] = "${g}" (type: ${typeof g}, length: ${g.length})`
  );
  console.log(
    `  Char codes:`,
    [...g].map((c) => c.charCodeAt(0))
  );
});
console.log();

userB.interestedInGenders.forEach((g, i) => {
  console.log(
    `userB.interestedInGenders[${i}] = "${g}" (type: ${typeof g}, length: ${g.length})`
  );
  console.log(
    `  Char codes:`,
    [...g].map((c) => c.charCodeAt(0))
  );
});
console.log();

console.log(`\nTesting includes:`);
console.log(
  `["women", "men"].includes("man"): ${["women", "men"].includes("man")}`
);
console.log(
  `userA.interestedInGenders.includes("man"): ${userA.interestedInGenders.includes("man")}`
);
console.log(
  `userA.interestedInGenders.includes(userB.gender): ${userA.interestedInGenders.includes(userB.gender)}`
);

const aInterestedInB = userA.interestedInGenders.includes(userB.gender);
const bInterestedInA = userB.interestedInGenders.includes(userA.gender);

console.log(`\nA interested in B's gender: ${aInterestedInB}`);
console.log(`B interested in A's gender: ${bInterestedInA}`);
console.log(`\nBoth interested: ${aInterestedInB && bInterestedInA}`);
