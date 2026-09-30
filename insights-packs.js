/* MirrorFlow Insights — adaptive check packs.
   A pack is picked automatically from the customer message (query type) or, failing that, the detected domain.
   Nothing here needs configuring. Each check is: { id, label, severity, required, test(ctx), note, fix, sugLabel, sugNote, insert }
   ctx: { draft, customer, combined, reply, signals, has(list), asked(list), rx(regex) } */
(function () {
  "use strict";

  const lc = s => String(s || "").toLowerCase();
  const norm = s => (typeof window.mfNorm === "function" ? window.mfNorm(s) : lc(s));
  function has(text, list) { const t = norm(text); return list.some(p => t.includes(norm(p))); }
  const REF_RX = /\b(ref|reference|booking id|booking number|confirmation number|invoice|receipt|transaction|payment id|refund id|tracking|order|case|complaint|claim|policy|ticket)\b|[A-Z]{2,}-?\d{3,}|#\d{3,}/i;
  const TIME_RX = /\b(today|tomorrow|tonight|within|by\s+\w+|before\s+\w+|after\s+\w+|end of day|eod|\d+\s+(working\s+|business\s+)?(days?|hours?|minutes?|weeks?)|monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d{1,2}[:.]\d{2}|\d{1,2}\s?(am|pm))\b/i;

  function c(id, label, severity, required, test, note, fix, sugLabel, sugNote, insert) {
    return { id, label, severity, required, test, note, fix, sugLabel: sugLabel || label, sugNote: sugNote || fix, insert: insert || "" };
  }

  const PACKS = [
    {
      id: "refund_payment", label: "Refund / payment", queryIds: ["refund_payment"], packTypes: ["refund_payment"],
      summary: "Money anchor, amount or stage, owner, movement timing, payment path, reference, promise risk.",
      checks: [
        c("money_anchor", "Money anchor", "medium", true, x => x.has(["refund","payment","invoice","charge","charged","fee","billing","bill","paid","money","payout","settlement","balance","direct debit","receipt"]),
          "Money topic is named.", "Name the refund, payment, charge, invoice, fee, or balance.", "Name the money issue", "Make the reply clearly about the refund, payment, invoice, charge, fee, or balance.", "I can check the refund or payment details and confirm the current status."),
        c("money_stage", "Amount or stage", "high", true, x => /(?:£|\$|€)\s?\d|\b\d+(?:\.\d{2})?\b/.test(x.draft) || x.has(["processed","processing","pending","approved","declined","reversed","credited","charged","submitted","raised","checking","being checked","under review","stage","status"]),
          "Amount or processing stage is visible.", "Add the amount or current stage: pending, approved, processed, reversed, credited, or being checked.", "Add amount or stage", "Money replies need either the amount or the current processing stage.", "I will confirm whether the refund is pending, approved, processed, or still being checked."),
        c("money_owner", "Owner", "high", true, x => x.reply.ownership || x.has(["billing team","payments team","refund team","finance team"]),
          "Owner is visible.", "Say who is checking, correcting, refunding, or confirming the payment.", "Add ownership", "Say who is checking, correcting, refunding, or confirming the payment.", "I will check this with the payments team and confirm the next step."),
        c("money_timing", "Movement timing", "high", true, x => x.reply.timeline || x.rx(TIME_RX) || x.has(["working days","business days","billing cycle","next statement","next update","bank processing"]),
          "Money movement timing is visible.", "Add when the refund/payment update or movement should happen.", "Add money timing", "Give a clear update point or movement window for the refund/payment.", "I will send you an update today with the payment status and expected movement window."),
        c("money_path", "Payment path", "medium", true, x => x.has(["original payment method","payment method","card","bank account","direct debit","account credit","statement","invoice","receipt","balance","manual payment","refund route","same card"]),
          "Payment route is clear.", "Mention the payment method, original card, bank account, invoice, receipt, statement, or balance route.", "Clarify payment path", "Mention the card, bank account, invoice, receipt, statement, or balance route.", "If the refund is approved, it will return through the original payment method unless we confirm a different route."),
        c("money_reference", "Reference handling", "medium", "ifAsked", x => !x.askedRef || REF_RX.test(x.draft),
          "Reference need is handled.", "Include the invoice, receipt, transaction, payment, refund, order, case, or ticket reference.", "Handle money reference", "Include the invoice, receipt, transaction, payment, refund, order, case, or ticket reference.", "I will include the invoice or transaction reference in the confirmation."),
        c("money_promise", "Promise control", "high", true, x => !x.has(["guaranteed","guarantee","definitely refunded","definitely paid","definitely back","100% refunded","100% paid","will be resolved today","money will be in today","should be refunded","hopefully","probably"]),
          "No money movement overpromise found.", "Avoid definite refund/payment promises until verified.", "Control money promise", "Avoid firm refund/payment promises until verified.", "I will verify the payment status first, then confirm the exact movement window.")
      ]
    },
    {
      id: "booking_change", label: "Booking / change", queryIds: ["booking_change"], packTypes: ["booking_change"],
      summary: "Booking anchor, date/time, confirmation state, fallback, reference, promise risk.",
      checks: [
        c("booking_anchor", "Booking anchor", "medium", true, x => x.has(["booking","appointment","reservation","slot","schedule","calendar","availability"]),
          "Booking topic is named.", "Name the booking, appointment, slot, or reservation.", "Name the booking", "Make the reply clearly about the appointment, reservation, or slot.", "I can check the booking and confirm the slot details."),
        c("booking_time", "Time anchor", "high", true, x => x.reply.timeline || x.rx(TIME_RX),
          "Date, time, or update point is visible.", "Add a date, time, slot, or clear update point.", "Add the booking time", "Booking replies need a date, time, or clear update point.", "I will confirm the exact date and time before the next update."),
        c("booking_confirmation", "Confirmation state", "high", true, x => x.has(["confirmed","confirm","confirmation","booked","locked in","reserved","scheduled","rescheduled","cancelled","canceled","moved","changed"]),
          "Booking status is explicit.", "Say whether it is confirmed, changed, cancelled, moved, or still being checked.", "Confirm the booking state", "Say whether it is confirmed, changed, cancelled, moved, or still being checked.", "I will confirm whether the booking is locked in or needs to be moved."),
        c("booking_reference", "Reference handling", "medium", "ifAsked", x => !x.askedRef || REF_RX.test(x.draft),
          "Reference need is handled.", "Include the booking reference or say where it will be confirmed.", "Handle the reference", "Include the booking reference or say where it will be confirmed.", "I will include the booking reference in the confirmation."),
        c("booking_fallback", "Fallback option", "low", false, x => x.has(["if that does not work","if this does not work","if the time does not work","if that doesn't work","let me know","alternative","another slot","different time","move it","reschedule","available slot","fallback"]),
          "Fallback or reply path is visible.", "Offer a fallback slot or ask them to send a better window.", "Offer a fallback slot", "Give the customer a path if the slot does not work.", "If that slot does not work, send me a better window and I can move it."),
        c("booking_promise", "Promise control", "high", true, x => !x.has(["guaranteed","guarantee","definitely confirmed","definitely booked","100% confirmed","will be resolved today","should be confirmed","should be booked","hopefully","probably"]),
          "No booking overpromise found.", "Avoid definite booking promises unless verified.", "Control the promise", "Avoid firm booking promises until the slot is verified.", "I will verify the booking first, then confirm the exact slot.")
      ]
    },
    {
      id: "delivery_replacement", label: "Delivery / order", queryIds: ["delivery_replacement"], packTypes: ["delivery_replacement"],
      summary: "Item anchor, delivery status, ETA, tracking reference, resolution path, promise risk.",
      checks: [
        c("delivery_anchor", "Item anchor", "medium", true, x => x.has(["order","parcel","package","item","delivery","product","replacement","shipment","courier"]),
          "The order or parcel is named.", "Name the order, parcel, or item you are talking about.", "Name the order", "Make it clear which order, parcel, or item this is about.", "I have looked up your order and can see where the parcel is."),
        c("delivery_status", "Delivery status", "high", true, x => x.has(["dispatched","shipped","delivered","in transit","out for delivery","collected","arrived","picked up","packed","lost","damaged","delayed","held","with the courier","tracking","on its way","left the warehouse"]),
          "Delivery status is explicit.", "Say where the parcel is now: dispatched, in transit, delivered, delayed, or lost.", "Say where the parcel is", "State the current delivery status in plain words.", "The tracking shows your parcel is currently in transit with the courier."),
        c("delivery_eta", "Arrival estimate", "high", true, x => x.reply.timeline || x.rx(TIME_RX) || x.has(["expected","estimated","eta","arrive"]),
          "Timing is visible.", "Add when it should arrive or when you will next update them.", "Add an arrival window", "Give the customer a date, window, or update point.", "It is due to arrive by Thursday, and I will update you if that changes."),
        c("delivery_tracking", "Tracking or order reference", "medium", "ifAsked", x => !x.askedRef || REF_RX.test(x.draft),
          "Reference need is handled.", "Include the order or tracking reference they asked about.", "Add the tracking reference", "Include the order or tracking reference.", "Your tracking reference is included below."),
        c("delivery_resolution", "Resolution path", "high", true, x => x.has(["replacement","refund","resend","re-send","reship","collect","return label","redeliver","re-deliver","investigate","claim with the courier","reorder","credit","send a new"]),
          "A fix or next route is offered.", "Offer the fix: replacement, refund, redelivery, or an investigation.", "Offer the fix", "Say what you will do: replace, refund, redeliver, or investigate.", "I will arrange a replacement now and confirm the dispatch details."),
        c("delivery_promise", "Promise control", "high", true, x => !x.has(["guaranteed","guarantee","definitely arrive","100%","will definitely","hopefully","probably"]),
          "No delivery overpromise found.", "Avoid definite delivery promises the courier controls.", "Control the promise", "Avoid firm delivery promises until the courier confirms.", "I will confirm with the courier first, then give you a firm date.")
      ]
    },
    {
      id: "complaint", label: "Complaint", queryIds: ["complaint"], packTypes: ["complaint"],
      summary: "Acknowledgement, ownership, route, timeframe, reference, no defensive wording.",
      checks: [
        c("complaint_ack", "Acknowledgement", "high", true, x => x.reply.empathy || x.has(["sorry","apolog","understand","frustrat","hear you","appreciate","i can see why"]),
          "The concern is acknowledged.", "Start by acknowledging what went wrong before explaining.", "Acknowledge first", "Open with acknowledgement, not process.", "I am sorry this happened, and I understand why you are frustrated."),
        c("complaint_owner", "Ownership", "high", true, x => x.reply.ownership || x.has(["personally","i have taken","i'll take","i will take","i own"]),
          "A person owns the next step.", "Say who owns this from here.", "Take ownership", "Make it clear a person owns this from here.", "I will personally take this on and see it through."),
        c("complaint_route", "Route / action", "high", true, x => x.has(["escalat","review","investigat","senior","manager","team leader","look into","looking into","raise","formal","pass this"]),
          "The route is clear.", "Say what happens next: review, investigation, or escalation.", "State the route", "Say what will be reviewed or who it goes to.", "I have escalated this to a senior colleague for review."),
        c("complaint_time", "Timeframe", "high", true, x => x.reply.timeline || x.rx(TIME_RX) || x.has(["working days","business days"]),
          "A timeframe is given.", "Give a date or window for the next contact.", "Add a timeframe", "Give a concrete date or window.", "You will hear back from me by end of day Thursday."),
        c("complaint_ref", "Complaint reference", "medium", "ifAsked", x => !x.askedRef || REF_RX.test(x.draft),
          "Reference need is handled.", "Include the case or complaint reference.", "Add the case reference", "Include the case or complaint reference.", "Your case reference is included below."),
        c("complaint_tone", "Neutral tone", "high", true, x => x.reply.defensive.length === 0 && x.reply.overpromise.length === 0,
          "No defensive or over-promising wording.", "Remove defensive or over-promising wording.", "Remove friction", "Replace defensive wording with accountable language.", "I will focus on getting you a clear answer.")
      ]
    },
    {
      id: "status_chase", label: "Status update", queryIds: ["status"], packTypes: [],
      summary: "Current status, reason for delay, next update time, owner, no vague timing.",
      checks: [
        c("status_now", "Current status", "high", true, x => x.has(["currently","at the moment","so far","still","in progress","working on","looking into","checking","chasing","with the team","waiting on","awaiting","pending","we've","i've","i have","has been","is being"]),
          "Current status is stated.", "Say where things stand right now.", "State where it stands", "Open with the current status.", "Right now this is with the team and is being reviewed."),
        c("status_reason", "Reason or blocker", "medium", true, x => x.has(["because","waiting","due to","awaiting","need","pending","depends","once"]),
          "The reason for the wait is clear.", "Explain what is causing the wait.", "Explain the wait", "Say what you are waiting on.", "I am waiting on the final confirmation before this can move."),
        c("status_next", "Next update", "high", true, x => x.reply.timeline || x.rx(TIME_RX),
          "A next update point is given.", "Give a specific time for the next update.", "Set the next update", "Give a concrete time for the next update.", "I will update you by end of day tomorrow."),
        c("status_owner", "Owner", "medium", true, x => x.reply.ownership,
          "Owner is visible.", "Say who is on it.", "Add ownership", "Say who is on it.", "I am chasing this myself and will confirm what I hear."),
        c("status_vague", "No vague timing", "medium", true, x => x.reply.vagueTimeline.length === 0,
          "Timing is specific.", "Replace 'soon' or 'shortly' with a time.", "Replace vague timing", "Swap 'soon' for a real time.", "I will update you by 4pm today.")
      ]
    },
    {
      id: "access", label: "Account access", queryIds: ["access"], packTypes: ["access"],
      summary: "Safe action, no secrets requested, clear steps, expiry, fallback route.",
      checks: [
        c("access_secrets", "Never ask for secrets", "high", true, x => !/\b(send|tell|give|share|reply with|email)\b[^.?!]{0,30}\b(your )?(password|pin|cvv|full card number|security code)\b/i.test(x.draft),
          "No secrets requested.", "Never ask the customer to send a password, PIN, or full card number.", "Don't ask for secrets", "Never ask for passwords, PINs or full card numbers.", "For your security, please don't send your password. I'll send a reset link instead."),
        c("access_action", "Safe action", "high", true, x => x.has(["reset","link","code","verify","verification","sign in","log in","login","recovery","update your","change your","unlock"]),
          "A safe action is offered.", "Offer a safe route: reset link, verification code, or recovery step.", "Offer a safe route", "Give a reset link, code, or recovery step.", "I have sent a reset link to the email on the account."),
        c("access_steps", "Clear steps", "medium", true, x => x.has(["first","then","next","step","click","select","tap","go to","open"]) || /(^|\n)\s*\d+[.)]/.test(x.draft),
          "Steps are ordered.", "Give the steps in order: first, then, next.", "Give ordered steps", "Number or sequence the steps.", "First open the email, then select the link and choose a new password."),
        c("access_expiry", "Timing / expiry", "low", false, x => x.has(["expires","valid for","minutes","hours","within"]),
          "Timing is stated.", "Say how long the link or code lasts.", "Say how long it lasts", "State the link or code expiry.", "The link is valid for 30 minutes."),
        c("access_fallback", "Fallback route", "medium", true, x => x.has(["if that doesn't","if that does not","still can't","still cannot","contact","call","another way","alternative","support"]),
          "A fallback is offered.", "Say what to do if it still does not work.", "Offer a fallback", "Say what to do if it still fails.", "If that does not work, reply here and I will verify you another way.")
      ]
    },
    {
      id: "technical_fault", label: "Technical fault", queryIds: ["technical_fault"], packTypes: ["technical_fault"],
      summary: "Acknowledged failure, steps to try, information request, escalation or next update.",
      checks: [
        c("tech_ack", "Acknowledge the fault", "medium", true, x => x.reply.empathy || x.has(["sorry","see the error","not expected","shouldn't","should not","that isn't right","issue"]),
          "The fault is acknowledged.", "Acknowledge that something is not working.", "Acknowledge the fault", "Confirm you understand what is failing.", "Sorry about that, that is not how it should behave."),
        c("tech_steps", "Steps to try", "high", true, x => x.has(["try","restart","clear","update","reinstall","reset","check","switch","reboot","log out","refresh","download"]),
          "Steps to try are given.", "Give one or two concrete steps to try.", "Give steps to try", "List one or two concrete things to try.", "Please try restarting the app, then check whether the error returns."),
        c("tech_info", "Information request", "medium", true, x => x.has(["device","version","browser","screenshot","error message","which","when did","steps to reproduce","send me","let me know what"]),
          "Missing information is requested.", "Ask for what you need: device, version, error text, or a screenshot.", "Ask for details", "Ask for device, version, or error text.", "Could you send a screenshot and tell me which device you are on?"),
        c("tech_next", "Escalation / next update", "medium", true, x => x.has(["escalat","engineering","technical team","investigat","update you","log this","raise","ticket"]) || x.reply.timeline,
          "Next step is clear.", "Say what happens if the steps do not work.", "State what happens next", "Say who investigates if the steps fail.", "If that does not fix it, I will raise it with our technical team."),
        c("tech_workaround", "Workaround", "low", false, x => x.has(["in the meantime","workaround","for now","temporary","alternatively"]),
          "A workaround is offered.", "Offer a workaround if there is one.", "Offer a workaround", "Give a temporary way to keep going.", "In the meantime, you can use the web version.")
      ]
    },
    {
      id: "coverage_eligibility", label: "Cover / eligibility", queryIds: ["coverage_eligibility"], packTypes: ["coverage_eligibility"],
      summary: "Clear yes/no, reason, next step, conditions, no over-promising.",
      checks: [
        c("cover_answer", "Clear answer", "high", true, x => x.has(["yes","no,","covered","not covered","eligible","not eligible","approved","declined","you can","you cannot","can't","unable","is included","isn't included","is excluded","is not included"]),
          "The answer is explicit.", "Lead with a clear yes or no.", "Lead with the answer", "Give the yes/no answer first.", "Yes, this is covered under your policy."),
        c("cover_reason", "Reason", "high", true, x => x.has(["because","under","terms","policy","section","clause","excluded","included","based on","due to","as your"]),
          "The basis is stated.", "Say why: the term, clause, or rule behind the answer.", "Explain the basis", "Say which term or rule the answer rests on.", "This is because your policy includes accidental damage."),
        c("cover_next", "Next step", "high", true, x => x.reply.nextStep,
          "A next step is given.", "Say what the customer should do next.", "Add the next step", "Tell them what to do next.", "The next step is to send me the claim form."),
        c("cover_conditions", "Conditions", "low", false, x => x.has(["if ","provided","subject to","as long as","unless","depending","excess"]),
          "Conditions are stated.", "Mention any conditions or excess that apply.", "State the conditions", "Mention conditions or excess.", "This is subject to the excess shown on your policy."),
        c("cover_ref", "Policy or claim reference", "medium", "ifAsked", x => !x.askedRef || REF_RX.test(x.draft),
          "Reference need is handled.", "Include the policy or claim reference.", "Add the reference", "Include the policy or claim reference.", "Your claim reference is included below."),
        c("cover_promise", "Promise control", "high", true, x => x.reply.overpromise.length === 0 && !x.has(["will definitely be covered","will be covered for sure"]),
          "No cover overpromise found.", "Avoid promising cover before it is confirmed.", "Control the promise", "Avoid promising cover before it is confirmed.", "I will confirm cover once the claim is assessed.")
      ]
    },
    {
      id: "clarification", label: "Explanation", queryIds: ["clarification"], packTypes: [],
      summary: "Plain sentences, an example, a check for understanding, no jargon.",
      checks: [
        c("clar_plain", "Short sentences", "medium", true, x => x.reply.avg <= 18,
          "Sentences are short.", "Split long sentences: one idea each.", "Shorten sentences", "One idea per sentence.", "Let me put that simply: one step at a time."),
        c("clar_jargon", "Plain words", "medium", true, x => x.reply.jargon.length === 0,
          "No jargon found.", "Swap internal or technical terms for everyday words.", "Use plain words", "Swap jargon for everyday words.", "In plain terms, that means..."),
        c("clar_example", "Example", "low", false, x => x.has(["for example","for instance","e.g","such as","imagine","like this"]),
          "An example is included.", "Add a short example.", "Add an example", "An example makes it stick.", "For example, if you book on Monday, you will be charged on Friday."),
        c("clar_check", "Check understanding", "medium", true, x => x.has(["does that make sense","is that clearer","let me know if","happy to explain","if anything is unclear","does this help","any questions"]),
          "Understanding is checked.", "Finish by checking they understood.", "Check understanding", "Invite a follow-up question.", "Does that make sense? I am happy to explain it another way.")
      ]
    }
  ];

  /* adaptive add-ons: extra checks that switch on from how the customer sounds (any pack) */
  const ADDONS = [
    {
      when: ctx => ctx.signals.rows.some(s => s.id === "vulnerability"),
      check: c("care_route", "Care and support route", "high", true, x => x.has(["take your time","no rush","no hurry","here to help","support","call","speak to","someone","by phone","another way"]),
        "A supportive route is offered.", "Slow down and offer support or another way to get help.", "Offer support", "Slow down and offer another way to get help.", "There is no rush, and I can also call you if that is easier.")
    },
    {
      when: ctx => ctx.signals.rows.some(s => s.id === "urgency"),
      check: c("urgency_timing", "Answers the urgency", "high", true, x => x.reply.timeline || x.rx(TIME_RX),
        "Timing answers the urgency.", "The customer is time-pressed. Give a concrete time.", "Answer the urgency", "Give a concrete time.", "I will come back to you within the hour.")
    },
    {
      when: ctx => ctx.signals.rows.some(s => s.id === "confusion"),
      check: c("confusion_plain", "Plain steps", "medium", true, x => x.reply.avg <= 20 && x.reply.jargon.length === 0,
        "Wording is plain.", "The customer sounds confused. Use short sentences and plain words.", "Make it plainer", "Use short sentences and plain words.", "Let me explain that step by step.")
    }
  ];

  window.MF_PING_PACKS = PACKS;
  window.MF_PING_ADDONS = ADDONS;
  window.MF_PING_PACK_HELPERS = { has, REF_RX, TIME_RX };
})();
