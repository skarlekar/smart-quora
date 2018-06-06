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

  var owner = getCurrentParticipant();
  // Owner should be an existing SmartQuora user
  const participantRegistry = await getParticipantRegistry('smartquora.participant.QuoraUser');
  var existingUser = await participantRegistry.exists(owner.getIdentifier());
  if (!existingUser)
    throw new Error("User: " + tx.askedBy + " does not exist!");
  //q.owner = tx.askedBy;
  q.owner = owner;

    
  // **** Escrow update begins
  var e = getFactory().newResource('smartquora.question', 'Escrow', qid);
  e.status = 'CREATED';
  e.balance = tx.offer;
  const escrowRegistry = await getAssetRegistry('smartquora.question.Escrow');
  await escrowRegistry.add(e);
  owner.token = owner.token - tx.offer;
  const userRegistry = await getParticipantRegistry('smartquora.participant.QuoraUser');
  await userRegistry.update(owner);
  q.associatedEscrow = e;
  // **** Escrow update ends
  
  
  // Get the asset registry for the question.
  const assetRegistry = await getAssetRegistry('smartquora.question.Question');

  // Add the question to the asset registry
  await assetRegistry.add(q);

  // Emit an event for the added question.
  let event = getFactory().newEvent('smartquora.question', 'QuestionCreated');
  event.question = q;
  event.askedBy = owner;
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

  if ((typeof tx.answerId != 'undefined') && (tx.answerId !== null) && (tx.answerId.length != 0))
    aid = tx.answerId;
  else
    aid = generateId("answer");

  var a = getFactory().newResource('smartquora.answer', 'Answer', aid);
  var owner = getCurrentParticipant();

  // AnsweredBy should be an existing SmartQuora user
  const participantRegistry = await getParticipantRegistry('smartquora.participant.QuoraUser');
  var userExists = await participantRegistry.exists(owner.getIdentifier());
  if (!userExists)
    throw new Error("User: " + tx.answeredBy + " does not exist!");
  //a.owner = tx.answeredBy;
  a.owner = owner;

  // Question cannot be answered by the question owner
  var questionOwner = tx.associatedQuestion.owner;
  if (owner.getIdentifier() == questionOwner.getIdentifier()) {
    throw new Error("Question cannot be answered by the questioner");
  }

  // Question must exist
  var questionRegistry = await getAssetRegistry('smartquora.question.Question');
  var questionExists = await questionRegistry.exists(tx.associatedQuestion.getIdentifier());
  if (!questionExists)
    throw new Error("Question Id: " + tx.associatedQuestion.getIdentifier() + " does not exist!");

  // Answer cannot be added after the awarding period starts
  var currentTime = new Date();
  if (currentTime >= tx.associatedQuestion.timeToAward)
    throw new Error("Answer cannot be added now. Answering period has elapsed!");

  a.associatedQuestionId = tx.associatedQuestion.getIdentifier();
  a.answerDesc = tx.answerDesc;
  a.status = 'CREATED';
  a.timeCreated = new Date();

  // Get the asset registry for the answer.
  const assetRegistry = await getAssetRegistry('smartquora.answer.Answer');

  // Add the answer to the asset registry
  await assetRegistry.add(a);

  // Answer has been created. Now associate it with the question.
  // If there are no answers yet, initialize the answers array
  if (typeof tx.associatedQuestion.answers == 'undefined')
    tx.associatedQuestion.answers = [];
  tx.associatedQuestion.answers.push(a);
  tx.associatedQuestion.status = 'ANSWERED';
  await questionRegistry.update(tx.associatedQuestion);

  // Emit an event for the added answer.
  let event = getFactory().newEvent('smartquora.answer', 'AnswerCreated');
  event.answerId = aid;
  event.answerDesc = tx.answerDesc;
  event.answeredBy = owner;
  event.associatedQuestion = tx.associatedQuestion;
  event.timeCreated = a.timeCreated;
  emit(event);
}

/**
 * Vote Answer transaction
 * @param {smartquora.answer.VoteAnswer} voteAnswer
 * @transaction
 */
async function voteAnswer(tx) {
  const questionRegistry = await getAssetRegistry('smartquora.question.Question');
  // Answer must exist
  const answerRegistry = await getAssetRegistry('smartquora.answer.Answer');
  var answerExists = await answerRegistry.exists(tx.answer.getIdentifier());
  if (!answerExists)
    throw new Error("Answer Id: " + tx.answer.getIdentifier() + " does not exist!");

  var voter = getCurrentParticipant();
  console.log('@debug - Voter is: ' + voter);
  // voter should be an existing SmartQuora user
  const participantRegistry = await getParticipantRegistry('smartquora.participant.QuoraUser');
  var userExists = await participantRegistry.exists(voter.getIdentifier());
  if (!userExists)
    throw new Error("User: " + voter + " does not exist!");
  console.log('@debug - Voter exists!');

  if (tx.answer.owner.getIdentifier() == voter.getIdentifier())
    throw new Error("You cannot vote for your own answers!");

  var associatedQuestion = await questionRegistry.get(tx.answer.associatedQuestionId);

  // Answer cannot be voted after the awarding period starts
  var currentTime = new Date();
  if (currentTime >= associatedQuestion.timeToAward)
    throw new Error("Answer :" + tx.answer.getIdentifier() + " cannot be voted now. Voting period has elapsed!");

  if (typeof tx.answer.voters == 'undefined')
    tx.answer.voters = [];
  if (isObjectInArray(tx.answer.voters, voter))
    throw new Error("Voter: " + voter.getIdentifier() + " has already voted!");
  console.log('@debug - Voter has not already voted for this question');
  tx.answer.voters.push(voter);
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
  event.voter = voter;
  event.currentVotes = tx.answer.votes;
  event.direction = tx.direction;
  event.timeVoted = new Date();
  emit(event);
}

/**
 * Award Answers to Question transaction
 * @param {smartquora.question.AwardQuestion} awardQuestion
 * @transaction
 */
async function awardQuestion(tx) {
  const participantRegistry = await getParticipantRegistry('smartquora.participant.QuoraUser');
  const answerRegistry = await getAssetRegistry('smartquora.answer.Answer');
  const questionRegistry = await getAssetRegistry('smartquora.question.Question');
  const escrowRegistry = await getAssetRegistry('smartquora.question.Escrow');

  var questionList = [];
  var answerList = [];
  var participantList = [];
  var escrowList = [];

  // Question must exist
  var questionExists = await questionRegistry.exists(tx.question.getIdentifier());
  if (!questionExists)
    throw new Error("Question Id: " + tx.question.getIdentifier() + " does not exist!");

  // Answers cannot be added before the awarding period starts
  var currentTime = new Date();
  if (currentTime < tx.question.timeToAward)
    throw new Error("Question :" + tx.question.getIdentifier() + " cannot be awarded now. Awarding period has not started yet!");

  if (tx.question.status == 'AWARDED')
    throw new Error("Question :" + tx.question.getIdentifier() + " has already been awarded");
  
  var escrow = await escrowRegistry.get(tx.question.getIdentifier());

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
    var stake = tx.question.stake;
    var length = tx.question.answers.length;
    for (i = 0; i < length; i++) {
      var answer = tx.question.answers[i];
      totalVotes = totalVotes + answer.votes;
    }
    for (i = 0; i < length; i++) {
      var answer = tx.question.answers[i];
      var award = Math.round(answer.votes / totalVotes * stake * 100) / 100;
      //award = award.toFixed(2);
      answer.earnings = award;
      answer.status = 'AWARDED';
      answerList.push(answer);
      answer.owner.token = answer.owner.token + award;
      participantList.push(answer.owner);
      tx.question.balance = tx.question.balance - award;
      //tx.question.owner.token = tx.question.owner.token - award;
      escrow.balance = escrow.balance - award; 
    }
    escrow.status = 'RELEASED';
    escrowList.push(escrow);
    tx.question.status = 'AWARDED';
    questionList.push(tx.question);
    participantList.push(tx.question.owner);
  }
  await questionRegistry.updateAll(questionList);
  await answerRegistry.updateAll(answerList);
  await participantRegistry.updateAll(participantList);
  await escrowRegistry.updateAll(escrowList);

  // Emit an event for the added answer.
  let event = getFactory().newEvent('smartquora.question', 'QuestionAwarded');
  event.question = tx.question;
  event.timeAwarded = new Date();
  emit(event);
}
