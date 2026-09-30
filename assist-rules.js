/* MirrorFlow Assist — extended rule pack.
   Loaded before assist-engine.js. Adds data-driven rules on top of the core rules.
   Rule shape: { id, category, subtype, label, severity, confidence, pattern, replacement, message, safe, keepCase, guard }
   - replacement: string ($1.. expanded), function(match) or null (flag only)
   - safe:false  -> suggestion the user applies one at a time (never part of "Fix safe")
   - keepCase    -> copy the capitalisation of the matched text onto the replacement
   - guard(m,text) -> return false to skip a match (false-positive filter) */
(function () {
  "use strict";

  const regex = [], structural = [], tests = [], negatives = [];
  let tn = 100, nn = 100;

  function rule(id, category, subtype, label, severity, confidence, pattern, replacement, message, opts) {
    regex.push(Object.assign({ id, category, subtype, label, severity, confidence, pattern, replacement, message }, opts || {}));
  }
  const T = (ruleId, input, expectedReplacement) => tests.push({ id: "X-" + (++tn), ruleId, input, expectedReplacement });
  const N = (ruleId, input) => negatives.push({ id: "NX-" + (++nn), ruleId, input });

  /* ---------- spelling: common misspellings (one rule, case-preserving) ---------- */
  const TYPOS = {
    teh:"the", adn:"and", taht:"that", waht:"what", thier:"their", becuase:"because", becasue:"because", beacuse:"because",
    beleive:"believe", belive:"believe", freind:"friend", goverment:"government", neccessary:"necessary", necesary:"necessary",
    neccesary:"necessary", occured:"occurred", occurence:"occurrence", occurrance:"occurrence", occassion:"occasion",
    occassionally:"occasionally", untill:"until", wich:"which", whcih:"which", adress:"address", addres:"address",
    embarass:"embarrass", embarassed:"embarrassed", enviroment:"environment", existance:"existence", foward:"forward",
    gaurantee:"guarantee", garantee:"guarantee", guarentee:"guarantee", immediatly:"immediately", imediately:"immediately",
    immediatelly:"immediately", independant:"independent", knowlege:"knowledge", maintainance:"maintenance",
    millenium:"millennium", noticable:"noticeable", persistant:"persistent", posession:"possession", possesion:"possession",
    prefered:"preferred", publically:"publicly", recomend:"recommend", reccomend:"recommend", recommand:"recommend",
    relevent:"relevant", resturant:"restaurant", restaraunt:"restaurant", succesful:"successful", successfull:"successful",
    sucessful:"successful", suprise:"surprise", suprised:"surprised", truely:"truly", unfortunatly:"unfortunately",
    unfortunetly:"unfortunately", unfortunatley:"unfortunately", wierd:"weird", writting:"writing", acheive:"achieve",
    aggresive:"aggressive", agressive:"aggressive", apparant:"apparent", arguement:"argument", basicly:"basically",
    calender:"calendar", catagory:"category", collegue:"colleague", colleauge:"colleague", comming:"coming",
    commited:"committed", completly:"completely", concious:"conscious", curiousity:"curiosity", definatly:"definitely",
    definitly:"definitely", dissapoint:"disappoint", dissapointed:"disappointed", dissapointing:"disappointing",
    excercise:"exercise", familar:"familiar", finaly:"finally", fourty:"forty", gratefull:"grateful", happend:"happened",
    harrass:"harass", heighth:"height", ignorence:"ignorance", intrest:"interest", lenght:"length", lisence:"licence",
    mispell:"misspell", neice:"niece", oppurtunity:"opportunity", opertunity:"opportunity", orignal:"original",
    paralel:"parallel", peice:"piece", percieve:"perceive", priviledge:"privilege", probaly:"probably", probly:"probably",
    pronounciation:"pronunciation", realy:"really", reciept:"receipt", recieved:"received", recieving:"receiving",
    refering:"referring", refered:"referred", rember:"remember", remeber:"remember", responsability:"responsibility",
    responsibilty:"responsibility", rythm:"rhythm", sentance:"sentence", sieze:"seize", sincerly:"sincerely",
    speach:"speech", strenght:"strength", tendancy:"tendency", thourough:"thorough", throught:"through", tounge:"tongue",
    tomorow:"tomorrow", tommorrow:"tomorrow", tomorrrow:"tomorrow", twelth:"twelfth", undoubtably:"undoubtedly",
    usefull:"useful", vaccum:"vacuum", vegatable:"vegetable", visable:"visible", withold:"withhold", yeild:"yield",
    youself:"yourself", anwser:"answer", begining:"beginning", beleif:"belief", buisness:"business", bussiness:"business",
    cutomer:"customer", custmer:"customer", custommer:"customer", customar:"customer", delivary:"delivery",
    delievery:"delivery", delivry:"delivery", diffrent:"different", diferent:"different", differnt:"different",
    dicount:"discount", discout:"discount", efficent:"efficient", eligable:"eligible", emial:"email", exept:"except",
    experiance:"experience", explaination:"explanation", extreamly:"extremely", facilty:"facility", favourate:"favourite",
    febuary:"february", fullfil:"fulfil", incase:"in case", inconvienience:"inconvenience", inconvinience:"inconvenience",
    inconveniance:"inconvenience", infomation:"information", informaton:"information", intial:"initial",
    interupt:"interrupt", invoce:"invoice", invioce:"invoice", langauge:"language", liason:"liaison", mannager:"manager",
    managment:"management", mesage:"message", messege:"message", mesages:"messages", nessecary:"necessary", noone:"no one",
    notifiy:"notify", obvioulsy:"obviously", obviosly:"obviously", ocasion:"occasion", offical:"official",
    paymnt:"payment", payement:"payment", plese:"please", pleae:"please", proccess:"process", procces:"process",
    proccessed:"processed", proffesional:"professional", profesional:"professional", promiss:"promise",
    quaility:"quality", quater:"quarter", questionaire:"questionnaire", refudn:"refund", regaurds:"regards",
    registeration:"registration", reponse:"response", repsonse:"response", requirment:"requirement", reserach:"research",
    safty:"safety", satisified:"satisfied", scedule:"schedule", schedual:"schedule", shedule:"schedule",
    seperately:"separately", seperated:"separated", seperating:"separating", sevice:"service", servise:"service",
    shippment:"shipment", shiping:"shipping", similiar:"similar", simular:"similar", situtation:"situation",
    somthing:"something", somwhere:"somewhere", statment:"statement", stoped:"stopped", subcription:"subscription",
    subscibe:"subscribe", suceed:"succeed", supposably:"supposedly", techincal:"technical", temperture:"temperature",
    thankyou:"thank you", thnaks:"thanks", transfered:"transferred", truble:"trouble", unecessary:"unnecessary",
    unneccessary:"unnecessary", usualy:"usually", vehical:"vehicle", verfiy:"verify", verifiy:"verify",
    wensday:"wednesday", wendsday:"wednesday", wednesay:"wednesday", wheather:"weather", writen:"written",
    yesturday:"yesterday", yeserday:"yesterday", accross:"across", agian:"again", allready:"already", alway:"always",
    alwyas:"always", anual:"annual", apointment:"appointment", appointmnet:"appointment", apoligise:"apologise",
    awsome:"awesome", boook:"book", bookign:"booking", cancelation:"cancellation",
    chnage:"change", chagne:"change", clarrify:"clarify", confimation:"confirmation",
    confrim:"confirm", confrimed:"confirmed", cosnider:"consider", coudl:"could", cusotmer:"customer",
    dependant:"dependent", desicion:"decision", developement:"development", enought:"enough", equiped:"equipped", excellant:"excellent", exisiting:"existing", fewwer:"fewer", follwing:"following",
    goign:"going", hapen:"happen", hopfully:"hopefully", hwo:"how", inital:"initial",
    knwo:"know", lastest:"latest", leaveing:"leaving", loosing:"losing",
    mabye:"maybe", mesaged:"messaged", mnager:"manager", nothign:"nothing", nubmer:"number",
    numbr:"number", otehr:"other", pasword:"password",
    passwrod:"password", pemission:"permission", persue:"pursue", phonecall:"phone call", planing:"planning",
    posible:"possible", possibilty:"possibility", pourpose:"purpose", preferance:"preference", presense:"presence",
    prolem:"problem", porblem:"problem", promptley:"promptly", provid:"provide", recive:"receive",
    reciever:"receiver", reffered:"referred", refrence:"reference", regester:"register", relase:"release",
    remaind:"remind", reqest:"request", requrest:"request", reschedual:"reschedule",
    rescheudle:"reschedule", resloved:"resolved", resovle:"resolve", responce:"response", retun:"return", sceduled:"scheduled",
    secuirty:"security", shoud:"should", shuold:"should", stauts:"status",
    suport:"support", supprt:"support", tehm:"them", tehn:"then", theese:"these", thoose:"those", timeing:"timing",
    tiket:"ticket", tikcet:"ticket", tomorrw:"tomorrow", transfering:"transferring", udpate:"update",
    updaet:"update", updte:"update", usally:"usually", waiitng:"waiting", wating:"waiting", woudl:"would", yoru:"your", yuor:"your"
  };

  function matchCase(original, replacement) {
    if (!replacement) return replacement;
    if (original.length > 1 && original === original.toUpperCase()) return replacement.toUpperCase();
    if (original[0] === original[0].toUpperCase() && original[0] !== original[0].toLowerCase()) {
      return replacement[0].toUpperCase() + replacement.slice(1);
    }
    return replacement;
  }
  const typoKeys = Object.keys(TYPOS).sort((a, b) => b.length - a.length);
  rule("grammar.spelling.common_typos", "grammar", "spelling", "Spelling", "medium", 0.95,
    new RegExp("\\b(?:" + typoKeys.join("|") + ")\\b", "gi"),
    m => matchCase(m[0], TYPOS[m[0].toLowerCase()]),
    (m, rep) => "\u201c" + m[0] + "\u201d is a common misspelling of \u201c" + rep + "\u201d.");
  T("grammar.spelling.common_typos", "Please confrim the apointment.", "confirm");
  T("grammar.spelling.common_typos", "Thier order is delayed.", "Their");
  T("grammar.spelling.common_typos", "Your refudn is on its way.", "refund");
  N("grammar.spelling.common_typos", "Please confirm the appointment and the refund.");

  /* ---------- confusable words (context-checked) ---------- */
  rule("grammar.confusion.your_youre", "grammar", "confusion", "Your / you're", "high", 0.90,
    /\byour (going|being|not|doing|getting|having|ready|sure|able|correct|wrong|already|always|never|still|very|so)\b/gi,
    "you're $1", "Use 'you're' (you are) before this word.", { keepCase: true });
  T("grammar.confusion.your_youre", "I think your going to like this.", "you're going");
  N("grammar.confusion.your_youre", "Your order is ready and your account is active.");

  rule("grammar.confusion.youre_your", "grammar", "confusion", "You're / your", "high", 0.92,
    /\byou're (account|order|booking|email|message|reply|refund|payment|request|help|time|name|number|card|address|details|invoice|feedback|patience|support|understanding|call|query|ticket|case)\b/gi,
    "your $1", "Use 'your' (belonging to you) before a noun.", { keepCase: true });
  T("grammar.confusion.youre_your", "Thanks for you're patience.", "your patience");
  N("grammar.confusion.youre_your", "You're welcome, and you're going to hear from us.");

  rule("grammar.confusion.for_you_your", "grammar", "confusion", "You / your", "high", 0.90,
    /\b(for|of|in|on|with|about|from|to) you (help|time|patience|email|message|order|booking|account|reply|response|feedback|support|understanding|call|query|ticket|request|enquiry|inquiry)\b/gi,
    "$1 your $2", "Use 'your' before this noun.", { keepCase: true });
  T("grammar.confusion.for_you_your", "Thank you for you help.", "for your help");
  N("grammar.confusion.for_you_your", "I will call you back and email you.");

  rule("grammar.confusion.their_there", "grammar", "confusion", "There / their", "medium", 0.80,
    /\btheir (is|are|was|were|will be|has been|have been)\b/gi,
    "there $1", "Use 'there' to introduce or locate something.", { keepCase: true, safe: false });
  T("grammar.confusion.their_there", "Their is a problem with the file.", "There is");
  rule("grammar.confusion.there_their", "grammar", "confusion", "Their / there", "medium", 0.85,
    /\b(?:there|they're) (car|phone|account|order|booking|email|address|team|details|website|application|claim|policy|payment|refund|card|name|number)\b/gi,
    "their $1", "Use 'their' to show belonging.", { keepCase: true });
  T("grammar.confusion.there_their", "I have sent there refund.", "their refund");
  N("grammar.confusion.there_their", "Their order is ready and there is a delay.");
  rule("grammar.confusion.there_theyre", "grammar", "confusion", "There / they're", "medium", 0.85,
    /\bthere (going|doing|being|coming|not|always|still)\b/gi,
    "they're $1", "Use 'they're' (they are) here.", { keepCase: true, safe: false });
  T("grammar.confusion.there_theyre", "I asked and there going to check.", "they're going");

  rule("grammar.confusion.its_its", "grammar", "confusion", "Its / it's", "medium", 0.86,
    /\bits (a|an|the|not|going|too|very|really|fine|ok|okay|done|ready|possible|important|clear)\b/gi,
    "it's $1", "Use 'it's' (it is / it has) here.", { keepCase: true });
  T("grammar.confusion.its_its", "Its the best option.", "It's the");
  N("grammar.confusion.its_its", "The system updated its records and its own log.");
  rule("grammar.confusion.its_possessive", "grammar", "confusion", "It's / its", "medium", 0.84,
    /\bit's (own|name|value|purpose|features?)\b/gi,
    "its $1", "Use 'its' (belonging to it) here.", { keepCase: true });
  T("grammar.confusion.its_possessive", "The app lost it's settings? Check it's name.", "its name");

  rule("grammar.confusion.then_than", "grammar", "confusion", "Then / than", "medium", 0.86,
    /\b(better|worse|more|rather|other|faster|slower|bigger|smaller|higher|lower|greater|fewer|earlier|longer|shorter|cheaper) then\b/gi,
    "$1 than", "Use 'than' to compare.", { keepCase: true });
  T("grammar.confusion.then_than", "This is better then before.", "better than");
  N("grammar.confusion.then_than", "Try that first, then let me know.");

  rule("grammar.confusion.to_too_amount", "grammar", "confusion", "To / too", "medium", 0.94,
    /\bto (much|many)\b/gi, "too $1", "Use 'too' to mean 'excessively'.", { keepCase: true });
  T("grammar.confusion.to_too_amount", "That is to much to ask.", "too much");
  rule("grammar.confusion.to_too_adj", "grammar", "confusion", "To / too", "medium", 0.80,
    /\bto (late|early|long|soon|big|small|far|slow|fast|busy|difficult|expensive|complicated)\b(?! (?:be|do|the|a|an|check|send))/gi,
    "too $1", "Use 'too' to mean 'excessively'.", { keepCase: true, safe: false });
  T("grammar.confusion.to_too_adj", "It is to late to change the booking.", "too late");
  rule("grammar.confusion.too_to", "grammar", "confusion", "Too / to", "medium", 0.84,
    /\b(?:need|want|going|have|able|try|trying|happy|glad|sorry) too (be|do|see|check|send|get|make|have|help|let|find|update|confirm|contact)\b/gi,
    m => m[0].replace(/ too /i, " to "), "Use 'to' before a verb.", { safe: false });
  T("grammar.confusion.too_to", "I am happy too help.", "happy to help");

  rule("grammar.confusion.loose_lose", "grammar", "confusion", "Lose / loose", "medium", 0.84,
    /\bloose (my|your|access|money|track|data|signal|connection)\b/gi,
    "lose $1", "Use 'lose' (the verb) here.", { keepCase: true, safe: false });
  T("grammar.confusion.loose_lose", "You will not loose your data.", "lose your");

  rule("grammar.confusion.advise_verb", "grammar", "confusion", "Advice / advise", "medium", 0.88,
    /\b(please|we|i|can|will|would|could|should) advice\b/gi,
    "$1 advise", "'Advise' is the verb; 'advice' is the noun.", { keepCase: true });
  T("grammar.confusion.advise_verb", "Please advice me on the next step.", "Please advise");
  rule("grammar.confusion.advice_noun", "grammar", "confusion", "Advice / advise", "medium", 0.88,
    /\b(some|any|good|my|your|the|this|that|our|useful|helpful|professional|legal) advise\b/gi,
    "$1 advice", "'Advice' is the noun; 'advise' is the verb.", { keepCase: true });
  T("grammar.confusion.advice_noun", "Thanks for the advise.", "the advice");
  N("grammar.confusion.advice_noun", "We advise you to wait.");

  rule("grammar.confusion.affect_effect_noun", "grammar", "confusion", "Effect / affect", "medium", 0.82,
    /\b(an|the|no|any|little|positive|negative|adverse|significant|major|minor|side|big) affect\b/gi,
    "$1 effect", "As a noun, use 'effect'.", { keepCase: true, safe: false });
  T("grammar.confusion.affect_effect_noun", "There was no affect on the balance.", "no effect");
  rule("grammar.confusion.effect_affect_verb", "grammar", "confusion", "Affect / effect", "medium", 0.78,
    /\b(may|might|could|would|does|did) effect (the|your|our|my|this|that)\b/gi,
    "$1 affect $2", "As a verb meaning 'influence', use 'affect'.", { keepCase: true, safe: false });
  T("grammar.confusion.effect_affect_verb", "This might effect your booking.", "might affect your");

  rule("grammar.confusion.whos_whose", "grammar", "confusion", "Who's / whose", "medium", 0.86,
    /\bwho's (car|phone|account|order|booking|email|fault|turn|name|number)\b/gi,
    "whose $1", "Use 'whose' to show belonging.", { keepCase: true });
  T("grammar.confusion.whos_whose", "Who's account is this?", "Whose account");
  rule("grammar.confusion.whose_whos", "grammar", "confusion", "Whose / who's", "medium", 0.84,
    /\bwhose (going|coming|been|responsible|next)\b/gi,
    "who's $1", "Use 'who's' (who is / who has) here.", { keepCase: true });
  T("grammar.confusion.whose_whos", "Whose going to call you?", "Who's going");

  rule("grammar.verb_modal.might_may_of", "grammar", "verb_form", "Modal verb form", "high", 0.96,
    /\b(might|may) of\b/gi, "$1 have", "Use 'have' after this modal verb.");
  T("grammar.verb_modal.might_may_of", "It might of been missed.", "might have");

  /* ---------- agreement & verb form ---------- */
  rule("grammar.agreement.doesnt_agree", "grammar", "agreement", "Subject-verb agreement", "high", 0.95,
    /\b(he|she|it) (?:don't|dont)\b/gi, "$1 doesn't", "Use 'doesn't' with he, she or it.", { keepCase: true });
  T("grammar.agreement.doesnt_agree", "It don't match the record.", "It doesn't");
  rule("grammar.agreement.were_was", "grammar", "agreement", "Subject-verb agreement", "high", 0.90,
    /\b(they|we|you) was\b/gi, "$1 were", "Use 'were' with they, we or you.", { keepCase: true });
  T("grammar.agreement.were_was", "They was told earlier.", "They were");
  rule("grammar.agreement.i_you_has", "grammar", "agreement", "Subject-verb agreement", "high", 0.95,
    /\b([Ii]|you|they) has\b/g, m => (m[1] === "i" ? "I" : m[1]) + " have", "Use 'have' with I, you or they.");
  T("grammar.agreement.i_you_has", "I has sent the file.", "I have");
  rule("grammar.agreement.i_are_is", "grammar", "agreement", "Subject-verb agreement", "high", 0.95,
    /\b(I) (?:is|are)\b/g, "I am", "Use 'am' with I.");
  T("grammar.agreement.i_are_is", "I is checking now.", "I am");
  rule("grammar.agreement.you_is", "grammar", "agreement", "Subject-verb agreement", "high", 0.92,
    /\b(you|we|they) is\b/gi, "$1 are", "Use 'are' with you, we or they.", { keepCase: true });
  T("grammar.agreement.you_is", "You is right.", "You are");
  rule("grammar.agreement.third_have", "grammar", "agreement", "Subject-verb agreement", "medium", 0.85,
    /(?<!\b(?:does|did|do|can|will|would|could|should|must|may|might|let|make|help|get|want|if|whether)\s+)\b(he|she|it) have\b/gi,
    "$1 has", "Use 'has' with he, she or it.", { keepCase: true, safe: false });
  T("grammar.agreement.third_have", "She have the details.", "She has");
  N("grammar.agreement.third_have", "Does it have a reference? Let it have time.");
  rule("grammar.agreement.everyone_singular", "grammar", "agreement", "Subject-verb agreement", "medium", 0.88,
    /\b(everyone|everybody|nobody|someone|somebody) (are|were)\b/gi,
    m => m[1] + " " + (/^are$/i.test(m[2]) ? "is" : "was"), "These words take a singular verb.");
  T("grammar.agreement.everyone_singular", "Everyone are happy.", "Everyone is");
  rule("grammar.agreement.this_these", "grammar", "agreement", "This / these", "medium", 0.90,
    /\b(this|that) (things|items|orders|issues|problems|customers|errors|charges|payments|bookings|emails|messages|options)\b/gi,
    m => (/^this$/i.test(m[1]) ? "these " : "those ") + m[2], "Use a plural demonstrative with a plural noun.");
  T("grammar.agreement.this_these", "This issues are fixed.", "these issues");
  const PL = "thing|item|order|issue|problem|customer|error|charge|payment|booking|email|message|option|reason|day|week|time|change|update|detail|document|file|refund|delay|request|question|ticket";
  rule("grammar.agreement.these_plural", "grammar", "agreement", "Plural noun", "medium", 0.90,
    new RegExp("\\b(these|those|many|several|multiple|numerous|various|both|a few|a couple of) (" + PL + ")\\b(?!s)", "gi"),
    "$1 $2s", "Use the plural noun here.", { keepCase: true });
  T("grammar.agreement.these_plural", "There were several issue with the booking.", "several issues");
  N("grammar.agreement.these_plural", "Both options work and several issues are fixed.");
  rule("grammar.agreement.number_plural", "grammar", "agreement", "Plural noun", "medium", 0.76,
    /\b([2-9]|[1-9]\d+|two|three|four|five|six|seven|eight|nine|ten|twelve|twenty) (day|week|hour|minute|month|year|item|order|booking|payment|charge|customer|attempt|call|email|message|ticket|refund)\b(?![s'\-])/gi,
    "$1 $2s", "Use the plural after a number above one.", { keepCase: true, safe: false });
  T("grammar.agreement.number_plural", "Please allow 3 day for the refund.", "3 days");
  rule("grammar.agreement.one_singular", "grammar", "agreement", "Singular noun", "medium", 0.90,
    /\b(1|one) (days|weeks|hours|minutes|months|years|items|orders)\b/gi,
    m => m[1] + " " + m[2].slice(0, -1), "Use the singular after one.");
  T("grammar.agreement.one_singular", "It takes 1 days.", "1 day");

  rule("grammar.verb.past_participle", "grammar", "verb_form", "Verb form", "high", 0.90,
    /\b(have|has|had) (went|saw|came|took|gave|wrote|did)\b/gi,
    m => m[1] + " " + ({ went:"gone", saw:"seen", came:"come", took:"taken", gave:"given", wrote:"written", did:"done" })[m[2].toLowerCase()],
    "Use the past participle after 'have/has/had'.", { keepCase: false });
  T("grammar.verb.past_participle", "We have went ahead.", "have gone");
  N("grammar.verb.past_participle", "They had done the work and have seen it.");
  rule("grammar.verb.after_aux_past", "grammar", "verb_form", "Verb form", "high", 0.82,
    /\b(to|will|can|could|would|should|must|may|might|did|does|do|didn't|doesn't|don't|won't|can't|couldn't|wouldn't|shouldn't) (went|saw|came|took|gave|ran|ate|wrote|sent|made|got)\b/gi,
    m => m[1] + " " + ({ went:"go", saw:"see", came:"come", took:"take", gave:"give", ran:"run", ate:"eat", wrote:"write", sent:"send", made:"make", got:"get" })[m[2].toLowerCase()],
    "Use the base verb here.", { safe: false });
  T("grammar.verb.after_aux_past", "We did sent the form.", "did send");
  N("grammar.verb.after_aux_past", "The email was sent and the form was made.");
  rule("grammar.verb.suppose_to", "grammar", "verb_form", "Verb form", "medium", 0.94,
    /\bsuppose to\b/gi, "supposed to", "Use 'supposed to'.", { keepCase: true });
  T("grammar.verb.suppose_to", "It was suppose to arrive.", "supposed to");
  rule("grammar.verb.look_forward", "grammar", "verb_form", "Verb form", "medium", 0.92,
    /\blook(?:ing)? forward to (hear|see|speak|talk|receive|get|meet|work|read)\b/gi,
    m => m[0].replace(/(hear|see|speak|talk|receive|get|meet|work|read)$/i, w => ({ hear:"hearing", see:"seeing", speak:"speaking", talk:"talking", receive:"receiving", get:"getting", meet:"meeting", work:"working", read:"reading" })[w.toLowerCase()]),
    "Use the -ing form after 'look forward to'.");
  T("grammar.verb.look_forward", "I look forward to hear from you.", "look forward to hearing");
  N("grammar.verb.look_forward", "I look forward to hearing from you.");
  rule("grammar.verb.i_am_agree", "grammar", "verb_form", "Verb form", "medium", 0.92,
    /\bI am agree\b/g, "I agree", "Use 'I agree'.");
  T("grammar.verb.i_am_agree", "I am agree with this.", "I agree");
  rule("grammar.verb.discuss_about", "grammar", "verb_form", "Extra word", "medium", 0.90,
    /\bdiscuss(es|ed|ing)? about\b/gi, m => "discuss" + (m[1] || ""), "'Discuss' does not need 'about'.");
  T("grammar.verb.discuss_about", "We can discuss about the plan.", "discuss");
  rule("grammar.verb.explain_me", "grammar", "verb_form", "Verb form", "medium", 0.85,
    /\bexplain me\b/gi, "explain to me", "Use 'explain to me'.", { keepCase: true, safe: false });
  T("grammar.verb.explain_me", "Can you explain me the charge?", "explain to me");
  rule("grammar.verb.can_able", "grammar", "verb_form", "Verb form", "medium", 0.90,
    /\bcan able to\b/gi, "can", "Use 'can' or 'be able to', not both.", { keepCase: true });
  T("grammar.verb.can_able", "We can able to help.", "can");
  rule("grammar.verb.double_negative", "grammar", "verb_form", "Double negative", "medium", 0.86,
    /\b(don't|doesn't|didn't|haven't|hasn't|can't) (have|got|see|know|want|need|find) no\b/gi,
    "$1 $2 any", "Avoid the double negative.", { safe: false });
  T("grammar.verb.double_negative", "We don't have no record of it.", "don't have any");
  rule("grammar.verb.hardly", "grammar", "verb_form", "Double negative", "medium", 0.88,
    /\b(can't|cannot|couldn't) hardly\b/gi,
    m => ({ "can't":"can", cannot:"can", "couldn't":"could" })[m[1].toLowerCase()] + " hardly", "'Hardly' is already negative.");
  T("grammar.verb.hardly", "I can't hardly hear you.", "can hardly");
  rule("grammar.verb.please_phrasal", "grammar", "verb_form", "Verb form", "medium", 0.88,
    /\b(please|to|can|will|should|must|could) (login|setup|signup|checkout|backup|logon)\b/gi,
    m => m[1] + " " + ({ login:"log in", setup:"set up", signup:"sign up", checkout:"check out", backup:"back up", logon:"log on" })[m[2].toLowerCase()],
    "As a verb this is two words.", { keepCase: false });
  T("grammar.verb.please_phrasal", "Please login to your account.", "Please log in");
  N("grammar.verb.please_phrasal", "Use your login and the setup guide.");

  rule("grammar.wording.less_fewer", "grammar", "wording", "Less / fewer", "low", 0.80,
    /\bless (customers|orders|items|errors|issues|mistakes|bookings|calls|people|emails|messages|payments|charges|tickets|problems|delays|refunds|complaints)\b/gi,
    "fewer $1", "Use 'fewer' with things you can count.", { keepCase: true, safe: false });
  T("grammar.wording.less_fewer", "We had less complaints this week.", "fewer complaints");
  rule("grammar.wording.amount_number", "grammar", "wording", "Amount / number", "low", 0.80,
    /\bamount of (customers|people|orders|items|errors|issues|calls|emails|messages|tickets|bookings|payments|complaints)\b/gi,
    "number of $1", "Use 'number of' with countable things.", { safe: false });
  T("grammar.wording.amount_number", "A large amount of orders arrived.", "number of orders");
  rule("grammar.wording.irregardless", "grammar", "wording", "Word choice", "medium", 0.92,
    /\birregardless\b/gi, "regardless", "'Irregardless' is non-standard.", { keepCase: true });
  T("grammar.wording.irregardless", "Irregardless of the cost, we will help.", "Regardless");
  rule("grammar.wording.despite_of", "grammar", "wording", "Word choice", "medium", 0.90,
    /\bdespite of\b/gi, "despite", "Use 'despite' or 'in spite of'.", { keepCase: true });
  T("grammar.wording.despite_of", "Despite of the delay, we shipped.", "Despite");
  rule("grammar.wording.on_accident", "grammar", "wording", "Word choice", "low", 0.85,
    /\bon accident\b/gi, "by accident", "The usual phrase is 'by accident'.");
  T("grammar.wording.on_accident", "It was sent on accident.", "by accident");
  rule("grammar.wording.in_the_meantime", "grammar", "wording", "Word choice", "low", 0.92,
    /\bin the mean time\b/gi, "in the meantime", "'Meantime' is one word.");
  T("grammar.wording.in_the_meantime", "In the mean time, please wait.", "in the meantime");
  rule("grammar.wording.thanks_advance", "grammar", "wording", "Word choice", "medium", 0.94,
    /\bthanks? in advanced\b/gi, m => m[0].replace(/advanced$/i, "advance"), "Use 'in advance'.");
  T("grammar.wording.thanks_advance", "Thanks in advanced.", "Thanks in advance");
  rule("grammar.wording.kind_regards", "grammar", "wording", "Sign-off", "low", 0.90,
    /\b(kind|best|warm|warmest) regard\b/gi, "$1 regards", "Sign-offs use 'regards'.", { keepCase: true });
  T("grammar.wording.kind_regards", "Kind regard,\nSam", "Kind regards");
  rule("grammar.wording.anyways", "grammar", "wording", "Word choice", "low", 0.70,
    /\banyways\b/gi, "anyway", "'Anyway' is the standard form.", { keepCase: true });
  T("grammar.wording.anyways", "Anyways, I will check.", "Anyway");
  rule("grammar.wording.ain_t", "grammar", "wording", "Informal word", "low", 0.85,
    /\bain't\b/gi, null, "Too informal for most replies. Use 'isn't', 'aren't' or 'haven't'.");
  T("grammar.wording.ain_t", "That ain't right.", null);

  /* more missing-apostrophe contractions (one rule, case-preserving) */
  const APOS = { thats:"that's", whats:"what's", heres:"here's", theres:"there's", hasnt:"hasn't", havent:"haven't",
    isnt:"isn't", arent:"aren't", wasnt:"wasn't", werent:"weren't", didnt:"didn't", hadnt:"hadn't", mustnt:"mustn't",
    theyre:"they're", youll:"you'll", theyll:"they'll", youve:"you've", weve:"we've", theyve:"they've", hes:"he's",
    shes:"she's", whos:"who's", shouldve:"should've", wouldve:"would've", couldve:"could've", wheres:"where's" };
  rule("grammar.contraction.missing_apostrophe", "grammar", "contraction", "Missing apostrophe", "medium", 0.88,
    new RegExp("\\b(?:" + Object.keys(APOS).join("|") + ")\\b", "gi"),
    m => matchCase(m[0], APOS[m[0].toLowerCase()]), (m, rep) => "Use the apostrophe: \u201c" + rep + "\u201d.");
  T("grammar.contraction.missing_apostrophe", "I havent seen it and thats fine.", "haven't");
  N("grammar.contraction.missing_apostrophe", "That's fine and I haven't seen it.");

  /* ---------- punctuation & capitalisation ---------- */
  rule("grammar.punctuation.double_comma", "grammar", "punctuation", "Repeated comma", "low", 0.95,
    /,{2,}/g, ",", "Remove the extra comma.");
  T("grammar.punctuation.double_comma", "Thanks,, I will check.", ",");
  rule("grammar.punctuation.two_dots", "grammar", "punctuation", "Full stops", "low", 0.86,
    /(?<![.])\.\.(?![.])/g, ".", "Use one full stop, or three dots for an ellipsis.");
  T("grammar.punctuation.two_dots", "I will check..", ".");
  N("grammar.punctuation.two_dots", "Let me see... I will check.");
  rule("grammar.punctuation.colon_spacing", "grammar", "punctuation", "Spacing after colon", "low", 0.86,
    /(?<=[a-z]{2}):(?=[A-Za-z])(?!\/\/)/g, ": ", "Add a space after the colon.");
  T("grammar.punctuation.colon_spacing", "Note:this is final.", ": ");
  N("grammar.punctuation.colon_spacing", "Open https://example.com or use 10:30.");
  rule("grammar.punctuation.semicolon_spacing", "grammar", "punctuation", "Semicolon spacing", "low", 0.86,
    /\s+;|;(?=[A-Za-z])/g, m => (m[0] === ";" ? "; " : ";"), "Semicolons have no space before and one after.");
  T("grammar.punctuation.semicolon_spacing", "It works ; try it.", ";");
  rule("grammar.punctuation.intro_comma", "grammar", "punctuation", "Comma after opener", "low", 0.90,
    /(?<=^|[.!?]\s+|\n)(However|Unfortunately|Therefore|Additionally|Meanwhile|Otherwise|Fortunately|Sadly|Thankfully|Firstly|Secondly|Alternatively|Anyway)(?=\s+[A-Za-z])/g,
    "$1,", "Add a comma after this opening word.");
  T("grammar.punctuation.intro_comma", "Unfortunately we cannot do that.", "Unfortunately,");
  N("grammar.punctuation.intro_comma", "Unfortunately, we cannot do that.");
  rule("grammar.punctuation.greeting_comma", "grammar", "punctuation", "Comma after greeting", "low", 0.90,
    /(?<=^|[.!?]\s+|\n)(Hi|Hello|Hey|Dear)( [A-Z][a-z]+)(?![,.!:;?\w-])(?!\s+(?:or|and)\b)(?=[ \n])/g,
    "$1$2,", "Add a comma after the name in a greeting.");
  T("grammar.punctuation.greeting_comma", "Hi Sam I checked the order.", "Hi Sam,");
  N("grammar.punctuation.greeting_comma", "Hi Sam, I checked the order. Dear Sir or Madam, hello.");
  rule("grammar.capitalization.day_month", "grammar", "capitalization", "Capitalise days and months", "low", 0.92,
    /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|january|february|april|june|july|august|september|october|november|december)\b/g,
    m => m[0][0].toUpperCase() + m[0].slice(1), "Days and months start with a capital letter.");
  T("grammar.capitalization.day_month", "See you on friday.", "Friday");
  N("grammar.capitalization.day_month", "See you on Friday in March.");

  /* ---------- clarity: wordiness, redundancy, jargon ---------- */
  const W = (id, label, conf, re, repl, msg, opts) => rule("clarity.wordiness." + id, "clarity", "wordiness", label, "low", conf, re, repl, msg, Object.assign({ keepCase: true }, opts || {}));
  W("a_number_of", "Wordy phrase", 0.72, /\ba number of\b/gi, "several", "Use a simpler quantity word.", { safe: false });
  W("is_able_to", "Wordy phrase", 0.78, /\b(?:is|are) able to\b/gi, "can", "Use 'can'.");
  W("has_ability", "Wordy phrase", 0.80, /\b(?:has|have) the ability to\b/gi, "can", "Use 'can'.");
  W("despite_fact", "Wordy phrase", 0.88, /\b(?:in spite of|despite) the fact that\b/gi, "although", "Use 'although'.");
  W("light_of_fact", "Wordy phrase", 0.88, /\b(?:in light of the fact that|for the reason that|owing to the fact that)\b/gi, "because", "Use 'because'.");
  W("at_present_time", "Wordy phrase", 0.86, /\bat the present time\b|\bat this time\b/gi, "now", "Use 'now'.");
  W("with_exception", "Wordy phrase", 0.86, /\bwith the exception of\b/gi, "except", "Use 'except'.");
  W("take_consideration", "Wordy phrase", 0.86, /\btake into consideration\b/gi, "consider", "Use the verb directly.");
  W("make_contact", "Wordy phrase", 0.86, /\bmake contact with\b/gi, "contact", "Use the verb directly.");
  W("make_attempt", "Wordy phrase", 0.86, /\bmake an attempt to\b/gi, "try to", "Use 'try to'.");
  W("as_result_of", "Wordy phrase", 0.84, /\bas a result of\b/gi, "because of", "Use 'because of'.");
  W("reason_why", "Redundant phrase", 0.80, /\bthe reason why\b/gi, "the reason", "'Why' repeats the meaning of 'reason'.");
  W("basis", "Wordy phrase", 0.82, /\bon a (daily|weekly|monthly|regular) basis\b/gi,
    m => ({ daily:"daily", weekly:"weekly", monthly:"monthly", regular:"regularly" })[m[1].toLowerCase()], "Use the adverb.");
  W("important_note", "Filler opener", 0.76, /\b(?:it is|it's) (?:important|worth) (?:to note|noting) that\b|\bit should be noted that\b/gi, "", "This opener adds length, not meaning.");
  W("in_my_opinion", "Filler opener", 0.80, /\bin my (?:opinion|view),? I (?:think|believe|feel)\b/gi, "I think", "Say it once.");
  W("do_not_hesitate", "Stock phrase", 0.80, /\bplease do not hesitate to\b/gi, "please", "A plain request reads warmer.");
  W("kind_of", "Hedge", 0.60, /\b(?:kind|sort) of\b/gi, "", "Hedging words weaken the message.", { safe: false });
  W("really", "Filler word", 0.55, /\breally\b/gi, "", "Intensifiers are often removable.", { safe: false });
  W("literally", "Filler word", 0.60, /\bliterally\b/gi, "", "This word rarely adds meaning.", { safe: false });
  W("please_find", "Stock phrase", 0.80, /\bplease (?:find|see) attached\b/gi, "I've attached", "Say what you did.", { safe: false });
  W("revert_back", "Redundant phrase", 0.90, /\b(revert|return|reply|respond) back\b/gi, "$1", "'Back' repeats the meaning.");
  W("repeat_again", "Redundant phrase", 0.90, /\brepeat again\b/gi, "repeat", "'Again' repeats the meaning.");
  W("join_together", "Redundant phrase", 0.90, /\b(join|combine|merge|connect) together\b/gi, "$1", "'Together' repeats the meaning.");
  W("free_gift", "Redundant phrase", 0.88, /\b(free gift|end result|final outcome|past history|future plans|close proximity|completely finished|new innovation)\b/gi,
    m => ({ "free gift":"gift", "end result":"result", "final outcome":"outcome", "past history":"history", "future plans":"plans", "close proximity":"proximity", "completely finished":"finished", "new innovation":"innovation" })[m[1].toLowerCase()], "One of these words repeats the other.");
  W("exact_same", "Redundant phrase", 0.86, /\b(?:exact same|same exact)\b/gi, "same", "'Exact' repeats 'same'.");
  W("please_kindly", "Redundant phrase", 0.92, /\bplease kindly\b/gi, "please", "Use one politeness word.");
  W("more_than_one_go", "Wordy phrase", 0.70, /\bcome to a conclusion\b|\bgive consideration to\b/gi,
    m => /conclusion/i.test(m[0]) ? "conclude" : "consider", "Use the verb directly.");
  T("clarity.wordiness.a_number_of", "A number of customers replied.", "Several");
  T("clarity.wordiness.is_able_to", "She is able to help today.", "can");
  T("clarity.wordiness.has_ability", "The team has the ability to fix it.", "can");
  T("clarity.wordiness.despite_fact", "Despite the fact that it rained, we came.", "Although");
  T("clarity.wordiness.light_of_fact", "We moved it for the reason that it broke.", "because");
  T("clarity.wordiness.at_present_time", "At the present time we are closed.", "Now");
  T("clarity.wordiness.with_exception", "All items with the exception of one shipped.", "except");
  T("clarity.wordiness.take_consideration", "We take into consideration your view.", "consider");
  T("clarity.wordiness.make_contact", "Please make contact with the team.", "contact");
  T("clarity.wordiness.make_attempt", "We will make an attempt to fix it.", "try to");
  T("clarity.wordiness.as_result_of", "As a result of the delay, we refunded you.", "Because of");
  T("clarity.wordiness.reason_why", "Here is the reason why it failed.", "the reason");
  T("clarity.wordiness.basis", "We check on a daily basis.", "daily");
  T("clarity.wordiness.important_note", "It is important to note that the slot moved.", "");
  T("clarity.wordiness.in_my_opinion", "In my opinion, I think it is fine.", "I think");
  T("clarity.wordiness.do_not_hesitate", "Please do not hesitate to reply.", "Please");
  T("clarity.wordiness.kind_of", "It is kind of late.", "");
  T("clarity.wordiness.really", "It is really late.", "");
  T("clarity.wordiness.literally", "It literally broke.", "");
  T("clarity.wordiness.please_find", "Please find attached the invoice.", "I've attached");
  T("clarity.wordiness.revert_back", "I will revert back tomorrow.", "revert");
  T("clarity.wordiness.repeat_again", "Please repeat again.", "repeat");
  T("clarity.wordiness.join_together", "We will join together the files.", "join");
  T("clarity.wordiness.free_gift", "Enjoy your free gift.", "gift");
  T("clarity.wordiness.exact_same", "It is the exact same issue.", "same");
  T("clarity.wordiness.please_kindly", "Please kindly wait.", "Please");
  T("clarity.wordiness.more_than_one_go", "We will come to a conclusion today.", "conclude");
  N("clarity.wordiness.is_able_to", "She can help today.");
  N("clarity.wordiness.reason_why", "That is the reason it failed.");

  const J = (id, label, conf, re, repl, msg, opts) => rule("clarity.jargon." + id, "clarity", "jargon", label, "low", conf, re, repl, msg, Object.assign({ keepCase: true, safe: false }, opts || {}));
  J("utilise", "Plain word", 0.78, /\b(?:utili[sz]e|utili[sz]es|utili[sz]ed|utili[sz]ing)\b/gi,
    m => ({ utilise:"use", utilize:"use", utilises:"uses", utilizes:"uses", utilised:"used", utilized:"used", utilising:"using", utilizing:"using" })[m[0].toLowerCase()],
    "'Use' says the same thing more simply.", { safe: true });
  J("commence", "Plain word", 0.80, /\bcommence(?:s|d)?\b/gi, m => ({ commence:"start", commences:"starts", commenced:"started" })[m[0].toLowerCase()], "'Start' is plainer.", { safe: true });
  J("subsequently", "Plain word", 0.74, /\bsubsequently\b/gi, "then", "'Then' is plainer.");
  J("approximately", "Plain word", 0.66, /\bapproximately\b/gi, "about", "'About' is plainer.");
  J("leverage", "Business jargon", 0.72, /\bleverag(?:e|es|ed|ing)\b/gi, m => ({ leverage:"use", leverages:"uses", leveraged:"used", leveraging:"using" })[m[0].toLowerCase()], "Plain wording sounds more human.");
  J("circle_back", "Business jargon", 0.80, /\bcircle back\b|\btouch base\b/gi, "follow up", "Plain wording sounds more human.");
  J("reach_out", "Business jargon", 0.62, /\breach(?:ing)? out\b/gi, m => /ing/i.test(m[0]) ? "contacting" : "contact", "'Contact' is plainer.");
  J("bandwidth", "Business jargon", 0.70, /\bbandwidth\b|\bsynergy\b|\blow[- ]hanging fruit\b/gi, null, "Internal jargon. Say what you mean in plain words.");
  J("loop_in", "Business jargon", 0.70, /\bloop (?:me|you|them|him|her) in\b/gi, null, "Plain wording is clearer here.");
  J("action_this", "Business jargon", 0.74, /\baction (?:this|that|it)\b/gi, null, "Say what you will do.");
  J("do_the_needful", "Regional jargon", 0.80, /\bdo the needful\b/gi, null, "Say what needs doing.");
  J("regret_inform", "Stiff phrasing", 0.82, /\bwe regret to inform you\b/gi, "I'm sorry to say", "Warmer and shorter.");
  J("trust_finds_well", "Stock phrase", 0.80, /\bI trust (?:this|that) (?:email|message) finds you well\b/gi, "", "You can skip this opener.");
  J("kindly_revert", "Stiff phrasing", 0.82, /\bkindly revert\b/gi, "please reply", "'Please reply' is clearer.");
  T("clarity.jargon.utilise", "We utilise the form.", "use");
  T("clarity.jargon.commence", "Work will commence today.", "start");
  T("clarity.jargon.subsequently", "We subsequently refunded it.", "then");
  T("clarity.jargon.approximately", "It takes approximately five days.", "about");
  T("clarity.jargon.leverage", "We leverage the portal.", "use");
  T("clarity.jargon.circle_back", "I will circle back tomorrow.", "follow up");
  T("clarity.jargon.reach_out", "Please reach out to us.", "contact");
  T("clarity.jargon.bandwidth", "I lack the bandwidth today.", null);
  T("clarity.jargon.loop_in", "I will loop them in.", null);
  T("clarity.jargon.action_this", "I will action this today.", null);
  T("clarity.jargon.do_the_needful", "We will do the needful.", null);
  T("clarity.jargon.regret_inform", "We regret to inform you it is closed.", "I'm sorry to say");
  T("clarity.jargon.trust_finds_well", "I trust this email finds you well.", "");
  T("clarity.jargon.kindly_revert", "Kindly revert with the form.", "Please reply");

  /* ---------- tone ---------- */
  const TN = (id, label, sev, conf, re, repl, msg, opts) => rule("tone." + id, "tone", id.split(".")[0], label, sev, conf, re, repl, msg, opts);
  TN("defensive.as_i_said", "Defensive wording", "high", 0.86,
    /\b(?:as i (?:already )?(?:said|mentioned|explained)(?: before)?|like i (?:said|mentioned)|as already (?:stated|explained|mentioned|discussed)|i already (?:told|said|explained)(?: you)?)\b/gi,
    null, "This reminds the reader they missed something. Restate the point neutrally instead.");
  T("tone.defensive.as_i_said", "As I already said, it is booked.", null);
  TN("defensive.not_our_fault", "Defensive wording", "high", 0.90,
    /\bnot our (?:fault|responsibility|problem)\b|\b(?:it'?s|that'?s|this is) not (?:our|my) (?:fault|responsibility|problem)\b/gi,
    null, "This shifts blame. Say what happened and what you will do next.");
  T("tone.defensive.not_our_fault", "That is not our fault.", null);
  TN("defensive.policy_says", "Defensive wording", "medium", 0.72,
    /\b(?:company )?policy (?:says|states|is that)\b/gi,
    null, "Explain the reason, not just the policy.");
  T("tone.defensive.policy_says", "Policy says we cannot refund.", null);
  TN("passive_aggressive.due_respect", "Passive-aggressive", "medium", 0.82,
    /\bwith all due respect\b|\bno offen[cs]e(?:,? but)?\b/gi,
    null, "This phrase usually precedes criticism and can escalate things.");
  T("tone.passive_aggressive.due_respect", "With all due respect, that is wrong.", null);
  TN("filler.honestly", "Filler that can undermine trust", "low", 0.66,
    /\b(?:honestly|frankly|to be frank|to tell you the truth)\b,?/gi,
    "", "Saying 'honestly' can imply the rest was not.", { safe: false });
  T("tone.filler.honestly", "Honestly, it is ready.", "");
  TN("absolute.you_always", "Absolute about the reader", "medium", 0.80,
    /\byou (?:always|never)\b/gi,
    null, "Absolutes about the reader sound accusatory. Describe the specific case.");
  T("tone.absolute.you_always", "You never reply on time.", null);
  TN("accusatory.why_did_you", "Accusatory question", "medium", 0.72,
    /\bwhy (?:did|didn't|did you not|have you not|haven't) you\b/gi,
    null, "Why-questions can sound like blame. Ask what happened or what they need.");
  T("tone.accusatory.why_did_you", "Why did you cancel it?", null);
  TN("robotic.stiff_thanks", "Stiff phrasing", "low", 0.66,
    /\bnoted with thanks\b|\bthanks and regards\b/gi,
    null, "Sounds like a form letter. Use natural wording.");
  T("tone.robotic.stiff_thanks", "Noted with thanks.", null);
  TN("informal.slang", "Too casual", "low", 0.66,
    /\b(?:gonna|wanna|gotta|kinda|sorta|dunno|lemme|gimme|ya|yeah|nope|yep|cuz|thx|pls|plz|u r|ur)\b/gi,
    null, "Casual slang can undercut a professional reply.", {});
  T("tone.informal.slang", "We are gonna check.", null);
  N("tone.informal.slang", "We are going to check, thanks, please.");
  TN("dismissive.whatever", "Dismissive wording", "high", 0.86,
    /\b(?:whatever|deal with it|get over it|not my job|figure it out yourself)\b/gi,
    null, "This dismisses the reader. Offer a concrete next step instead.");
  T("tone.dismissive.whatever", "Whatever, just try again.", null);
  TN("blame.your_fault", "Blame wording", "high", 0.90,
    /\b(?:your fault|you caused|you broke|you made a mistake|you (?:didn't|did not) (?:read|listen|follow))\b/gi,
    null, "This places blame. Describe what happened and what can fix it.");
  T("tone.blame.your_fault", "It was your fault.", null);
  N("tone.blame.your_fault", "We will fix it together.");

  /* ---------- structural rules ---------- */
  const SPAN_RE = /[^.!?\n]+(?:[.!?]+|$)/g;
  function spansOf(text) {
    const out = []; let m; SPAN_RE.lastIndex = 0;
    while ((m = SPAN_RE.exec(text))) {
      const raw = m[0], lead = raw.length - raw.trimStart().length, sentence = raw.trim();
      if (sentence) out.push({ sentence, start: m.index + lead, end: m.index + lead + sentence.length });
    }
    return out;
  }
  const covered = (issues, s, e) => issues.some(i => i.start != null && i.start < e && s < i.end);
  const ABBR = new Set(["e.g", "i.e", "etc", "vs", "approx", "inc", "ltd", "mr", "mrs", "ms", "dr", "no", "tel", "ref", "est", "min", "max", "dept", "fig", "a.m", "p.m", "st", "jr", "sr", "co", "misc", "cf", "al"]);

  structural.push({
    id: "grammar.capitalization.sentence_start", category: "grammar", subtype: "capitalization", label: "Sentence capitalisation", severity: "medium", confidence: 0.88,
    run({ text, protectedSpans, issues, push }) {
      const re = /(^|[.!?]["')\]]?\s+|\n\s*\n\s*)([a-z][A-Za-z']*)/g; let m;
      while ((m = re.exec(text))) {
        const start = m.index + m[1].length, word = m[2], end = start + word.length;
        const before = text.slice(0, m.index + (m[1] ? 1 : 0)).match(/([A-Za-z.]+)[.!?]?$/);
        const prev = before ? before[1].toLowerCase().replace(/\.$/, "") : "";
        if (m[1] && /^[.!?]/.test(m[1]) && ABBR.has(prev)) continue;
        if (/^[.!?]/.test(m[1]) && /^[A-Za-z]$/.test(prev)) continue;
        if (/^[.][a-z]/i.test(text.slice(end, end + 2))) continue;
        if (text[end] === "." && word.length <= 2) continue;
        if (covered(issues, start, end)) continue;
        push({ ruleId: this.id, category: this.category, subtype: this.subtype, label: this.label, start, end,
          message: "Start the sentence with a capital letter.", replacement: word[0].toUpperCase() + word.slice(1),
          severity: this.severity, confidence: this.confidence, excerpt: word });
      }
    }
  });
  T("grammar.capitalization.sentence_start", "thanks for waiting. we checked it.", "Thanks");
  N("grammar.capitalization.sentence_start", "Call at 9 a.m. and e.g. tomorrow. Etc. works.");

  structural.push({
    id: "grammar.punctuation.question_mark", category: "grammar", subtype: "punctuation", label: "Question mark", severity: "low", confidence: 0.72,
    run({ text, push }) {
      const q = /^(?:(?:can|could|would|will|do|does|did|is|are|have|has|should|may|shall) (?:you|i|we|they|he|she|it|this|that|there|the|my|your|our)\b|(?:what|when|where|why|how|who|which) (?:is|are|do|does|did|can|could|would|will|should|was|were|have|has) (?:you|i|we|they|he|she|it|this|that|there|the|my|your|our)\b)/i;
      spansOf(text).forEach(({ sentence, start, end }) => {
        if (!/\.$/.test(sentence) || /\.\.$/.test(sentence) || !q.test(sentence)) return;
        if (/\b(?:is|are|was|were) (?:what|when|where|why|how)\b/i.test(sentence)) return;
        push({ ruleId: this.id, category: this.category, subtype: this.subtype, label: this.label, start: end - 1, end,
          message: "This reads as a question. End it with a question mark.", replacement: "?", severity: this.severity,
          confidence: this.confidence, excerpt: ".", applySafe: false });
      });
    }
  });
  T("grammar.punctuation.question_mark", "Can you send the reference.", "?");
  N("grammar.punctuation.question_mark", "Can you send the reference? What is done is done.");

  structural.push({
    id: "tone.shouting.all_caps", category: "tone", subtype: "shouting", label: "All caps", severity: "medium", confidence: 0.78,
    run({ text, push }) {
      const OK = new Set(["HTTPS", "HTTP", "EMAIL", "URGENT_", "PDF", "SMS", "GMT", "UTC", "OTP", "FAQ", "ASAP_"]);
      const re = /\b[A-Z]{5,}\b/g; let m;
      while ((m = re.exec(text))) {
        if (OK.has(m[0])) continue;
        const w = m[0];
        push({ ruleId: this.id, category: this.category, subtype: this.subtype, label: this.label, start: m.index, end: m.index + w.length,
          message: "All caps reads as shouting. Use normal case, or bold for emphasis.", replacement: w[0] + w.slice(1).toLowerCase(),
          severity: this.severity, confidence: this.confidence, excerpt: w, applySafe: false });
      }
    }
  });
  T("tone.shouting.all_caps", "Please CHECK this now.", "Check");
  N("tone.shouting.all_caps", "Send the PDF by SMS.");

  structural.push({
    id: "tone.emphasis.exclamations", category: "tone", subtype: "emphasis", label: "Many exclamation marks", severity: "low", confidence: 0.66,
    run({ text, push }) {
      const marks = [...text.matchAll(/!/g)];
      if (marks.length < 3) return;
      const third = marks[2].index;
      push({ ruleId: this.id, category: this.category, subtype: this.subtype, label: this.label, start: third, end: third + 1,
        message: "Several exclamation marks can feel over-excited. Keep one for real good news.", replacement: ".", severity: this.severity,
        confidence: this.confidence, excerpt: "!", applySafe: false });
    }
  });
  T("tone.emphasis.exclamations", "Great! Thanks! Done! Bye!", ".");

  structural.push({
    id: "tone.repetition.unfortunately", category: "tone", subtype: "negativity", label: "Repeated negative opener", severity: "low", confidence: 0.66,
    run({ text, lower, push }) {
      const hits = [...lower.matchAll(/\b(unfortunately|sadly|regrettably)\b/g)];
      if (hits.length < 2) return;
      const h = hits[1];
      push({ ruleId: this.id, category: this.category, subtype: this.subtype, label: this.label, start: h.index, end: h.index + h[0].length,
        message: "Repeated 'unfortunately'. Lead with what you can do once, then move on.", replacement: null, severity: this.severity,
        confidence: this.confidence, excerpt: text.slice(h.index, h.index + h[0].length) });
    }
  });
  T("tone.repetition.unfortunately", "Unfortunately it failed. Unfortunately it stays.", null);

  structural.push({
    id: "clarity.length.long_paragraph", category: "clarity", subtype: "structure", label: "Long paragraph", severity: "low", confidence: 0.66,
    run({ text, push }) {
      const re = /[^\n]+/g; let m;
      while ((m = re.exec(text))) {
        const words = (m[0].match(/[A-Za-z0-9']+/g) || []).length;
        if (words <= 90) continue;
        push({ ruleId: this.id, category: this.category, subtype: this.subtype, label: this.label, start: m.index, end: m.index + Math.min(m[0].length, 80),
          message: "Long block of text (" + words + " words). Break it into short paragraphs or steps.", replacement: null,
          severity: this.severity, confidence: this.confidence, excerpt: text.slice(m.index, m.index + Math.min(m[0].length, 80)) });
      }
    }
  });
  T("clarity.length.long_paragraph", ("word ".repeat(95)).trim() + ".", null);
  N("clarity.length.long_paragraph", "A short paragraph.");

  structural.push({
    id: "clarity.voice.passive_heavy", category: "clarity", subtype: "voice", label: "Passive voice", severity: "low", confidence: 0.55,
    run({ text, push }) {
      const P = /\b(?:is|are|was|were|been|being|be) (?:\w+ed|sent|made|done|given|taken|seen|shown|written|held|kept|known|found|paid|told|left|lost|built)\b/gi;
      const hits = [...text.matchAll(P)];
      if (hits.length < 2) return;
      const h = hits[1];
      push({ ruleId: this.id, category: this.category, subtype: this.subtype, label: this.label, start: h.index, end: h.index + h[0].length,
        message: "Several passive sentences. Say who is doing what ('I have sent', 'we will check').", replacement: null,
        severity: this.severity, confidence: this.confidence, excerpt: h[0] });
    }
  });
  T("clarity.voice.passive_heavy", "The file was sent. The refund was processed.", null);
  N("clarity.voice.passive_heavy", "I sent the file and we will process it.");

  /* ---------- writing-craft rules: openers, apologies, closings, hedging, run-ons, acronyms ---------- */
  const SS = "(?<=^|[.!?]\\s+|\\n)";   /* sentence start */
  rule("clarity.opener.wanted_to_reach_out", "clarity", "opener", "Weak opener", "low", 0.74,
    /\bI (?:just )?wanted to (?:reach out|touch base|check in|follow up)(?: (?:and|to))?\b/gi,
    null, "Get to the point. Start with the ask or the update.");
  T("clarity.opener.wanted_to_reach_out", "I just wanted to reach out and confirm.", null);
  rule("clarity.opener.writing_to", "clarity", "opener", "Weak opener", "low", 0.70,
    /\b(?:I am|I'm) writing (?:to|in regards to|regarding)\b/gi,
    null, "The reader knows you are writing. Start with the point ('I'm confirming…', 'Your refund…').");
  T("clarity.opener.writing_to", "I am writing to confirm the date.", null);
  rule("clarity.opener.wondering_if", "clarity", "opener", "Indirect request", "low", 0.76,
    /\bI was (?:just )?(?:wondering|hoping) if you (could|would|might)\b/gi,
    "$1 you", "Ask directly: 'Could you…'.", { keepCase: false, safe: false });
  T("clarity.opener.wondering_if", "I was wondering if you could send the form.", "could you");
  N("clarity.opener.wondering_if", "Could you send the form?");

  rule("tone.apology.bother", "tone", "over_apology", "Over-apologetic opener", "low", 0.80,
    /\b(?:sorry|apologies|apologi[sz]e)(?: (?:to|for))? (?:bother|bothering|disturb|disturbing|trouble|troubling|interrupt|interrupting)(?: you)?\b/gi,
    "", "You do not need to apologise for writing. Start with the point.", { safe: false });
  T("tone.apology.bother", "Sorry to bother you, but the file is late.", "");
  N("tone.apology.bother", "Sorry for the delay with your refund.");
  rule("tone.closing.curt", "tone", "curt_closing", "Curt or pointed closing", "high", 0.86,
    /\b(?:let me know if you (?:actually )?read|read (?:the|my) (?:email|message) (?:again|properly|carefully)|do i have to (?:repeat|say) (?:it|this) again|as (?:stated|mentioned|noted) above|see above)\b/gi,
    null, "This reads as pointed. Restate the key point calmly instead of referring back.");
  T("tone.closing.curt", "As stated above, the date is fixed.", null);
  T("tone.closing.curt", "Do I have to repeat this again?", null);
  N("tone.closing.curt", "Let me know if anything is unclear.");
  rule("tone.command.bare_request", "tone", "command", "Blunt request", "medium", 0.68,
    new RegExp(SS + "(?![^.!?\\n]*\\bplease\\b)(Send|Give|Tell|Provide|Confirm|Reply|Call|Email|Forward|Upload|Share|Wait) (?:me|us|the|your|it|this|that|them|a)\\b", "g"),
    null, "A bare command can read as an order. Try 'Could you…' or add 'please'.");
  T("tone.command.bare_request", "Send me the report.", null);
  N("tone.command.bare_request", "Please send me the report. Could you send me the file?");

  rule("grammar.punctuation.comma_splice", "grammar", "run_on", "Possible comma splice", "medium", 0.58,
    /(?<=^|[.!?]\s+|\n)(?!(?:if|when|once|as|because|although|while|since|after|before|unless|whenever|though|whether|however|thanks|thank|yes|no|sure|hi|hello|dear|great|ok|okay|sorry|first|then|next|also|instead|otherwise|finally|so|now|please)\b)((?:I|We|You|They|He|She|It|This|That|The [a-z]+) [^.!?\n,]{8,60}), (I|we|you|they|he|she|it|this|that) (?:am|are|is|was|were|have|has|had|will|can|could|would|do|does|did|[a-z]+ed)\b/g,
    null, "Two full sentences joined by a comma. Use a full stop, a semicolon, or 'and'.");
  T("grammar.punctuation.comma_splice", "I checked the order yesterday, I will call you today.", null);
  N("grammar.punctuation.comma_splice", "If you want, I can call you. Thanks, I will check. I checked the order, and I will call.");
  rule("grammar.structure.fragment", "grammar", "fragment", "Possible sentence fragment", "medium", 0.55,
    new RegExp(SS + "((?:Because|Although|Though|Whereas|Which|Whilst)(?! of\\b)(?: [A-Za-z']+){3,11})\\.(?=\\s|$)", "g"),
    null, "This clause cannot stand alone. Join it to the sentence before or after it.");
  T("grammar.structure.fragment", "We rebooked it. Because the slot changed today.", null);
  N("grammar.structure.fragment", "Because of the delay, we rebooked it. Which one is it?");

  /* acronyms the reader may not know (first use only) */
  const ACRO_OK = new Set(("OK,FAQ,PDF,URL,URLS,SMS,VAT,ID,UK,US,USA,EU,UTC,GMT,ETA,ASAP,FYI,CEO,AM,PM,TV,PC,DIY,VIP,PIN,OTP,CV,HR,IT,PS,RSVP,ATM,LLC,LTD,PLC,NHS,HMRC,DVLA,SIM,USB,GPS,VPN,WIFI,HTML,CSS,PDFS,APP,ISP,SSN,DOB,QR,AI,TBC,TBD,NB,RIP,BBC,ITV,EV,MOT,DVD,CD,PO,UPS,DHL,BT,EE,O2,Q1,Q2,Q3,Q4").split(","));
  structural.push({
    id: "clarity.jargon.unexplained_acronym", category: "clarity", subtype: "jargon", label: "Unexplained acronym", severity: "low", confidence: 0.58,
    run({ text, push, context }) {
      const known = new Set(String((context && context.knownText) || "").match(/\b[A-Z]{2,5}\b/g) || []);
      const seen = new Set(); const re = /\b[A-Z]{2,5}\b/g; let m;
      while ((m = re.exec(text))) {
        const a = m[0];
        if (ACRO_OK.has(a) || known.has(a) || seen.has(a)) continue;
        seen.add(a);
        if (text[m.index - 1] === "(" && text[m.index + a.length] === ")") continue;
        if (text.slice(m.index + a.length, m.index + a.length + 2) === " (" ) continue;
        push({ ruleId: this.id, category: this.category, subtype: this.subtype, label: this.label, start: m.index, end: m.index + a.length,
          message: "Spell out '" + a + "' on first use unless the reader definitely knows it.", replacement: null, severity: this.severity,
          confidence: this.confidence, excerpt: a });
      }
    }
  });
  T("clarity.jargon.unexplained_acronym", "Please check the QBR pack.", null);
  N("clarity.jargon.unexplained_acronym", "Send the PDF and the FAQ, and the Quarterly Business Review (QBR) pack.");

  /* several hedges in one sentence */
  structural.push({
    id: "tone.hedging.stacked", category: "tone", subtype: "hedging", label: "Stacked hedges", severity: "medium", confidence: 0.70,
    run({ text, push }) {
      const H = /\b(?:i think|i guess|i suppose|maybe|perhaps|possibly|probably|might|sort of|kind of|a bit|somewhat|seems|i feel like|not sure but|just|could possibly)\b/gi;
      spansOf(text).forEach(({ sentence, start, end }) => {
        const hits = sentence.match(H) || [];
        if (hits.length < 3) return;
        push({ ruleId: this.id, category: this.category, subtype: this.subtype, label: this.label, start, end: Math.min(end, start + 90),
          message: hits.length + " hedges in one sentence (" + hits.slice(0, 3).join(", ") + ") make you sound unsure. Keep one at most.",
          replacement: null, severity: this.severity, confidence: this.confidence, excerpt: text.slice(start, Math.min(end, start + 90)) });
      });
    }
  });
  T("tone.hedging.stacked", "I think maybe we could possibly try that.", null);
  N("tone.hedging.stacked", "I think we should try that.");

  /* ambiguous "she/he" after two named people */
  structural.push({
    id: "clarity.reference.ambiguous_pronoun", category: "clarity", subtype: "reference", label: "Ambiguous pronoun", severity: "medium", confidence: 0.55,
    run({ text, push }) {
      const NOT = /^(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|January|February|March|April|May|June|July|August|September|October|November|December|Terms|Conditions|Thanks|Hello|Dear|Best|Kind)$/;
      const re = /\b([A-Z][a-z]{2,}) and ([A-Z][a-z]{2,})\b([^.!?\n]{0,70}?)\b(she|he|her|his|him)\b/g; let m;
      while ((m = re.exec(text))) {
        if (NOT.test(m[1]) || NOT.test(m[2])) continue;
        const s = m.index, e = m.index + m[0].length;
        push({ ruleId: this.id, category: this.category, subtype: this.subtype, label: this.label, start: s, end: e,
          message: "'" + m[4] + "' could mean " + m[1] + " or " + m[2] + ". Use the name.", replacement: null, severity: this.severity,
          confidence: this.confidence, excerpt: text.slice(s, e) });
      }
    }
  });
  T("clarity.reference.ambiguous_pronoun", "Tell Sam and Priya that she should review it.", null);
  N("clarity.reference.ambiguous_pronoun", "Tell Sam and Priya that Priya should review it.");

  window.MirrorFlowAssistRules = { regex, structural, tests, negatives, matchCase };
})();
