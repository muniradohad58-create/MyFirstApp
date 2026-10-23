// server/utils/muniraFactHelper.js
const muniraKnowledge = require("../config/muniraKnowledge");

/**
 * Checks user input for questions about Munira and retrieves verified facts.
 */
function getMuniraFact(inputMessage) {
  if (!inputMessage) return { handled: false, response: null };

  // Agar object/array form mein message aaye toh string content extract karein
  let text = "";
  if (typeof inputMessage === "string") {
    text = inputMessage;
  } else if (typeof inputMessage === "object" && inputMessage.content) {
    text = inputMessage.content;
  } else {
    text = JSON.stringify(inputMessage);
  }

  const q = text.toLowerCase();
  const hasValue = (val) => val !== undefined && val !== null && val !== "";

  // 1. Creator / Built By
  if (q.includes("built you") || q.includes("creator") || q.includes("who made")) {
    return { handled: true, response: hasValue(muniraKnowledge.builtBy) ? `${muniraKnowledge.builtBy} built me.` : "I don't have this information." };
  }

  // 2. Age
  if (q.includes("old is munira") || q.includes("munira's age") || q.includes("age of munira")) {
    return { handled: true, response: hasValue(muniraKnowledge.age) ? `${muniraKnowledge.name} is ${muniraKnowledge.age} years old.` : "I don't have this information." };
  }

  // 3. Education / Degree
  if (q.includes("education") || q.includes("qualification")) {
    return { handled: true, response: hasValue(muniraKnowledge.education) ? `${muniraKnowledge.name}'s education status is ${muniraKnowledge.education}.` : "I don't have this information." };
  }

  if (q.includes("degree") || q.includes("major")) {
    return { handled: true, response: hasValue(muniraKnowledge.degree) ? `${muniraKnowledge.name} is pursuing ${muniraKnowledge.degree}.` : "I don't have this information." };
  }

  // 4. University / College / School
  if (q.includes("university") || q.includes("attend")) {
    return { handled: true, response: hasValue(muniraKnowledge.university) ? `${muniraKnowledge.name} attends ${muniraKnowledge.university}.` : "I don't have this information." };
  }

  if (q.includes("college")) {
    return { handled: true, response: hasValue(muniraKnowledge.college) ? `${muniraKnowledge.name} attended ${muniraKnowledge.college}.` : "I don't have this information." };
  }

  if (q.includes("school")) {
    return { handled: true, response: hasValue(muniraKnowledge.school) ? `${muniraKnowledge.name} studied at ${muniraKnowledge.school}.` : "I don't have this information." };
  }

  // 5. Semester / CGPA
  if (q.includes("semester") || q.includes("sem")) {
    return { handled: true, response: hasValue(muniraKnowledge.semester) ? `${muniraKnowledge.name} is currently in ${muniraKnowledge.semester}.` : "I don't have this information." };
  }

  if (q.includes("cgpa") || q.includes("gpa") || q.includes("grades")) {
    return { handled: true, response: hasValue(muniraKnowledge.CGPA) ? `${muniraKnowledge.name}'s CGPA is ${muniraKnowledge.CGPA}.` : "I don't have this information." };
  }

  // 6. City / Location
  if (q.includes("live") || q.includes("city") || q.includes("location") || q.includes("where is munira")) {
    return { handled: true, response: hasValue(muniraKnowledge.city) ? `${muniraKnowledge.name} lives in ${muniraKnowledge.city}.` : "I don't have this information." };
  }

  // 7. Hobbies / Interests
  if (q.includes("hobby") || q.includes("hobbies") || q.includes("like traveling") || q.includes("interests")) {
    return { handled: true, response: hasValue(muniraKnowledge.hobbies) ? `${muniraKnowledge.name}'s hobbies are ${muniraKnowledge.hobbies}.` : "I don't have this information." };
  }

  // 8. Favorite Color & Food
  if (q.includes("color") || q.includes("colour")) {
    return { handled: true, response: hasValue(muniraKnowledge.favoriteColor) ? `${muniraKnowledge.name}'s favorite color is ${muniraKnowledge.favoriteColor}.` : "I don't have this information." };
  }

  if (q.includes("food") || q.includes("eat") || q.includes("dish")) {
    return { handled: true, response: hasValue(muniraKnowledge.favoriteFood) ? `${muniraKnowledge.name}'s favorite food is ${muniraKnowledge.favoriteFood}.` : "I don't have this information." };
  }

  // 9. Skills
  if (q.includes("skills") || q.includes("good at") || q.includes("programming language")) {
    return { handled: true, response: hasValue(muniraKnowledge.skills) ? `${muniraKnowledge.name}'s skills are ${muniraKnowledge.skills}.` : "I don't have this information." };
  }

  // 10. Future Goals
  if (q.includes("future goal") || q.includes("plans")) {
    return { handled: true, response: hasValue(muniraKnowledge.futureGoals) ? `${muniraKnowledge.name}'s future goal is: ${muniraKnowledge.futureGoals}.` : "I don't have this information." };
  }

  // 11. Religion / Dawoodi Bohra / Spiritual Leader
  if (q.includes("religion") || q.includes("faith") || q.includes("sect")) {
    return { handled: true, response: hasValue(muniraKnowledge.religion) ? `${muniraKnowledge.name}'s religion is ${muniraKnowledge.religion}.` : "I don't have this information." };
  }

  if (q.includes("dawoodi bohra") || q.includes("bohra")) {
    const detail = muniraKnowledge["dawoodi bohra"];
    return { handled: true, response: hasValue(detail) ? detail : "I don't have this information." };
  }

  if (q.includes("leader") || q.includes("spiritual leader") || q.includes("dai al-mutlaq") || q.includes("syedna")) {
    const leader = muniraKnowledge["leader/spiritual leader"];
    return { handled: true, response: hasValue(leader) ? `${muniraKnowledge.name}'s spiritual leader is ${leader}.` : "I don't have this information." };
  }

  // Fallback for any general question mentioning Munira
  if (q.includes("munira")) {
    return { handled: true, response: "I don't have this information." };
  }

  return { handled: false, response: null };
}

module.exports = { getMuniraFact };