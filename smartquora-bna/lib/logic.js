/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';
/**
 * Write your transction processor functions here
 */

/**
 * Utility Functions
 */
function randomInRange(from, to) {
  var r = Math.random();
  return Math.round(Math.floor(r * (to - from) + from));
}

function generateId(header) {
  return header + "-" + randomInRange(1000, 9999999);
}

function isObjectInArray(myArray, myObject) {
  res = false;
  for (i = 0; i < myArray.length; i++) {
    if (myArray[i].getIdentifier() == myObject.getIdentifier())
      res = true;
  }
  return res;
}


function logInfo(message) {
  var event = getFactory().newEvent('smartquora.question', 'LogInfo');
  event.message = message;
  emit(event);
}

/**
 * CreateQuestion transaction
 * @param {smartquora.question.CreateQuestion} createQuestion
 * @transaction
 */
async function createQuestion(tx) {
  var qid;

  if ((typeof tx.id != 'undefined') && (tx.id !== null) && (tx.id.length != 0))
    qid = tx.id;
  else
    qid = generateId("question");

  var q = getFactory().newResource('smartquora.question', 'Question', qid);
  q.questionDesc = tx.questionDesc;
  q.status = 'CREATED';

  if (tx.offer <= 0)
    throw new Error("Offer should be a number greater than zero");

  q.stake = tx.offer;
  q.balance = tx.offer;
  q.timeCreated = new Date();

  // Awarding Time should be greater than question creation time
  var awardingTime = new Date(tx.awardingTime);
  if (awardingTime <= q.timeCreated)
    throw new Error("Awarding Time: " + awardingTime + " should be greater than question Creation Time: " + q.timeCreated);
  q.timeToAward = awardingTime;

  // Owner should be an existing SmartQuora user
  const participantRegistry = await getParticipantRegistry('smartquora.participant.QuoraUser');
  var existingUser = await participantRegistry.exists(tx.askedBy.getIdentifier());
  if (!existingUser)
    throw new Error("User: " + tx.askedBy + " does not exist!");
  q.owner = tx.askedBy;

  // Get the asset registry for the question.
  const assetRegistry = await getAssetRegistry('smartquora.question.Question');

  // Add the question to the asset registry
  await assetRegistry.add(q);


  // Emit an event for the added question.
  let event = getFactory().newEvent('smartquora.question', 'QuestionCreated');
  event.question = q;
  event.askedBy = tx.askedBy;
  event.questionId = qid;
  event.questionDesc = tx.questionDesc;
  event.offer = tx.offer;
  event.timeCreated = q.timeCreated;
  emit(event);
}

/**
 * Sample transaction
 * @param {smartquora.answer.CreateAnswer} createAnswer
 * @transaction
 */
async function createAnswer(tx) {
  var aid;

  if ((typeof tx.id != 'undefined') && (tx.id !== null) && (tx.id.length != 0))
    aid = tx.id;
  else
    aid = generateId("answer");

  var a = getFactory().newResource('smartquora.answer', 'Answer', aid);

  // AnsweredBy should be an existing SmartQuora user
  const participantRegistry = await getParticipantRegistry('smartquora.participant.QuoraUser');
  var userExists = await participantRegistry.exists(tx.answeredBy.getIdentifier());
  if (!userExists)
    throw new Error("User: " + tx.answeredBy + " does not exist!");
  a.owner = tx.answeredBy;

  // Question cannot be answered by the question owner
  var questionOwner = tx.associatedQuestion.owner;
  if (tx.answeredBy.getIdentifier() == questionOwner.getIdentifier()) {
    throw new Error("Question cannot be answered by the questioner");
  }

  // Question must exist
  var questionRegistry = await getAssetRegistry('smartquora.question.Question');
  var questionExists = await questionRegistry.exists(tx.associatedQuestion.getIdentifier());
  if (!questionExists)
    throw new Error("Question Id: " + tx.associatedQuestion.getIdentifier() + " does not exist!");
  a.associatedQuestion = tx.associatedQuestion;
  a.answerDesc = tx.answerDesc;
  a.status = 'CREATED';
  a.timeCreated = new Date();

  // Get the asset registry for the answer.
  const assetRegistry = await getAssetRegistry('smartquora.answer.Answer');

  // Add the answer to the asset registry
  await assetRegistry.add(a);

  // Emit an event for the added answer.
  let event = getFactory().newEvent('smartquora.answer', 'AnswerCreated');
  event.answerId = aid;
  event.answerDesc = tx.answerDesc;
  event.answeredBy = tx.answeredBy;
  event.associatedQuestion = tx.associatedQuestion;
  event.timeCreated = a.timeCreated;
  emit(event);
}

/**
 * Add Answer to Question transaction
 transaction AddAnswer {
  --> Question question
  --> Answer answer
}

event AnswerAdded {
  --> Question question
  --> Answer answer
}
 * @param {smartquora.question.AddAnswer} addAnswer
 * @transaction
 */
async function addAnswer(tx) {
  // Question must exist
  var questionRegistry = await getAssetRegistry('smartquora.question.Question');
  var questionExists = await questionRegistry.exists(tx.question.getIdentifier());
  if (!questionExists)
    throw new Error("Question Id: " + tx.question.getIdentifier() + " does not exist!");

  // Answer must exist
  var answerRegistry = await getAssetRegistry('smartquora.answer.Answer');
  var answerExists = await answerRegistry.exists(tx.answer.getIdentifier());
  if (!answerExists)
    throw new Error("Answer Id: " + tx.answer.getIdentifier() + " does not exist!");

  // Answer cannot be added after the awarding period starts
  var currentTime = new Date();
  if (currentTime >= tx.question.timeToAward)
    throw new Error("Answer :" + tx.answer.getIdentifier() + " cannot be added now. Answering period has elapsed!");

  if (typeof tx.question.answers == 'undefined')
    tx.question.answers = [];
  if (isObjectInArray(tx.question.answers, tx.answer))
    throw new Error("Answer: " + tx.answer.getIdentifier() + " was already added!");
  tx.question.answers.push(tx.answer);
  tx.question.status = 'ANSWERED';
  await questionRegistry.update(tx.question);

  // Emit an event for the added answer.
  let event = getFactory().newEvent('smartquora.question', 'AnswerAdded');
  event.question = tx.question;
  event.answer = tx.answer;
  emit(event);
}

/**
 * Vote Answer transaction
 * @param {smartquora.answer.VoteAnswer} voteAnswer
 * @transaction
 */
async function voteAnswer(tx) {
  // Answer must exist
  var answerRegistry = await getAssetRegistry('smartquora.answer.Answer');
  var answerExists = await answerRegistry.exists(tx.answer.getIdentifier());
  if (!answerExists)
    throw new Error("Answer Id: " + tx.answer.getIdentifier() + " does not exist!");

  // voter should be an existing SmartQuora user
  const participantRegistry = await getParticipantRegistry('smartquora.participant.QuoraUser');
  var userExists = await participantRegistry.exists(tx.voter.getIdentifier());
  if (!userExists)
    throw new Error("User: " + tx.voter + " does not exist!");

  if (tx.answer.owner.getIdentifier() == tx.voter.getIdentifier())
    throw new Error("You cannot vote for your own answers!");

  // Answer cannot be voted after the awarding period starts
  var currentTime = new Date();
  if (currentTime >= tx.answer.associatedQuestion.timeToAward)
    throw new Error("Answer :" + tx.answer.getIdentifier() + " cannot be voted now. Voting period has elapsed!");

  if (typeof tx.answer.voters == 'undefined')
    tx.answer.voters = [];
  if (isObjectInArray(tx.answer.voters, tx.voter))
    throw new Error("Voter: " + tx.voter.getIdentifier() + " has already voted!");
  tx.answer.voters.push(tx.voter);
  tx.answer.status = 'VOTED';
  if (tx.direction == 'UP')
    tx.answer.votes = tx.answer.votes + 1;
  else
    tx.answer.votes = tx.answer.votes - 1;
  if (tx.answer.votes < 0)
    tx.answer.votes = 0;
  await answerRegistry.update(tx.answer);

  // Emit an event for the answer voted.
  let event = getFactory().newEvent('smartquora.answer', 'AnswerVoted');
  event.answer = tx.answer;
  event.voter = tx.voter;
  event.currentVotes = tx.answer.votes;
  event.direction = tx.direction;
  event.timeVoted = new Date();
  emit(event);
}

/**
 * Award Answers to Question transaction
 * @param {smartquora.question.AwardAnswers} awardAnswers
 * @transaction
 */
async function awardAnswers(tx) {
  const participantRegistry = await getParticipantRegistry('smartquora.participant.QuoraUser');
  const answerRegistry = await getAssetRegistry('smartquora.answer.Answer');
  const questionRegistry = await getAssetRegistry('smartquora.question.Question');

  var questionList = [];
  var answerList = [];
  var participantList = [];

  // Question must exist
  var questionExists = await questionRegistry.exists(tx.question.getIdentifier());
  if (!questionExists)
    throw new Error("Question Id: " + tx.question.getIdentifier() + " does not exist!");

  // Answers cannot be added before the awarding period starts
  var currentTime = new Date();
  if (currentTime < tx.question.timeToAward)
    throw new Error("Question :" + tx.question.getIdentifier() + " cannot be awarded now. Answering period has not started yet!");

  if (tx.question.status == 'AWARDED')
    throw new Error("Question :" + tx.question.getIdentifier() + " has already been awarded");

  if (typeof tx.question.answers == 'undefined')
    tx.question.answers = [];
  var answerCount = tx.question.answers.length;
  if (answerCount == 0) {
    // No answers, return tokens back to the question Owner
    tx.question.owner.token = tx.question.owner.token + tx.question.balance;
    tx.question.balance = 0;
    tx.question.status = 'DEFAULTED';
    questionList.push(tx.question);
    participantList.push(tx.question.owner);
  } else {
    var totalVotes = 0;
    var originalBalance = tx.question.balance;
    var length = tx.question.answers.length;
    for (i = 0; i < length; i++) {
      var answer = tx.question.answers[i];
      totalVotes = totalVotes + answer.votes;
    }
    for (i = 0; i < length; i++) {
      var answer = tx.question.answers[i];
      var award = Math.round(answer.votes / totalVotes * originalBalance * 100)/100;
      //award = award.toFixed(2);
      answer.earnings = award;
      answer.status = 'AWARDED';
      answerList.push(answer);
      answer.owner.token = answer.owner.token + award;
      participantList.push(answer.owner);
      tx.question.balance = tx.question.balance - award;
      //tx.question.balance = tx.question.balance.toFixed(2);
      tx.question.owner.token = tx.question.owner.token - award;
    }
    tx.question.status = 'AWARDED';
    questionList.push(tx.question);
    participantList.push(tx.question.owner);
  }
  await questionRegistry.updateAll(questionList);
  await answerRegistry.updateAll(answerList);
  await participantRegistry.updateAll(participantList);

  // Emit an event for the added answer.
  let event = getFactory().newEvent('smartquora.question', 'AnswersAwarded');
  event.question = tx.question;
  event.timeAwarded = new Date();
  emit(event);
}
