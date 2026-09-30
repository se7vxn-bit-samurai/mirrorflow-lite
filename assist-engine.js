/* ========== MIRRORFLOW ASSIST ENGINE (inlined) ========== */
(function () {
  "use strict";

  const APP_NAME = "MirrorFlow Assist";
  const APP_VERSION = "shell-v1";
  const ENGINE_ID = "mirrorflow-assist-local-v1";
  const ENGINE_CONTRACT_VERSION = "assist-engine-contract-v1";
  const RULE_PROFILE_ID = "mirrorflow-assist-local-default";
  const RULE_PROFILE_SCHEMA_VERSION = "1.1.0";
  const TEST_REPORT_SCHEMA_VERSION = "1.0.0";
  const RULE_CATEGORIES = ["grammar", "clarity", "tone"];
  const RULE_SEVERITIES = ["high", "medium", "low"];
  const CLARITY_MODEL_VERSION = "clarity-score-v3";
  const CLARITY_SCORE_WEIGHTS = { length: 30, vagueTiming: 20, wordiness: 18, jargon: 16, specificity: 16 };

  let importedRuleProfile = null;
  let disabledRuleIds = new Set();
  let profileValidation = null;

  const REGEX_RULES = [
    { id:"grammar.agreement.we_has", category:"grammar", subtype:"agreement", label:"Subject-verb agreement", severity:"high", confidence:0.96, pattern:/\bwe has\b/gi, replacement:"we have", message:"Subject and verb disagree." },
    { id:"grammar.article.a_to_an", category:"grammar", subtype:"article", label:"Article before vowel sound", severity:"high", confidence:0.90, pattern:/\ba(?= (?:(?!(?:user|users|use|used|useful|usual|unit|units|university|union|unique|uniform|universal|one|once|european|and)\b)[aeiou][a-z]{2,}|(?:hour|honest|honou?r|heir)[a-z]*\b))/g, replacement:"an", message:"Use 'an' before a vowel sound." },
    { id:"grammar.article.an_to_a", category:"grammar", subtype:"article", label:"Article before consonant sound", severity:"high", confidence:0.90, pattern:/\ban(?= (?:(?!(?:hour|honest|honou?r|heir|histor)[a-z]*\b)[bcdfghjklmnpqrstvwxz][a-z]+|(?:user|users|use|used|useful|usual|unit|units|university|union|unique|uniform|universal|one|once|european)\b))/g, replacement:"a", message:"Use 'a' before a consonant sound." },
    { id:"grammar.agreement.team_responds", category:"grammar", subtype:"agreement", label:"Collective noun agreement", severity:"medium", confidence:0.78, pattern:/\bteam respond\b/gi, replacement:"team responds", message:"Singular collective noun needs a matching verb here." },
    { id:"grammar.capitalization.first_person_i", category:"grammar", subtype:"capitalization", label:"First-person pronoun", severity:"medium", confidence:0.92, pattern:/\bi\b(?!\.e\.)/g, replacement:"I", message:"Capitalize the first-person pronoun." },
    { id:"grammar.duplicate.repeated_word", category:"grammar", subtype:"duplicate", label:"Repeated word", severity:"high", confidence:0.96, pattern:/\b(?!(?:had\s+had|that\s+that)\b)([A-Za-z]+)\s+\1\b/gi, replacement:"$1", message:"Repeated word." },
    { id:"grammar.spacing.double_space", category:"grammar", subtype:"spacing", label:"Extra spacing", severity:"low", confidence:0.99, pattern:/ {2,}/g, replacement:" ", message:"Extra spacing." },
    { id:"grammar.verb_modal.of_have", category:"grammar", subtype:"verb_form", label:"Modal verb form", severity:"high", confidence:0.96, pattern:/\b(should|could|would|must) of\b/gi, replacement:"$1 have", message:"Use 'have' after this modal verb." },
    { id:"grammar.confusion.your_welcome", category:"grammar", subtype:"confusion", label:"Your / you're", severity:"high", confidence:0.92, pattern:/\byour welcome\b/gi, replacement:"you're welcome", message:"Use the contraction for 'you are' here." },
    { id:"grammar.confusion.bare_with_me", category:"grammar", subtype:"confusion", label:"Bear / bare", severity:"high", confidence:0.94, pattern:/\b(bare with me|please bare with me)\b/gi, replacement:"please bear with me", message:"Use 'bear with me' for waiting or patience." },
    { id:"grammar.verb.be_advised", category:"grammar", subtype:"verb_form", label:"Be advised", severity:"medium", confidence:0.88, pattern:/\bplease be advise\b/gi, replacement:"please be advised", message:"Use the past participle in this phrase." },
    { id:"grammar.number.any_questions", category:"grammar", subtype:"number", label:"Question / questions", severity:"medium", confidence:0.84, pattern:/\bany question\b/gi, replacement:"any questions", message:"Use the plural form after 'any' in this phrase." },
    { id:"grammar.comparative.more_better", category:"grammar", subtype:"comparative", label:"Double comparative", severity:"high", confidence:0.95, pattern:/\bmore better\b/gi, replacement:"better", message:"Use one comparative form." },
    { id:"grammar.confusion.less_than", category:"grammar", subtype:"confusion", label:"Then / than", severity:"medium", confidence:0.78, pattern:/\bless then\b/gi, replacement:"less than", message:"Use 'than' for comparison." },
    { id:"grammar.contraction.cant", category:"grammar", subtype:"contraction", label:"Missing apostrophe", severity:"medium", confidence:0.90, pattern:/\bcant\b/gi, replacement:"can't", message:"Use the apostrophe in this contraction." },
    { id:"grammar.contraction.dont", category:"grammar", subtype:"contraction", label:"Missing apostrophe", severity:"medium", confidence:0.90, pattern:/\bdont\b/gi, replacement:"don't", message:"Use the apostrophe in this contraction." },
    { id:"grammar.contraction.im", category:"grammar", subtype:"contraction", label:"Missing apostrophe", severity:"medium", confidence:0.90, pattern:/\b[Ii]m\b/g, replacement:"I'm", message:"Use the apostrophe and capital letter in this contraction." },
    { id:"grammar.contraction.youre", category:"grammar", subtype:"contraction", label:"Missing apostrophe", severity:"medium", confidence:0.90, pattern:/\byoure\b/gi, replacement:"you're", message:"Use the contraction for 'you are'." },
    { id:"grammar.contraction.ive", category:"grammar", subtype:"contraction", label:"Missing apostrophe", severity:"medium", confidence:0.88, pattern:/\bive\b/gi, replacement:"I've", message:"Use the apostrophe and capital letter in this contraction." },
    { id:"grammar.punctuation.space_before_mark", category:"grammar", subtype:"punctuation", label:"Space before punctuation", severity:"low", confidence:0.96, pattern:/\s+([,.!?])/g, replacement:"$1", message:"Remove the space before punctuation." },
    { id:"grammar.punctuation.comma_spacing", category:"grammar", subtype:"punctuation", label:"Comma spacing", severity:"low", confidence:0.94, pattern:/(?<=[A-Za-z]{2}),([A-Za-z])(?![\w-]*[@\/.]\w)/g, replacement:", $1", message:"Add a space after the comma." },
    { id:"grammar.confusion.its_been", category:"grammar", subtype:"confusion", label:"Its / it's", severity:"medium", confidence:0.82, pattern:/\bits been\b/gi, replacement:"it's been", message:"Use 'it's' for 'it has'." },
    { id:"grammar.agreement.there_are_multiple", category:"grammar", subtype:"agreement", label:"There is / there are", severity:"medium", confidence:0.86, pattern:/\bthere is (several|many|multiple)\b/gi, replacement:"there are $1", message:"Use plural agreement for several, many, or multiple items." },
    { id:"grammar.spelling.alot", category:"grammar", subtype:"spelling", label:"Spelling", severity:"medium", confidence:0.94, pattern:/\balot\b/gi, replacement:"a lot", message:"Use the two-word form." },
    { id:"grammar.spelling.recieve", category:"grammar", subtype:"spelling", label:"Spelling", severity:"medium", confidence:0.94, pattern:/\brecieve\b/gi, replacement:"receive", message:"Correct the spelling." },
    { id:"grammar.spelling.definately", category:"grammar", subtype:"spelling", label:"Spelling", severity:"medium", confidence:0.95, pattern:/\bdefinately\b/gi, replacement:"definitely", message:"Correct the spelling." },
    { id:"grammar.spelling.seperate", category:"grammar", subtype:"spelling", label:"Spelling", severity:"medium", confidence:0.94, pattern:/\bseperate\b/gi, replacement:"separate", message:"Correct the spelling." },
    { id:"grammar.spelling.accomodate", category:"grammar", subtype:"spelling", label:"Spelling", severity:"medium", confidence:0.94, pattern:/\baccomodate\b/gi, replacement:"accommodate", message:"Correct the spelling." },
    { id:"grammar.spelling.tommorow", category:"grammar", subtype:"spelling", label:"Spelling", severity:"medium", confidence:0.94, pattern:/\btommorow\b/gi, replacement:"tomorrow", message:"Correct the spelling." },
    { id:"grammar.contraction.couldnt", category:"grammar", subtype:"contraction", label:"Missing apostrophe", severity:"medium", confidence:0.88, pattern:/\bcouldnt\b/gi, replacement:"couldn't", message:"Use the apostrophe in this contraction." },
    { id:"grammar.contraction.wouldnt", category:"grammar", subtype:"contraction", label:"Missing apostrophe", severity:"medium", confidence:0.88, pattern:/\bwouldnt\b/gi, replacement:"wouldn't", message:"Use the apostrophe in this contraction." },
    { id:"grammar.contraction.shouldnt", category:"grammar", subtype:"contraction", label:"Missing apostrophe", severity:"medium", confidence:0.88, pattern:/\bshouldnt\b/gi, replacement:"shouldn't", message:"Use the apostrophe in this contraction." },
    { id:"grammar.contraction.wont", category:"grammar", subtype:"contraction", label:"Missing apostrophe", severity:"medium", confidence:0.88, pattern:/\bwont\b/gi, replacement:"won't", message:"Use the apostrophe in this contraction." },
    { id:"grammar.contraction.doesnt", category:"grammar", subtype:"contraction", label:"Missing apostrophe", severity:"medium", confidence:0.88, pattern:/\bdoesnt\b/gi, replacement:"doesn't", message:"Use the apostrophe in this contraction." },
    { id:"grammar.punctuation.sentence_spacing", category:"grammar", subtype:"punctuation", label:"Sentence spacing", severity:"low", confidence:0.90, pattern:/(?<=[a-z]{3})([.!?])([A-Z])/g, replacement:"$1 $2", message:"Add a space after the punctuation mark." },
    { id:"grammar.punctuation.repeated_marks", category:"grammar", subtype:"punctuation", label:"Repeated punctuation", severity:"low", confidence:0.86, pattern:/([!?]){2,}/g, replacement:"$1", message:"Use one punctuation mark unless emphasis is intentional." },
    { id:"tone.robotic.as_per", category:"tone", subtype:"robotic", label:"Procedural wording", severity:"medium", confidence:0.74, pattern:/\bas per\b/gi, replacement:"following", message:"This sounds procedural. Use plainer wording." },
    { id:"tone.defensive.as_you_know", category:"tone", subtype:"defensive", label:"Defensive opener", severity:"medium", confidence:0.78, pattern:/\bas you know\b/gi, replacement:"to confirm", message:"This can sound defensive. Use a neutral opener." },
    { id:"tone.blame.you_should_have", category:"tone", subtype:"blame", label:"Blame framing", severity:"high", confidence:0.80, pattern:/\byou should have\b/gi, replacement:"the usual next step is to", message:"Avoid making the reader feel at fault." },
    { id:"tone.blame.you_failed_to", category:"tone", subtype:"blame", label:"Blame wording", severity:"high", confidence:0.86, pattern:/\byou failed to\b/gi, replacement:"we do not have", message:"Avoid direct blame wording." },
    { id:"tone.escalation.calm_down", category:"tone", subtype:"escalation", label:"Escalating phrase", severity:"high", confidence:0.92, pattern:/\bcalm down\b/gi, replacement:null, message:"This phrase is likely to escalate the conversation." },
    { id:"tone.passive_aggressive.obviously", category:"tone", subtype:"passive_aggressive", label:"Passive-aggressive wording", severity:"medium", confidence:0.76, pattern:/\bobviously\b/gi, replacement:"", message:"This word can read as dismissive." },
    { id:"tone.command.you_need_to", category:"tone", subtype:"imperative", label:"Hard instruction", severity:"medium", confidence:0.74, pattern:/(^|[.!?]\s+)you need to\b/gi, replacement:"$1please", message:"This can sound like an order. Soften the instruction." },
    { id:"tone.dismissive.not_my_problem", category:"tone", subtype:"dismissive", label:"Dismissive wording", severity:"high", confidence:0.94, pattern:/\b(that'?s not my problem|not my problem)\b/gi, replacement:null, message:"This dismisses the reader's issue. Rewrite manually." },
    { id:"tone.accusatory.you_are_wrong", category:"tone", subtype:"accusatory", label:"Accusatory wording", severity:"high", confidence:0.90, pattern:/\byou are wrong\b/gi, replacement:"I can clarify this", message:"Avoid telling the reader they are wrong." },
    { id:"tone.robotic.kindly", category:"tone", subtype:"robotic", label:"Over-formal wording", severity:"low", confidence:0.64, pattern:/\bkindly\b/gi, replacement:"please", message:"This can sound stiff in chat." },
    { id:"tone.absolute.no_way", category:"tone", subtype:"absolute", label:"Absolute refusal", severity:"high", confidence:0.86, pattern:/\b(no way|(?:it'?s|it is|that'?s|that is) impossible)\b/gi, replacement:null, message:"This refusal may feel abrupt. Offer a clear alternative." },
    { id:"tone.command.you_must", category:"tone", subtype:"imperative", label:"Hard instruction", severity:"medium", confidence:0.76, pattern:/(^|[.!?]\s+)you must\b/gi, replacement:"$1please", message:"This can sound forceful. Use a softer instruction." },
    { id:"tone.command.you_have_to", category:"tone", subtype:"imperative", label:"Hard instruction", severity:"medium", confidence:0.74, pattern:/(^|[.!?]\s+)you have to\b/gi, replacement:"$1please", message:"This can sound like pressure. Use a softer instruction." },
    { id:"tone.defensive.i_told_you", category:"tone", subtype:"defensive", label:"Defensive phrasing", severity:"medium", confidence:0.82, pattern:/\bi told you\b/gi, replacement:"I mentioned", message:"This can sound defensive. Use a calmer reminder." },
    { id:"tone.accusatory.you_claim", category:"tone", subtype:"accusatory", label:"Accusatory phrasing", severity:"medium", confidence:0.80, pattern:/\byou claim\b/gi, replacement:"you mentioned", message:"This can sound doubtful or accusatory." },
    { id:"tone.apology.sorry_for_inconvenience", category:"tone", subtype:"apology", label:"Apology phrasing", severity:"low", confidence:0.78, pattern:/\bsorry for inconvenience\b/gi, replacement:"I'm sorry for the inconvenience", message:"Use the complete apology phrase." },
    { id:"tone.command.be_patient", category:"tone", subtype:"imperative", label:"Hard instruction", severity:"medium", confidence:0.76, pattern:/\bplease be patient\b/gi, replacement:"thanks for your patience", message:"This can sound like an order. Acknowledge patience instead." },
    { id:"tone.dismissive.nothing_i_can_do", category:"tone", subtype:"dismissive", label:"Dead-end wording", severity:"high", confidence:0.86, pattern:/\bnothing (i|we) can do\b/gi, replacement:null, message:"This closes the conversation down. Offer the nearest useful option." },
    { id:"tone.blame.you_did_not", category:"tone", subtype:"blame", label:"Blame wording", severity:"medium", confidence:0.78, pattern:/\byou did not send\b/gi, replacement:"we haven't received", message:"Avoid direct blame wording." },
    { id:"clarity.specificity.very_soon", category:"clarity", subtype:"specificity", label:"Vague timing", severity:"medium", confidence:0.72, pattern:/\bvery soon\b/gi, replacement:"as soon as I have the update", message:"Vague timing weakens trust." },
    { id:"clarity.wordiness.in_order_to", category:"clarity", subtype:"wordiness", label:"Wordy phrase", severity:"low", confidence:0.86, pattern:/\bin order to\b/gi, replacement:"to", message:"Shorten this phrase." },
    { id:"clarity.wordiness.due_to_fact", category:"clarity", subtype:"wordiness", label:"Wordy cause phrase", severity:"medium", confidence:0.88, pattern:/\bdue to the fact that\b/gi, replacement:"because", message:"Use the shorter cause phrase." },
    { id:"clarity.wordiness.moment_in_time", category:"clarity", subtype:"wordiness", label:"Wordy time phrase", severity:"low", confidence:0.88, pattern:/\bat this moment in time\b/gi, replacement:"now", message:"Use the shorter time phrase." },
    { id:"clarity.wordiness.please_note_that", category:"clarity", subtype:"wordiness", label:"Unneeded preface", severity:"low", confidence:0.70, pattern:/\bplease note that\b/gi, replacement:"", message:"This preface is often unnecessary." },
    { id:"clarity.phrase.provide_me_with", category:"clarity", subtype:"wordiness", label:"Wordy request", severity:"low", confidence:0.72, pattern:/\bprovide me with\b/gi, replacement:"send me", message:"Use a simpler request phrase." },
    { id:"clarity.wordiness.in_the_event_that", category:"clarity", subtype:"wordiness", label:"Wordy condition", severity:"low", confidence:0.88, pattern:/\bin the event that\b/gi, replacement:"if", message:"Use the shorter condition phrase." },
    { id:"clarity.wordiness.with_regards_to", category:"clarity", subtype:"wordiness", label:"Wordy topic phrase", severity:"low", confidence:0.84, pattern:/\bwith regards to\b/gi, replacement:"about", message:"Use a shorter topic phrase." },
    { id:"clarity.wordiness.prior_to", category:"clarity", subtype:"wordiness", label:"Wordy time phrase", severity:"low", confidence:0.90, pattern:/\bprior to\b/gi, replacement:"before", message:"Use the shorter time phrase." },
    { id:"clarity.wordiness.at_later_date", category:"clarity", subtype:"wordiness", label:"Wordy date phrase", severity:"low", confidence:0.82, pattern:/\bat a later date\b/gi, replacement:"later", message:"Use the shorter time phrase." },
    { id:"clarity.jargon.backend", category:"clarity", subtype:"jargon", label:"Internal jargon", severity:"medium", confidence:0.76, pattern:/\bbackend\b/gi, replacement:null, message:"Internal jargon. Use plain wording such as 'system'." },
    { id:"clarity.hedging.just", category:"clarity", subtype:"hedging", label:"Removable softener", severity:"low", confidence:0.62, pattern:/\bjust\b/gi, replacement:null, message:"This softener is often removable. Check the meaning first." },
    { id:"clarity.wordiness.i_wanted_to_let_you_know", category:"clarity", subtype:"wordiness", label:"Wordy update opener", severity:"low", confidence:0.82, pattern:/\bi wanted to let you know that\b/gi, replacement:"to update you,", message:"Open the update more directly." },
    { id:"clarity.wordiness.in_regards_to", category:"clarity", subtype:"wordiness", label:"Wordy topic phrase", severity:"low", confidence:0.84, pattern:/\bin regards to\b/gi, replacement:"about", message:"Use a shorter topic phrase." },
    { id:"clarity.wordiness.in_relation_to", category:"clarity", subtype:"wordiness", label:"Wordy topic phrase", severity:"low", confidence:0.84, pattern:/\bin relation to\b/gi, replacement:"about", message:"Use a shorter topic phrase." },
    { id:"clarity.wordiness.earliest_convenience", category:"clarity", subtype:"wordiness", label:"Stiff timing phrase", severity:"low", confidence:0.78, pattern:/\bat your earliest convenience\b/gi, replacement:"when you can", message:"Use a simpler timing phrase." },
    { id:"clarity.wordiness.at_this_point_in_time", category:"clarity", subtype:"wordiness", label:"Wordy time phrase", severity:"low", confidence:0.88, pattern:/\bat this point in time\b/gi, replacement:"now", message:"Use the shorter time phrase." },
    { id:"clarity.wordiness.going_forward", category:"clarity", subtype:"wordiness", label:"Wordy future phrase", severity:"low", confidence:0.70, pattern:/\bgoing forward\b/gi, replacement:"from now on", message:"Use a more direct future phrase." },
    { id:"clarity.wordiness.basically", category:"clarity", subtype:"wordiness", label:"Filler word", severity:"low", confidence:0.64, pattern:/\bbasically\b/gi, replacement:"", message:"This filler word is often removable." },
    { id:"clarity.wordiness.actually", category:"clarity", subtype:"wordiness", label:"Filler word", severity:"low", confidence:0.62, pattern:/\bactually\b/gi, replacement:"", message:"This filler word is often removable." },
    { id:"clarity.wordiness.i_think_that", category:"clarity", subtype:"wordiness", label:"Wordy qualifier", severity:"low", confidence:0.70, pattern:/\bi think that\b/gi, replacement:"I think", message:"Shorten this qualifier." },
    { id:"clarity.wordiness.in_process_of", category:"clarity", subtype:"wordiness", label:"Wordy action phrase", severity:"low", confidence:0.82, pattern:/\bin the process of\b/gi, replacement:"", message:"Use the active verb directly." },
    { id:"clarity.wordiness.timely_manner", category:"clarity", subtype:"wordiness", label:"Stiff timing phrase", severity:"low", confidence:0.84, pattern:/\bin a timely manner\b/gi, replacement:"promptly", message:"Use a shorter timing phrase." },
    { id:"clarity.wordiness.position_to", category:"clarity", subtype:"wordiness", label:"Wordy ability phrase", severity:"low", confidence:0.84, pattern:/\bin a position to\b/gi, replacement:"able to", message:"Use a shorter ability phrase." },
    { id:"clarity.wordiness.purpose_of", category:"clarity", subtype:"wordiness", label:"Wordy purpose phrase", severity:"low", confidence:0.84, pattern:/\bfor the purpose of\b/gi, replacement:"for", message:"Use a shorter purpose phrase." },
    { id:"grammar.confusion.affect_effect", category:"grammar", subtype:"confusion", label:"Affect / effect", severity:"high", confidence:0.92, pattern:/\bwill effect\b/gi, replacement:"will affect", message:"Use 'affect' as a verb for influencing something." },
    { id:"grammar.confusion.accept_except", category:"grammar", subtype:"confusion", label:"Accept / except", severity:"high", confidence:0.92, pattern:/\bplease except\b/gi, replacement:"please accept", message:"Use 'accept' to mean receive or agree to." },
    { id:"clarity.nominalization.make_decision", category:"clarity", subtype:"wordiness", label:"Nominalization", severity:"low", confidence:0.85, pattern:/\bmake a decision\b/gi, replacement:"decide", message:"Use the verb directly for better clarity." },
    { id:"clarity.nominalization.provide_assistance", category:"clarity", subtype:"wordiness", label:"Nominalization", severity:"low", confidence:0.85, pattern:/\bprovide assistance\b/gi, replacement:"help", message:"Use a simpler verb." },
    { id:"clarity.wordiness.at_all_times", category:"clarity", subtype:"wordiness", label:"Wordy phrase", severity:"low", confidence:0.90, pattern:/\bat all times\b/gi, replacement:"always", message:"Shorten this phrase." },
    { id:"clarity.wordiness.near_future", category:"clarity", subtype:"wordiness", label:"Vague timing", severity:"medium", confidence:0.80, pattern:/\bin the near future\b/gi, replacement:"soon", message:"Use a more specific or shorter timing." },
    { id:"tone.passive_aggressive.per_my_last", category:"tone", subtype:"passive_aggressive", label:"Passive-aggressive marker", severity:"high", confidence:0.88, pattern:/\bper my last(?: (?:email|message|correspondence))?\b/gi, replacement:"as mentioned", message:"This phrase often signals frustration. Use a neutral alternative." },
    { id:"tone.filler.to_be_honest", category:"tone", subtype:"filler", label:"Subtle filler", severity:"low", confidence:0.82, pattern:/\bto be honest\b/gi, replacement:"", message:"This filler can sometimes undermine trust." },
    { id:"tone.minimizing.just_checking", category:"tone", subtype:"minimizing", label:"Minimizing language", severity:"low", confidence:0.75, pattern:/\bjust checking\b/gi, replacement:"checking", message:"Avoid minimizing your actions." },
    { id:"tone.robotic.please_be_advised_that", category:"tone", subtype:"robotic", label:"Robotic preface", severity:"low", confidence:0.85, pattern:/\bplease be advised that\b/gi, replacement:"", message:"This preface adds unnecessary formality." }
  ];

  const STRUCTURAL_RULES = [
    {
      id:"clarity.length.long_sentence", category:"clarity", subtype:"long_sentence", label:"Long sentence", severity:"medium", confidence:0.70,
      run({ text, protectedSpans, push }) {
        sentenceSpans(text).forEach(({ sentence, start }) => {
          if (wordsOf(sentence).length <= 26) return;
          push({ ruleId:this.id, category:this.category, subtype:this.subtype, label:this.label, start, end:start+sentence.length, message:"Long sentence. Split it for readability.", replacement:null, severity:this.severity, confidence:this.confidence, excerpt:sentence.slice(0,70)+(sentence.length>70?"...":"") }, protectedSpans);
        });
      }
    },
    {
      id:"tone.apology.repeated", category:"tone", subtype:"over_apology", label:"Repeated apology", severity:"medium", confidence:0.76,
      run({ text, lower, protectedSpans, push }) {
        const apologyCount = (lower.match(/\b(sorry|apologise|apologize)\b/g)||[]).length;
        if (apologyCount <= 1) return;
        const start = lower.indexOf("sorry", lower.indexOf("sorry")+1);
        push({ ruleId:this.id, category:this.category, subtype:this.subtype, label:this.label, start, end:start+5, message:"Repeated apology. Keep one apology, then move to ownership.", replacement:null, severity:this.severity, confidence:this.confidence, excerpt:"sorry" }, protectedSpans);
      }
    },
    {
      id:"clarity.structure.overloaded_commas", category:"clarity", subtype:"sentence_flow", label:"Overloaded sentence", severity:"medium", confidence:0.70,
      run({ text, protectedSpans, push }) {
        sentenceSpans(text).forEach(({ sentence, start }) => {
          const commaCount = (sentence.match(/,/g) || []).length;
          if (commaCount < 3 || wordsOf(sentence).length < 18) return;
          push({ ruleId:this.id, category:this.category, subtype:this.subtype, label:this.label, start, end:start+sentence.length, message:"This sentence carries too many linked ideas. Split it into shorter steps.", replacement:null, severity:this.severity, confidence:this.confidence, excerpt:sentence.slice(0,70)+(sentence.length>70?"...":"") }, protectedSpans);
        });
      }
    },
    {
      id:"clarity.structure.repeated_sentence_start", category:"clarity", subtype:"sentence_flow", label:"Repeated sentence start", severity:"low", confidence:0.68,
      run({ text, protectedSpans, push }) {
        const spans = sentenceSpans(text), sentences = spans.map(sp => sp.sentence);
        const starts = sentences.map(sentence => wordsOf(sentence).slice(0, 2).join(" ").toLowerCase());
        for (let i = 1; i < sentences.length; i++) {
          if (!starts[i] || starts[i].length < 4 || starts[i] !== starts[i - 1]) continue;
          const start = spans[i].start;
          push({ ruleId:this.id, category:this.category, subtype:this.subtype, label:this.label, start, end:start+Math.min(sentences[i].length, 70), message:"Several sentences start the same way. Vary the opening to improve flow.", replacement:null, severity:this.severity, confidence:this.confidence, excerpt:sentences[i].slice(0,70)+(sentences[i].length>70?"...":"") }, protectedSpans);
          break;
        }
      }
    }
  ];

  /* extended rule pack (assist-rules.js) */
  const EXT = window.MirrorFlowAssistRules || { regex:[], structural:[], tests:[], negatives:[] };
  REGEX_RULES.push.apply(REGEX_RULES, EXT.regex);
  STRUCTURAL_RULES.push.apply(STRUCTURAL_RULES, EXT.structural);

  const RULE_REGISTRY = REGEX_RULES.concat(STRUCTURAL_RULES);
  const RULE_ID_SET   = new Set(RULE_REGISTRY.map(r => r.id));
  const PROFILE_PRESET_DEFS = [
    { id:"balanced", name:"Balanced", note:"Grammar, clarity, and tone", disableCategories:[] },
    { id:"mechanics", name:"Mechanics", note:"Grammar and punctuation only", disableCategories:["clarity", "tone"] },
    { id:"concise", name:"Concise", note:"Grammar plus clarity", disableCategories:["tone"] },
    { id:"tone_guard", name:"Tone guard", note:"Grammar plus tone", disableCategories:["clarity"] }
  ];
  const RULE_TESTS = [
    { id: "G-001", ruleId: "grammar.agreement.we_has", input: "We has checked the booking.", expectedReplacement: "we have" },
    { id: "G-002", ruleId: "grammar.article.a_to_an", input: "There is a update on your account.", expectedReplacement: "an" },
    { id: "G-038", ruleId: "grammar.article.a_to_an", input: "I sent a email and a hour ago.", expectedReplacement: "an" },
    { id: "G-039", ruleId: "grammar.article.an_to_a", input: "This is an user guide.", expectedReplacement: "a" },
    { id: "G-003", ruleId: "grammar.agreement.team_responds", input: "The team respond today.", expectedReplacement: "team responds" },
    { id: "G-004", ruleId: "grammar.capitalization.first_person_i", input: "i can check this now.", expectedReplacement: "I" },
    { id: "G-005", ruleId: "grammar.duplicate.repeated_word", input: "I am sorry sorry for the delay.", expectedReplacement: "sorry" },
    { id: "G-006", ruleId: "grammar.spacing.double_space", input: "I can  check this.", expectedReplacement: " " },
    { id: "G-007", ruleId: "grammar.verb_modal.of_have", input: "You should of received the update.", expectedReplacement: "should have" },
    { id: "G-008", ruleId: "grammar.confusion.your_welcome", input: "Your welcome.", expectedReplacement: "you're welcome" },
    { id: "G-009", ruleId: "grammar.confusion.bare_with_me", input: "Please bare with me.", expectedReplacement: "please bear with me" },
    { id: "G-010", ruleId: "grammar.verb.be_advised", input: "Please be advise that the slot changed.", expectedReplacement: "please be advised" },
    { id: "G-011", ruleId: "grammar.number.any_questions", input: "Let me know if you have any question.", expectedReplacement: "any questions" },
    { id: "G-012", ruleId: "grammar.comparative.more_better", input: "This is more better for the customer.", expectedReplacement: "better" },
    { id: "G-013", ruleId: "grammar.confusion.less_than", input: "This takes less then five minutes.", expectedReplacement: "less than" },
    { id: "G-014", ruleId: "grammar.contraction.cant", input: "I cant open the file.", expectedReplacement: "can't" },
    { id: "G-015", ruleId: "grammar.contraction.dont", input: "I dont have the reference.", expectedReplacement: "don't" },
    { id: "G-016", ruleId: "grammar.contraction.im", input: "im checking this now.", expectedReplacement: "I'm" },
    { id: "G-017", ruleId: "grammar.contraction.youre", input: "youre welcome.", expectedReplacement: "you're" },
    { id: "G-018", ruleId: "grammar.contraction.ive", input: "ive checked the update.", expectedReplacement: "I've" },
    { id: "G-019", ruleId: "grammar.punctuation.space_before_mark", input: "I can help , and I will check.", expectedReplacement: "," },
    { id: "G-020", ruleId: "grammar.punctuation.comma_spacing", input: "Thanks,I can check this.", expectedReplacement: ", I" },
    { id: "G-021", ruleId: "grammar.confusion.its_been", input: "Its been updated.", expectedReplacement: "it's been" },
    { id: "G-022", ruleId: "grammar.agreement.there_are_multiple", input: "There is multiple options available.", expectedReplacement: "there are multiple" },
    { id: "G-023", ruleId: "grammar.spelling.alot", input: "This helps alot.", expectedReplacement: "a lot" },
    { id: "G-024", ruleId: "grammar.spelling.recieve", input: "You will recieve the file today.", expectedReplacement: "receive" },
    { id: "G-025", ruleId: "grammar.spelling.definately", input: "This is definately ready.", expectedReplacement: "definitely" },
    { id: "G-026", ruleId: "grammar.spelling.seperate", input: "Please send a seperate copy.", expectedReplacement: "separate" },
    { id: "G-027", ruleId: "grammar.spelling.accomodate", input: "We can accomodate that request.", expectedReplacement: "accommodate" },
    { id: "G-028", ruleId: "grammar.spelling.tommorow", input: "I will update you tommorow.", expectedReplacement: "tomorrow" },
    { id: "G-029", ruleId: "grammar.contraction.couldnt", input: "I couldnt open the attachment.", expectedReplacement: "couldn't" },
    { id: "G-030", ruleId: "grammar.contraction.wouldnt", input: "I wouldnt change this yet.", expectedReplacement: "wouldn't" },
    { id: "G-031", ruleId: "grammar.contraction.shouldnt", input: "This shouldnt take long.", expectedReplacement: "shouldn't" },
    { id: "G-032", ruleId: "grammar.contraction.wont", input: "This wont affect the update.", expectedReplacement: "won't" },
    { id: "G-033", ruleId: "grammar.contraction.doesnt", input: "This doesnt match the file.", expectedReplacement: "doesn't" },
    { id: "G-034", ruleId: "grammar.punctuation.sentence_spacing", input: "Thanks.I can check this.", expectedReplacement: ". I" },
    { id: "G-035", ruleId: "grammar.punctuation.repeated_marks", input: "Can you send this??", expectedReplacement: "?" },
    { id: "C-001", ruleId: "clarity.specificity.very_soon", input: "This should be resolved very soon.", expectedReplacement: "as soon as I have the update" },
    { id: "C-002", ruleId: "clarity.wordiness.in_order_to", input: "I need this in order to help.", expectedReplacement: "to" },
    { id: "C-003", ruleId: "clarity.wordiness.due_to_fact", input: "This changed due to the fact that the slot moved.", expectedReplacement: "because" },
    { id: "C-004", ruleId: "clarity.wordiness.moment_in_time", input: "At this moment in time, I do not have the file.", expectedReplacement: "now" },
    { id: "C-005", ruleId: "clarity.wordiness.please_note_that", input: "Please note that the booking is confirmed.", expectedReplacement: "" },
    { id: "C-006", ruleId: "clarity.phrase.provide_me_with", input: "Please provide me with the reference.", expectedReplacement: "send me" },
    { id: "C-007", ruleId: "clarity.hedging.just", input: "I just need the reference number.", expectedReplacement: null },
    { id: "C-008", ruleId: "clarity.length.long_sentence", input: "I can check the booking now and confirm the slot because the previous appointment was changed by the team and the new time needs to be verified before I send it to you.", expectedReplacement: null },
    { id: "C-009", ruleId: "clarity.wordiness.in_the_event_that", input: "In the event that this changes, I will update you.", expectedReplacement: "if" },
    { id: "C-010", ruleId: "clarity.wordiness.with_regards_to", input: "With regards to your booking, I can help.", expectedReplacement: "about" },
    { id: "C-011", ruleId: "clarity.wordiness.prior_to", input: "Please send this prior to the appointment.", expectedReplacement: "before" },
    { id: "C-012", ruleId: "clarity.wordiness.at_later_date", input: "We can check this at a later date.", expectedReplacement: "later" },
    { id: "C-013", ruleId: "clarity.jargon.backend", input: "The backend is still updating.", expectedReplacement: null },
    { id: "C-014", ruleId: "clarity.wordiness.i_wanted_to_let_you_know", input: "I wanted to let you know that the file is ready.", expectedReplacement: "to update you," },
    { id: "C-015", ruleId: "clarity.wordiness.in_regards_to", input: "In regards to your message, I can help.", expectedReplacement: "about" },
    { id: "C-016", ruleId: "clarity.wordiness.in_relation_to", input: "In relation to the update, I can confirm it.", expectedReplacement: "about" },
    { id: "C-017", ruleId: "clarity.wordiness.earliest_convenience", input: "Please reply at your earliest convenience.", expectedReplacement: "when you can" },
    { id: "C-018", ruleId: "clarity.wordiness.at_this_point_in_time", input: "At this point in time, I do not have the file.", expectedReplacement: "now" },
    { id: "C-019", ruleId: "clarity.wordiness.going_forward", input: "Going forward, I will update you here.", expectedReplacement: "from now on" },
    { id: "C-020", ruleId: "clarity.structure.overloaded_commas", input: "I can check this now, confirm the update, review the reference, and send the next step once I have checked the details.", expectedReplacement: null },
    { id: "C-021", ruleId: "clarity.structure.repeated_sentence_start", input: "I can check this now. I can confirm the reference after that.", expectedReplacement: null },
    { id: "C-022", ruleId: "clarity.wordiness.basically", input: "Basically, I can check this.", expectedReplacement: "" },
    { id: "C-023", ruleId: "clarity.wordiness.actually", input: "I actually checked this already.", expectedReplacement: "" },
    { id: "C-024", ruleId: "clarity.wordiness.i_think_that", input: "I think that this is ready.", expectedReplacement: "I think" },
    { id: "C-025", ruleId: "clarity.wordiness.in_process_of", input: "We are in the process of checking this.", expectedReplacement: "" },
    { id: "C-026", ruleId: "clarity.wordiness.timely_manner", input: "I will reply in a timely manner.", expectedReplacement: "promptly" },
    { id: "C-027", ruleId: "clarity.wordiness.position_to", input: "I am in a position to confirm this.", expectedReplacement: "able to" },
    { id: "C-028", ruleId: "clarity.wordiness.purpose_of", input: "This is for the purpose of checking the file.", expectedReplacement: "for" },
    { id: "T-001", ruleId: "tone.robotic.as_per", input: "As per our process, I will update you.", expectedReplacement: "following" },
    { id: "T-002", ruleId: "tone.defensive.as_you_know", input: "As you know, this was already sent.", expectedReplacement: "to confirm" },
    { id: "T-003", ruleId: "tone.blame.you_should_have", input: "You should have sent this earlier.", expectedReplacement: "the usual next step is to" },
    { id: "T-004", ruleId: "tone.blame.you_failed_to", input: "You failed to send the document.", expectedReplacement: "we do not have" },
    { id: "T-005", ruleId: "tone.escalation.calm_down", input: "Please calm down.", expectedReplacement: null },
    { id: "T-006", ruleId: "tone.passive_aggressive.obviously", input: "Obviously, this was already handled.", expectedReplacement: "" },
    { id: "T-007", ruleId: "tone.apology.repeated", input: "Sorry, I am sorry this happened.", expectedReplacement: null },
    { id: "T-008", ruleId: "tone.command.you_need_to", input: "You need to send the reference.", expectedReplacement: "please" },
    { id: "T-009", ruleId: "tone.dismissive.not_my_problem", input: "That is not my problem.", expectedReplacement: null },
    { id: "T-010", ruleId: "tone.accusatory.you_are_wrong", input: "You are wrong about this.", expectedReplacement: "I can clarify this" },
    { id: "T-011", ruleId: "tone.robotic.kindly", input: "Kindly send the reference.", expectedReplacement: "please" },
    { id: "T-012", ruleId: "tone.absolute.no_way", input: "No way, that is impossible.", expectedReplacement: null },
    { id: "T-013", ruleId: "tone.command.you_must", input: "You must send the reference.", expectedReplacement: "please" },
    { id: "T-014", ruleId: "tone.command.you_have_to", input: "You have to send the reference.", expectedReplacement: "please" },
    { id: "T-015", ruleId: "tone.defensive.i_told_you", input: "I told you this was updated.", expectedReplacement: "I mentioned" },
    { id: "T-016", ruleId: "tone.accusatory.you_claim", input: "You claim the payment was made.", expectedReplacement: "you mentioned" },
    { id: "T-017", ruleId: "tone.apology.sorry_for_inconvenience", input: "Sorry for inconvenience.", expectedReplacement: "I'm sorry for the inconvenience" },
    { id: "T-018", ruleId: "tone.command.be_patient", input: "Please be patient while I check.", expectedReplacement: "thanks for your patience" },
    { id: "T-019", ruleId: "tone.dismissive.nothing_i_can_do", input: "There is nothing I can do.", expectedReplacement: null },
    { id: "T-020", ruleId: "tone.blame.you_did_not", input: "You did not send the reference.", expectedReplacement: "we haven't received" },
    { id: "G-036", ruleId: "grammar.confusion.affect_effect", input: "This will effect the booking.", expectedReplacement: "will affect" },
    { id: "G-037", ruleId: "grammar.confusion.accept_except", input: "Please except my apologies.", expectedReplacement: "please accept" },
    { id: "C-029", ruleId: "clarity.nominalization.make_decision", input: "We need to make a decision today.", expectedReplacement: "decide" },
    { id: "C-030", ruleId: "clarity.nominalization.provide_assistance", input: "I can provide assistance with that.", expectedReplacement: "help" },
    { id: "C-031", ruleId: "clarity.wordiness.at_all_times", input: "We are here to help at all times.", expectedReplacement: "always" },
    { id: "C-032", ruleId: "clarity.wordiness.near_future", input: "I will update you in the near future.", expectedReplacement: "soon" },
    { id: "T-021", ruleId: "tone.passive_aggressive.per_my_last", input: "Per my last email, we are waiting.", expectedReplacement: "as mentioned" },
    { id: "T-022", ruleId: "tone.filler.to_be_honest", input: "To be honest, I am not sure.", expectedReplacement: "" },
    { id: "T-023", ruleId: "tone.minimizing.just_checking", input: "I am just checking the status.", expectedReplacement: "checking" },
    { id: "T-024", ruleId: "tone.robotic.please_be_advised_that", input: "Please be advised that the slot is closed.", expectedReplacement: "" }
  ];
  /* Negative cases: valid text that must NOT trigger the rule (guards against false positives). */
  const RULE_NEGATIVE_TESTS = [
    { id: "N-001", ruleId: "grammar.punctuation.sentence_spacing", input: "Open file.txt at 9 a.m., e.g. index.html, in Washington D.C." },
    { id: "N-002", ruleId: "grammar.duplicate.repeated_word", input: "We knew that that was fine and she had had enough." },
    { id: "N-003", ruleId: "grammar.article.a_to_an", input: "Option a or b. Send a user a unit, a one-off fee, a European quote." },
    { id: "N-004", ruleId: "grammar.article.an_to_a", input: "Wait an hour for an honest answer and an update." },
    { id: "N-005", ruleId: "grammar.punctuation.comma_spacing", input: "Email a.b@x.com,c.d@y.com or use x,y coordinates." },
    { id: "N-006", ruleId: "tone.absolute.no_way", input: "It is not impossible to fix, so let us try." },
    { id: "N-007", ruleId: "grammar.capitalization.first_person_i", input: "Use the i.e. form here." },
    { id: "N-008", ruleId: "grammar.contraction.im", input: "The IM feature is enabled." }
  ];
  RULE_TESTS.push.apply(RULE_TESTS, EXT.tests);
  RULE_NEGATIVE_TESTS.push.apply(RULE_NEGATIVE_TESTS, EXT.negatives);

  function isPlainObject(v) { return Boolean(v) && typeof v==="object" && !Array.isArray(v); }
  function safeProfileText(v, fb) { const t=typeof v==="string"?v.trim():""; return t?t.slice(0,120):fb; }
  function uniqueStrings(arr) {
    if (!Array.isArray(arr)) return [];
    const seen=new Set(); arr.forEach(v=>{ if(typeof v==="string"){const c=v.trim();if(c)seen.add(c);}});
    return Array.from(seen);
  }
  function buildContractMetadata() {
    return { app:APP_NAME, appVersion:APP_VERSION, engine:ENGINE_ID, engineContractVersion:ENGINE_CONTRACT_VERSION, ruleProfileSchemaVersion:RULE_PROFILE_SCHEMA_VERSION, testReportSchemaVersion:TEST_REPORT_SCHEMA_VERSION, offline:true, externalDependencies:false };
  }
  function exportProfileValidation(v) {
    const s=v||defaultProfileValidation();
    return { valid:s.valid, status:s.status, errors:s.errors.slice(), warnings:s.warnings.slice(), acceptedDisabledRuleIds:s.acceptedDisabledRuleIds.slice(), rejectedDisabledRuleIds:s.rejectedDisabledRuleIds.slice(), unknownRuleIds:s.unknownRuleIds.slice(), duplicateRuleIds:s.duplicateRuleIds.slice() };
  }
  function validateRuleProfile(profile) {
    const errors=[], warnings=[], unknownRuleIds=[], duplicateRuleIds=[], disabledFromRules=[];
    if (!isPlainObject(profile)) {
      errors.push("Profile must be a JSON object.");
      return { valid:false, status:"invalid", profileId:"invalid-profile", profileName:"Invalid profile", schemaVersion:"unknown", acceptedDisabledRuleIds:[], rejectedDisabledRuleIds:[], unknownRuleIds, duplicateRuleIds, errors, warnings };
    }
    if ("rules" in profile && !Array.isArray(profile.rules)) errors.push("rules must be an array.");
    if ("disabledRuleIds" in profile && !Array.isArray(profile.disabledRuleIds)) errors.push("disabledRuleIds must be an array.");
    if (!("rules" in profile) && !("disabledRuleIds" in profile)) errors.push("Profile must include rules or disabledRuleIds.");
    const seen=new Set();
    if (Array.isArray(profile.rules)) {
      profile.rules.forEach((rule,i)=>{
        if (!isPlainObject(rule)){errors.push("rules["+i+"] must be an object.");return;}
        const id=safeProfileText(rule.id,"");
        if (!id){errors.push("rules["+i+"].id is required.");return;}
        if (seen.has(id)) duplicateRuleIds.push(id); seen.add(id);
        if (!RULE_ID_SET.has(id)) unknownRuleIds.push(id);
        if (rule.category&&!RULE_CATEGORIES.includes(rule.category)) warnings.push("Rule "+id+" has unknown category "+rule.category+".");
        if (rule.severity&&!RULE_SEVERITIES.includes(rule.severity)) warnings.push("Rule "+id+" has unknown severity "+rule.severity+".");
        if (rule.confidence!=null&&(typeof rule.confidence!=="number"||rule.confidence<0||rule.confidence>1)) warnings.push("Rule "+id+" confidence must be 0-1.");
        if (rule.enabled===false||rule.disabled===true) disabledFromRules.push(id);
      });
    }
    const requested=uniqueStrings(uniqueStrings(profile.disabledRuleIds).concat(disabledFromRules));
    const accepted=requested.filter(id=>RULE_ID_SET.has(id));
    const rejected=requested.filter(id=>!RULE_ID_SET.has(id));
    const uUnk=uniqueStrings(unknownRuleIds), uDup=uniqueStrings(duplicateRuleIds);
    if (uUnk.length) warnings.push("Profile references unknown rules: "+uUnk.join(", ")+".");
    if (uDup.length) warnings.push("Profile contains duplicate rules: "+uDup.join(", ")+".");
    if (rejected.length) warnings.push("Ignored unknown disabled rules: "+rejected.join(", ")+".");
    return { valid:errors.length===0, status:errors.length?"invalid":warnings.length?"warning":"valid", profileId:safeProfileText(profile.id,"imported-profile"), profileName:safeProfileText(profile.name,"Imported profile"), schemaVersion:safeProfileText(profile.schemaVersion||profile.version,"legacy"), acceptedDisabledRuleIds:accepted, rejectedDisabledRuleIds:rejected, unknownRuleIds:uUnk, duplicateRuleIds:uDup, errors, warnings };
  }
  function defaultProfileValidation() {
    return validateRuleProfile({ id:RULE_PROFILE_ID, name:"MirrorFlow Assist Local Default", schemaVersion:RULE_PROFILE_SCHEMA_VERSION, disabledRuleIds:Array.from(disabledRuleIds), rules:RULE_REGISTRY.map(r=>({id:r.id})) });
  }
  function profilePresetDisabledIds(preset) {
    const disabledCategories = Array.isArray(preset && preset.disableCategories) ? preset.disableCategories : [];
    return RULE_REGISTRY.filter(rule => disabledCategories.includes(rule.category)).map(rule => rule.id);
  }
  function getProfilePresetDef(id) {
    return PROFILE_PRESET_DEFS.find(preset => preset.id === id) || PROFILE_PRESET_DEFS[0];
  }
  function buildPresetProfile(id) {
    const preset = getProfilePresetDef(id);
    const disabled = profilePresetDisabledIds(preset);
    return {
      id: RULE_PROFILE_ID + "-" + preset.id,
      name: preset.name,
      schemaVersion: RULE_PROFILE_SCHEMA_VERSION,
      source: "preset",
      presetId: preset.id,
      disabledRuleIds: disabled,
      rules: RULE_REGISTRY.map(rule => ({ id:rule.id, enabled:!disabled.includes(rule.id) }))
    };
  }
  function getProfilePresets() {
    return PROFILE_PRESET_DEFS.map(preset => {
      const disabled = profilePresetDisabledIds(preset);
      return {
        id: preset.id,
        name: preset.name,
        note: preset.note,
        disabledRuleIds: disabled,
        activeRuleCount: RULE_REGISTRY.length - disabled.length,
        disabledRuleCount: disabled.length
      };
    });
  }
  function markCustomProfile() {
    if (importedRuleProfile) {
      importedRuleProfile = Object.assign({}, importedRuleProfile, { id:RULE_PROFILE_ID + "-custom", name:"Custom", source:"custom", presetId:null });
    }
    profileValidation = null;
  }
  function getDisabledRuleSet(s) { return s instanceof Set ? s : disabledRuleIds; }
  function getActiveRegexRules(s) { const d=getDisabledRuleSet(s); return REGEX_RULES.filter(r=>!d.has(r.id)); }
  function getActiveStructuralRules(s) { const d=getDisabledRuleSet(s); return STRUCTURAL_RULES.filter(r=>!d.has(r.id)); }
  function getActiveRules(s) { const d=getDisabledRuleSet(s); return RULE_REGISTRY.filter(r=>!d.has(r.id)); }
  function buildRuleProfile(ruleState, validationState, profileMeta) {
    const d=getDisabledRuleSet(ruleState);
    const v=validationState||profileValidation||defaultProfileValidation();
    const m=profileMeta||importedRuleProfile||{};
    return { id:m.id||v.profileId||RULE_PROFILE_ID, name:m.name||v.profileName||"MirrorFlow Assist Local Default", schemaVersion:RULE_PROFILE_SCHEMA_VERSION, version:RULE_PROFILE_SCHEMA_VERSION, engine:ENGINE_ID, engineContractVersion:ENGINE_CONTRACT_VERSION, imported:Boolean(profileMeta?profileMeta.imported:importedRuleProfile), source:m.source||(importedRuleProfile?"imported":"local"), presetId:m.presetId||null, valid:v.valid, validation:exportProfileValidation(v), disabledRuleIds:Array.from(d), activeRuleIds:getActiveRules(d).map(r=>r.id), categories:RULE_CATEGORIES.slice(), rules:RULE_REGISTRY.map(r=>({id:r.id,category:r.category,subtype:r.subtype,label:r.label,severity:r.severity,confidence:r.confidence,note:r.note,enabled:!d.has(r.id),applySafe:r.replacement!==null&&r.replacement!==undefined})) };
  }
  function wordsOf(text) { return (text.match(/[A-Za-z0-9']+/g)||[]); }
  function sentenceList(text) { return text.split(/(?<=[.!?])\s+/).map(s=>s.trim()).filter(Boolean); }
  function syllableCount(word) {
    const clean=String(word).toLowerCase().replace(/[^a-z]/g,"");
    if (!clean) return 0;
    const groups=clean.replace(/e\b/,"").match(/[aeiouy]+/g);
    return Math.max(1,groups?groups.length:1);
  }
  function clamp(v,mn,mx) { return Math.max(mn,Math.min(mx,v)); }
  function countPattern(text,pat) { return (String(text||"").match(pat)||[]).length; }
  function buildClarityComponent(id,label,weight,rawScore,evidence,rec) {
    const score=clamp(Math.round(rawScore),0,weight);
    return { id, label, weight, score, impact:weight?Math.round((score/weight)*100):0, evidence, recommendation:rec };
  }
  function buildClarityScore(text, issues, metrics) {
    if (!metrics.wordCount) {
      const components = {
        length:buildClarityComponent("length","Reading length",CLARITY_SCORE_WEIGHTS.length,0,{grade:0,avgSentenceLength:0,longSentences:0},"Split long sentences and keep chat replies under one main idea per sentence."),
        vagueTiming:buildClarityComponent("vagueTiming","Vague timing",CLARITY_SCORE_WEIGHTS.vagueTiming,0,{issues:0,terms:0},"Replace vague timing with a concrete update point or next action."),
        wordiness:buildClarityComponent("wordiness","Wordiness",CLARITY_SCORE_WEIGHTS.wordiness,0,{issues:0},"Apply safe phrase cuts where the replacement does not change meaning."),
      jargon:buildClarityComponent("jargon","Internal jargon",CLARITY_SCORE_WEIGHTS.jargon,0,{issues:0},"Translate internal system language into plain wording."),
        specificity:buildClarityComponent("specificity","Specificity",CLARITY_SCORE_WEIGHTS.specificity,0,{vagueReferents:0,concreteAnchors:0,nextStepAnchors:0},"Name the exact item, next step, owner, or timing anchor.")
      };
      return { model:CLARITY_MODEL_VERSION, score:0, quality:100, level:"Clear", risk:"Low", weights:Object.assign({},CLARITY_SCORE_WEIGHTS), components, recommendations:[] };
    }
    const clarityIssues=issues.filter(i=>i.category==="clarity");
    const wordinessIssues=clarityIssues.filter(i=>i.subtype==="wordiness"||i.subtype==="hedging");
    const jargonIssues=clarityIssues.filter(i=>i.subtype==="jargon");
    const vagueTimingIssues=clarityIssues.filter(i=>i.ruleId==="clarity.specificity.very_soon");
    const vagueTimingTerms=countPattern(text,/\b(soon|shortly|asap|when possible|at some point|later)\b/gi);
    const vagueReferents=countPattern(text,/\b(this|that|it|thing|things|stuff|issue|problem|matter)\b/gi);
    const concreteAnchors=countPattern(text,/\b(\d+|today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|reference|ref|booking|order|ticket|case|slot|appointment|refund|document|account)\b/gi);
    const nextStepAnchors=countPattern(text,/\b(send|check|confirm|update|call|reply|attach|verify|approve|book|cancel|change|resolve)\b/gi);
    const specificityPressure=(vagueReferents*3)+(concreteAnchors?0:8)+(nextStepAnchors?0:5);
    const avgSentenceLength=metrics.avgSentenceLength||0;
    const lengthPressure=(metrics.longSentences*12)+Math.max(0,avgSentenceLength-18)*1.4+Math.max(0,metrics.grade-9)*2.2;
    const components = {
      length:buildClarityComponent("length","Reading length",CLARITY_SCORE_WEIGHTS.length,lengthPressure,{grade:metrics.grade,avgSentenceLength,longSentences:metrics.longSentences},"Split long sentences and keep chat replies under one main idea per sentence."),
      vagueTiming:buildClarityComponent("vagueTiming","Vague timing",CLARITY_SCORE_WEIGHTS.vagueTiming,(vagueTimingIssues.length*12)+(Math.max(0,vagueTimingTerms-vagueTimingIssues.length)*6),{issues:vagueTimingIssues.length,terms:vagueTimingTerms},"Replace vague timing with a concrete update point or next action."),
      wordiness:buildClarityComponent("wordiness","Wordiness",CLARITY_SCORE_WEIGHTS.wordiness,wordinessIssues.length*5,{issues:wordinessIssues.length},"Apply safe phrase cuts where the replacement does not change meaning."),
      jargon:buildClarityComponent("jargon","Internal jargon",CLARITY_SCORE_WEIGHTS.jargon,jargonIssues.length*10,{issues:jargonIssues.length},"Translate internal system language into plain wording."),
      specificity:buildClarityComponent("specificity","Specificity",CLARITY_SCORE_WEIGHTS.specificity,specificityPressure,{vagueReferents,concreteAnchors,nextStepAnchors},"Name the exact item, next step, owner, or timing anchor.")
    };
    const score=Object.values(components).reduce((sum,item)=>sum+item.score,0);
    const recommendations=Object.values(components).filter(item=>item.score>0).sort((a,b)=>b.score-a.score).slice(0,3).map(item=>item.recommendation);
    return { model:CLARITY_MODEL_VERSION, score, quality:100-score, level:score>=62?"Dense":score>=38?"Heavy":score>=18?"Watch":"Clear", risk:score>=62?"High":score>=38?"Medium":"Low", weights:Object.assign({},CLARITY_SCORE_WEIGHTS), components, recommendations };
  }
  function buildWritingQuality(issues, clarityScore, tone, metrics) {
    const activeIssues = issues || [];
    const byCategory = RULE_CATEGORIES.reduce((acc, cat) => {
      acc[cat] = activeIssues.filter(issue => issue.category === cat).length;
      return acc;
    }, {});
    const severityWeight = { high:18, medium:9, low:4 };
    const issuePressure = activeIssues.reduce((sum, issue) =>
      sum + (severityWeight[issue.severity] || 6) * (issue.confidence || 0.8), 0);
    const clarityPressure = Math.min(24, Math.round((clarityScore?.score || 0) * 0.35));
    const tonePressure = Math.min(24, Math.round((tone?.score || 0) * 0.45));
    const mechanicsPressure = Math.min(18, byCategory.grammar * 4);
    const totalPressure = Math.min(92, Math.round(issuePressure + clarityPressure + tonePressure + mechanicsPressure));
    const score = metrics.wordCount ? clamp(100 - totalPressure, 0, 100) : 0;
    const weighted = RULE_CATEGORIES.map(category => ({
      category,
      weight: activeIssues
        .filter(issue => issue.category === category)
        .reduce((sum, issue) => sum + (severityWeight[issue.severity] || 6), 0)
    })).sort((a, b) => b.weight - a.weight);
    const primary = weighted[0] && weighted[0].weight > 0 ? weighted[0].category : "clean";
    const highRisk = activeIssues.some(issue => issue.severity === "high");
    const nextAction = !metrics.wordCount ? "Start with text" :
      highRisk && byCategory.grammar ? "Fix mechanics first" :
      highRisk && byCategory.tone ? "Soften high-risk tone" :
      primary === "clarity" ? "Tighten clarity" :
      primary === "tone" ? "Polish tone" :
      primary === "grammar" ? "Fix mechanics" :
      "Ready to use";
    return {
      score,
      state:!metrics.wordCount?"Blank":score>=90?"Clean":score>=76?"Polish":score>=60?"Needs edit":"Heavy",
      primary,
      nextAction,
      issuePressure:Math.round(issuePressure),
      clarityPressure,
      tonePressure,
      mechanicsPressure,
      counts:byCategory
    };
  }
  function protectSpans(text) {
    const spans=[];
    [{ type:"placeholder", re:/\{\{[^}]+\}\}/g },{ type:"url", re:/\b(?:https?:\/\/|www\.)[^\s]+/gi },{ type:"email", re:/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi },{ type:"ticket", re:/\b[A-Z]{2,}-\d{3,}\b/g },{ type:"code", re:/`[^`\n]+`/g },{ type:"file", re:/\b[\w-]+\.(?:pdf|png|jpe?g|gif|txt|csv|xlsx?|docx?|pptx?|html?|zip|json|mp4)\b/gi },{ type:"quote", re:/\u201c[^\u201d\n]{3,300}\u201d|"[^"\n]{3,300}"/g },{ type:"reference", re:/#\d{3,}\b/g }]
      .forEach(({type,re})=>{ let m; while((m=re.exec(text))) spans.push({type,start:m.index,end:m.index+m[0].length,text:m[0]}); });
    return spans.sort((a,b)=>a.start-b.start);
  }
  function spansOverlap(as,ae,bs,be) { return as<be&&bs<ae; }
  function isProtected(start,end,spans) { return spans.some(s=>spansOverlap(start,end,s.start,s.end)); }
  function addIssue(issues, protectedSpans, issue) {
    if (issue.start!=null&&issue.end!=null&&isProtected(issue.start,issue.end,protectedSpans)) return;
    issues.push(Object.assign({ id:"iss_"+(issues.length+1), severity:"medium", confidence:0.8, replacement:null, applySafe:issue.replacement!==null&&issue.replacement!==undefined, status:"active" }, issue));
  }
  function applyReplacement(match, rule) {
    let out = rule.replacement;
    if (out===null||out===undefined) return null;
    if (typeof out==="function") out = String(out(match));
    else out = out.replace(/\$(\d|&|\$)/g,(_,k)=>k==="$"?"$":k==="&"?match[0]:(match[+k]||""));
    if (rule.keepCase && out) {
      const o=match[0];
      if (o.length>1 && o===o.toUpperCase() && /[A-Z]/.test(o)) out=out.toUpperCase();
      else if (/^[A-Z]/.test(o)) out=out.charAt(0).toUpperCase()+out.slice(1);
    }
    return out;
  }
  function sentenceSpans(text) {
    const spans=[], re=/[^.!?]+(?:[.!?]+|$)/g; let m;
    while ((m=re.exec(text))) {
      const raw=m[0], lead=raw.length-raw.trimStart().length, sentence=raw.trim();
      if (sentence) spans.push({ sentence, start:m.index+lead, end:m.index+lead+sentence.length });
    }
    return spans;
  }
  function issueFromRegexRule(rule, match) {
    const replacement=applyReplacement(match, rule);
    const issue={ ruleId:rule.id, category:rule.category, subtype:rule.subtype, label:rule.label, start:match.index, end:match.index+match[0].length, message:typeof rule.message==="function"?rule.message(match,replacement):rule.message, replacement, severity:rule.severity, confidence:rule.confidence, excerpt:match[0] };
    if (rule.safe===false) issue.applySafe=false;
    return issue;
  }
  function normalizeRewriteText(value) {
    return String(value || "")
      .replace(/[ \t]+([,.;:!?])/g, "$1")
      .replace(/([([{])\s+/g, "$1")
      .replace(/\s+([)\]}])/g, "$1")
      .replace(/[ \t]{2,}/g, " ")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n[ \t]+/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
      .replace(/(^|[.!?]\s+|\n+)([a-z])/g, (_, lead, first) => lead + first.toUpperCase());
  }
  function canApplyIssue(issue) {
    return issue && issue.applySafe &&
      issue.replacement !== null && issue.replacement !== undefined &&
      Number.isFinite(issue.start) && Number.isFinite(issue.end) &&
      issue.end >= issue.start;
  }
  function applyIssueSet(text, issues, predicate) {
    const source = String(text || "");
    let next = source;
    let floor = source.length + 1;
    const appliedRuleIds = [];
    const canShareBoundary = issue =>
      issue && issue.subtype === "punctuation" &&
      issue.start < floor && issue.end === floor + 1;
    (issues || [])
      .filter(canApplyIssue)
      .filter(issue => !predicate || predicate(issue))
      .sort((a, b) => (b.start - a.start) || (b.end - a.end))
      .forEach(issue => {
        if (issue.end > floor && !canShareBoundary(issue)) return;
        if (next.slice(issue.start, issue.end) !== issue.excerpt) return;
        next = next.slice(0, issue.start) + String(issue.replacement) + next.slice(issue.end);
        floor = issue.start;
        appliedRuleIds.push(issue.ruleId);
      });
    return { text:normalizeRewriteText(next), appliedRuleIds:appliedRuleIds.reverse() };
  }
  function buildRewriteImpact(appliedRuleIds, issues) {
    const applied = (appliedRuleIds || []).map(id => (issues || []).find(issue => issue.ruleId === id)).filter(Boolean);
    const counts = RULE_CATEGORIES.reduce((acc, cat) => {
      acc[cat] = applied.filter(issue => issue.category === cat).length;
      return acc;
    }, {});
    const parts = RULE_CATEGORIES
      .filter(cat => counts[cat] > 0)
      .map(cat => cat.charAt(0).toUpperCase() + cat.slice(1) + " " + counts[cat]);
    return {
      counts,
      label:parts.length ? parts.join(" · ") : "No category shift",
      high:applied.filter(issue => issue.severity === "high").length,
      safe:applied.every(issue => issue.applySafe)
    };
  }
  function buildRewritePreviews(text, issues, ruleState, context) {
    const base = String(text || "").trim();
    const variants = [
      {
        id:"clean",
        title:"Clean pass",
        intent:"Fix grammar, mechanics, and safe clarity edits.",
        test:issue => issue.category === "grammar" ||
          (issue.category === "clarity" && ["wordiness", "hedging", "jargon"].includes(issue.subtype))
      },
      {
        id:"shorter",
        title:"Tighter",
        intent:"Cut wordiness and removable softeners.",
        test:issue => issue.category === "grammar" ||
          (issue.category === "clarity" && ["wordiness", "hedging"].includes(issue.subtype))
      },
      {
        id:"softer",
        title:"Warmer",
        intent:"Reduce hard, defensive, or accusatory wording.",
        test:issue => issue.category === "grammar" || issue.category === "tone"
      }
    ];
    const seen = new Set();
    return variants.map(variant => {
      let applied = applyIssueSet(text, issues, variant.test);
      /* fixes can unlock further fixes ("thier is" -> "their is" -> "there is"), so re-check the result up to twice */
      for (let pass = 0; pass < 2 && applied.appliedRuleIds.length; pass++) {
        const next = applyIssueSet(applied.text, runRuleRegistry(applied.text, protectSpans(applied.text), ruleState, context), variant.test);
        if (!next.appliedRuleIds.length || next.text === applied.text) break;
        applied = { text:next.text, appliedRuleIds:applied.appliedRuleIds.concat(next.appliedRuleIds) };
      }
      if (!applied.appliedRuleIds.length || applied.text === base || seen.has(applied.text)) return null;
      seen.add(applied.text);
      return {
        id:variant.id,
        title:variant.title,
        intent:variant.intent,
        source:"deterministic_rules",
        changes:applied.appliedRuleIds.length,
        appliedRuleIds:applied.appliedRuleIds,
        impact:buildRewriteImpact(applied.appliedRuleIds, issues),
        text:applied.text
      };
    }).filter(Boolean);
  }
  function runRuleRegistry(text, protectedSpans, ruleState, context) {
    const issues=[], lower=text.toLowerCase();
    const push=(issue,spans)=>addIssue(issues,spans||protectedSpans,issue);
    getActiveRegexRules(ruleState).forEach(rule=>{
      let pat=rule._re;
      if (!pat) { const flags=rule.pattern.flags.includes("g")?rule.pattern.flags:rule.pattern.flags+"g"; pat=rule._re=new RegExp(rule.pattern.source,flags); }
      pat.lastIndex=0;
      let m; while((m=pat.exec(text))) {
        if (m[0]==="") { pat.lastIndex++; continue; }
        if (rule.guard && !rule.guard(m,text)) continue;
        push(issueFromRegexRule(rule,m),protectedSpans);
      }
    });
    getActiveStructuralRules(ruleState).forEach(rule=>rule.run({text,lower,protectedSpans,issues,push,context:context||{}}));
    return dedupeIssues(issues);
  }
  /* drop exact duplicates and keep the stronger of two same-category issues that overlap */
  function dedupeIssues(issues) {
    const sevRank={high:3,medium:2,low:1};
    const strength=i=>(sevRank[i.severity]||1)*10+(i.confidence||0);
    const sorted=issues.slice().sort((a,b)=>a.start-b.start||strength(b)-strength(a));
    const kept=[];
    sorted.forEach(issue=>{
      const clash=kept.findIndex(k=>k.category===issue.category&&k.start<issue.end&&issue.start<k.end&&(k.ruleId===issue.ruleId||(k.start===issue.start&&k.end===issue.end)));
      if (clash<0) kept.push(issue);
    });
    kept.forEach((k,i)=>{ k.id="iss_"+(i+1); });
    return kept;
  }
  function resolveEngineContext(context) {
    const safeCtx=isPlainObject(context)?context:{};
    if (safeCtx.ruleProfile) {
      const v=validateRuleProfile(safeCtx.ruleProfile);
      return { context:safeCtx, disabledRuleIds:new Set(v.valid?v.acceptedDisabledRuleIds:[]), profileValidation:v, profileMeta:{id:v.profileId,name:v.profileName,schemaVersion:v.schemaVersion,source:"context",imported:false} };
    }
    return { context:safeCtx, disabledRuleIds, profileValidation:profileValidation||defaultProfileValidation(), profileMeta:importedRuleProfile||null };
  }
  /* Reads the draft as a quick chat reply or a fuller email, and tunes rules to match. No setting needed. */
  function detectRegister(text) {
    const t=String(text||"").trim();
    const words=(t.match(/[A-Za-z0-9']+/g)||[]).length;
    const paragraphs=t.split(/\n\s*\n/).filter(Boolean).length;
    const greeting=/^(hi|hello|dear|hey|good (morning|afternoon|evening))\b/i.test(t);
    const signoff=/(regards|thanks|thank you|best wishes|cheers|sincerely|yours)[,.!]?\s*\n+\s*[A-Za-z][^\n]{0,30}$/i.test(t);
    if ((greeting && (words>=45||paragraphs>=2)) || signoff || paragraphs>=3 || words>=110) return "email";
    return "chat";
  }
  const CHAT_SUPPRESS=new Set(["clarity.length.long_paragraph","clarity.structure.repeated_sentence_start","clarity.voice.passive_heavy","grammar.structure.fragment","clarity.opener.wanted_to_reach_out","clarity.opener.writing_to","clarity.opener.wondering_if","clarity.jargon.approximately"]);
  const EMAIL_RAISE=new Set(["hedging","opener","wordiness","jargon","over_apology"]);
  function tuneForRegister(issues, register) {
    if (register==="chat") {
      issues=issues.filter(i=>!CHAT_SUPPRESS.has(i.ruleId));
      issues.forEach(i=>{ if (i.ruleId==="tone.command.bare_request") i.severity="low"; });
    } else {
      issues.forEach(i=>{ if (EMAIL_RAISE.has(i.subtype) && i.severity==="low") i.severity="medium"; });
    }
    issues.forEach((i,n)=>{ i.id="iss_"+(n+1); });
    return issues;
  }
  function buildRationale(issues, score, projected, safeCount) {
    if (!issues.length) return "No issues found.";
    const by={grammar:[0,0],clarity:[0,0],tone:[0,0]};
    issues.forEach(i=>{ const c=by[i.category]; if (c) { c[0]++; if (i.severity==="high") c[1]++; } });
    const parts=Object.keys(by).filter(k=>by[k][0]).sort((a,b)=>by[b][0]-by[a][0]).slice(0,2)
      .map(k=>by[k][0]+" "+k+" issue"+(by[k][0]===1?"":"s")+(by[k][1]?" ("+by[k][1]+" high)":""));
    const lift=projected>score&&safeCount?" Applying the "+safeCount+" safe fix"+(safeCount===1?"":"es")+" would reach about "+projected+".":"";
    return parts.join(" and ")+" pull this down."+lift;
  }
  function analyzeText(text, context) {
    const es=resolveEngineContext(context);
    const protectedSpans=protectSpans(text);
    const lower=text.toLowerCase();
    const register=(es.context&&es.context.register)||detectRegister(text);
    const issues=tuneForRegister(runRuleRegistry(text,protectedSpans,es.disabledRuleIds,es.context),register);
    const words=wordsOf(text), sentences=sentenceList(text);
    const syllables=words.reduce((sum,w)=>sum+syllableCount(w),0);
    const sentenceCount=Math.max(1,sentences.length), wordCount=words.length;
    const grade=wordCount?Math.max(0,Math.round((0.39*(wordCount/sentenceCount))+(11.8*(syllables/wordCount))-15.59)):0;
    const avgSentenceLength=sentenceCount?Math.round(wordCount/sentenceCount):0;
    const longSentences=sentences.filter(s=>wordsOf(s).length>20).length;
    const clarityScore=buildClarityScore(text,issues,{grade,wordCount,sentenceCount,avgSentenceLength,longSentences});
    const apologyCount=(lower.match(/\b(sorry|apologise|apologize)\b/g)||[]).length;
    const roboticCount=(lower.match(/\b(as per|process|procedure|escalate internally|backend)\b/g)||[]).length;
    const frustrationWords=(lower.match(/\b(unfortunately|cannot|unable|delay|issue|problem)\b/g)||[]).length;
    const toneScore=apologyCount*10+roboticCount*14+frustrationWords*5;
    const tone={ primary:toneScore>32?"Risky":toneScore>16?"Formal":"Neutral", risk:toneScore>32?"High":toneScore>16?"Medium":"Low", apologyCount, roboticCount, score:Math.min(100,toneScore) };
    const quality=buildWritingQuality(issues,clarityScore,tone,{wordCount,grade,avgSentenceLength,longSentences});
    const safeFixes=issues.filter(canApplyIssue);
    quality.projected=quality.score;
    if (safeFixes.length && !(context&&context._noProject)) {
      const fixed=applyIssueSet(text,issues,null).text;
      quality.projected=Math.max(quality.score,analyzeText(fixed,Object.assign({},context,{_noProject:true})).quality.score);
    }
    quality.rationale=buildRationale(issues,quality.score,quality.projected,safeFixes.length);
    return {
      engine:ENGINE_ID, contract:buildContractMetadata(), offline:true,
      context:Object.assign({channel:"writing",dialect:"en-GB",register},es.context),
      contextBridge:{ ping:null, issues:0 },
      protectedSpans, issues:issues.sort((a,b)=>a.start-b.start),
      rules:{ profile:buildRuleProfile(es.disabledRuleIds,es.profileValidation,es.profileMeta), active:getActiveRules(es.disabledRuleIds).map(r=>({id:r.id,category:r.category,label:r.label,severity:r.severity})), disabled:Array.from(es.disabledRuleIds), categories:RULE_CATEGORIES.slice() },
      rewrites:buildRewritePreviews(text,issues,es.disabledRuleIds,es.context),
      quality,
      tone,
      clarity:{ model:clarityScore.model, score:clarityScore.score, quality:clarityScore.quality, level:clarityScore.level, risk:clarityScore.risk, grade, words:wordCount, sentences:sentences.length, avgSentenceLength, longSentences, readability:grade<=9?"Good":grade<=12?"Heavy":"Dense", weights:clarityScore.weights, components:clarityScore.components, recommendations:clarityScore.recommendations }
    };
  }
  function runRuleTests() {
    const results = RULE_TESTS.map(test => {
      if (disabledRuleIds.has(test.ruleId)) {
        return {
          id: test.id,
          ruleId: test.ruleId,
          passed: false,
          skipped: true,
          issuePass: false,
          replacementPass: false,
          matched: 0,
          expectedReplacement: test.expectedReplacement,
          actualReplacements: []
        };
      }
      const analysis = analyzeText(test.input, { source: "rule_test", register: "email" });
      const matches = analysis.issues.filter(issue => issue.ruleId === test.ruleId);
      const issuePass = matches.length > 0;
      const replacementPass = test.expectedReplacement === undefined
        ? true
        : matches.some(issue => issue.replacement === test.expectedReplacement);
      return {
        id: test.id,
        ruleId: test.ruleId,
        passed: issuePass && replacementPass,
        skipped: false,
        issuePass,
        replacementPass,
        matched: matches.length,
        expectedReplacement: test.expectedReplacement,
        actualReplacements: matches.map(issue => issue.replacement)
      };
    });
    RULE_NEGATIVE_TESTS.forEach(test => {
      if (disabledRuleIds.has(test.ruleId)) { results.push({ id:test.id, ruleId:test.ruleId, passed:false, skipped:true, matched:0 }); return; }
      const hits = analyzeText(test.input, { source:"rule_test", register:"email" }).issues.filter(issue => issue.ruleId === test.ruleId);
      results.push({ id:test.id, ruleId:test.ruleId, passed:hits.length === 0, skipped:false, negative:true, matched:hits.length,
        detail:hits.length ? "false positive on: " + hits.map(h => JSON.stringify(h.excerpt)).join(", ") : "" });
    });
    const activeResults = results.filter(result => !result.skipped);
    return {
      schemaVersion: TEST_REPORT_SCHEMA_VERSION,
      contract: buildContractMetadata(),
      total: results.length,
      active: activeResults.length,
      skipped: results.filter(result => result.skipped).length,
      passed: activeResults.filter(result => result.passed).length,
      failed: activeResults.filter(result => !result.passed).length,
      results
    };
  }

  window.MirrorFlowAssistEngine = {
    analyzeText,
    contract: buildContractMetadata(),
    rules: RULE_REGISTRY,
    tests: RULE_TESTS,
    buildRuleProfile,
    validateRuleProfile,
    runRuleTests,
    isRuleDisabled: (id) => disabledRuleIds.has(id),
    disableRule: (id) => { if (RULE_ID_SET.has(id)) { disabledRuleIds.add(id); markCustomProfile(); return true; } return false; },
    enableRule:  (id) => { if (RULE_ID_SET.has(id)) markCustomProfile(); disabledRuleIds.delete(id); return true; },
    getDisabledRules: () => Array.from(disabledRuleIds),
    getProfilePresets,
    applyProfilePreset: (id) => {
      const profile = buildPresetProfile(id);
      const v = validateRuleProfile(profile);
      if (v.valid) {
        importedRuleProfile = { id:v.profileId, name:v.profileName, schemaVersion:v.schemaVersion, source:"preset", presetId:profile.presetId, importedAt:new Date().toISOString() };
        disabledRuleIds = new Set(v.acceptedDisabledRuleIds);
        profileValidation = v;
      }
      return { valid:v.valid, status:v.status, profile, validation:v };
    },
    resetProfile: () => { disabledRuleIds = new Set(); importedRuleProfile = null; profileValidation = null; },
    importProfile: (profileData) => {
      const profile = (profileData && profileData.ruleProfile) ? profileData.ruleProfile : profileData;
      const v = validateRuleProfile(profile);
      if (v.valid) {
        importedRuleProfile = { id: v.profileId, name: v.profileName, schemaVersion: v.schemaVersion, source:safeProfileText(profile && profile.source, "imported"), presetId:safeProfileText(profile && profile.presetId, "") || null, importedAt: new Date().toISOString() };
        disabledRuleIds = new Set(v.acceptedDisabledRuleIds);
        profileValidation = v;
      }
      return v;
    },
    exportProfile: () => buildRuleProfile(disabledRuleIds, profileValidation || defaultProfileValidation(), importedRuleProfile)
  };
})();
