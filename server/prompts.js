// =============================================================
//  PROMPT BANK  -  The Friendship Ending Game
//  100+ original prompts, all safe-for-general-audiences.
//  Humor comes from player answers, not cruelty.
//
//  Three prompt families map to the three round kinds:
//    - TARGETED  : answered ABOUT another player ({TARGET} token)
//    - MIXED     : a single open answer, one prompt per player
//    - MADLIBS   : "wholesome" setup w/ blanks, twisted on reveal
// =============================================================

// ----- ROUND KIND 1: TARGETED CHAOS -------------------------
// {TARGET} is replaced on each player's phone with their target's name.
export const TARGETED_PROMPTS = [
  { id: "t1",  category: "chaotic",  text: "The weirdest thing {TARGET} definitely does when nobody is watching is…" },
  { id: "t2",  category: "chaotic",  text: "{TARGET} would absolutely get cancelled for…" },
  { id: "t3",  category: "absurd",   text: "If {TARGET} had a secret alter ego, it would be…" },
  { id: "t4",  category: "funny",    text: "The app on {TARGET}'s phone with way too much screen time is…" },
  { id: "t5",  category: "awkward",  text: "{TARGET}'s most unhinged group-chat message would say…" },
  { id: "t6",  category: "funny",    text: "If {TARGET} wrote a self-help book, the title would be…" },
  { id: "t7",  category: "chaotic",  text: "{TARGET} would survive exactly 12 minutes in the apocalypse because…" },
  { id: "t8",  category: "absurd",   text: "The crime {TARGET} would commit (and somehow get away with) is…" },
  { id: "t9",  category: "funny",    text: "{TARGET}'s search history is 90%…" },
  { id: "t10", category: "awkward",  text: "The thing {TARGET} pretends to understand but absolutely does not is…" },
  { id: "t11", category: "funny",    text: "If {TARGET} were a warning label, it would read…" },
  { id: "t12", category: "chaotic",  text: "{TARGET}'s villain origin story starts the day they…" },
  { id: "t13", category: "absurd",   text: "{TARGET}'s spirit animal is secretly a…" },
  { id: "t14", category: "funny",    text: "The reality TV show {TARGET} would get kicked off first is…" },
  { id: "t15", category: "awkward",  text: "{TARGET}'s most-used emoji that says way too much is…" },
  { id: "t16", category: "funny",    text: "If {TARGET} got a tattoo at 3am, it would be of…" },
  { id: "t17", category: "chaotic",  text: "{TARGET} would start a cult based entirely around…" },
  { id: "t18", category: "absurd",   text: "In a past life, {TARGET} was definitely a…" },
  { id: "t19", category: "funny",    text: "{TARGET}'s toxic trait that they think is a personality is…" },
  { id: "t20", category: "awkward",  text: "The lie {TARGET} tells on every first date is…" },
  { id: "t21", category: "funny",    text: "{TARGET}'s autobiography would be titled…" },
  { id: "t22", category: "chaotic",  text: "{TARGET} would get banned from a country for…" },
  { id: "t23", category: "absurd",   text: "If {TARGET} were a kitchen appliance, they'd be the kind that…" },
  { id: "t24", category: "funny",    text: "The hill {TARGET} would die on is…" },
  { id: "t25", category: "awkward",  text: "{TARGET}'s biggest red flag, disguised as a green flag, is…" },
  { id: "t26", category: "funny",    text: "{TARGET}'s LinkedIn says one thing, but their real job title should be…" },
  { id: "t27", category: "chaotic",  text: "Give {TARGET} unlimited power for one day and they would immediately…" },
  { id: "t28", category: "absurd",   text: "{TARGET}'s ghost would haunt people by…" },

  // ----- added: chaotic / playful -----
  { id: "n1",  category: "awkward",  text: "What was {TARGET}'s most embarrassing childhood nickname?" },
  { id: "n2",  category: "absurd",   text: "If {TARGET} could time travel, where would they go and why?" },
  { id: "n3",  category: "chaotic",  text: "Which evil villain does {TARGET} remind you of?" },
  { id: "n4",  category: "awkward",  text: "What is {TARGET} most ashamed about?" },
  { id: "n5",  category: "awkward",  text: "What is {TARGET}'s greatest fear?" },
  { id: "n6",  category: "funny",    text: "What was {TARGET}'s first word?" },
  { id: "n7",  category: "funny",    text: "How old does {TARGET} actually look?" },
  { id: "n8",  category: "funny",    text: "What is {TARGET}'s hidden talent?" },
  { id: "n9",  category: "awkward",  text: "What was {TARGET}'s embarrassing old online username?" },
  { id: "n10", category: "absurd",   text: "What did {TARGET} dream about last night?" },
  { id: "n11", category: "absurd",   text: "If {TARGET} were a kind of weather, what would they be?" },
  { id: "n12", category: "funny",    text: "What is {TARGET} terrible at?" },
  { id: "n13", category: "funny",    text: "In one word, describe the way {TARGET} hugs." },
  { id: "n14", category: "funny",    text: "If {TARGET} made the front page of a newspaper, what would the headline be?" },
  { id: "n15", category: "awkward",  text: "If you could change one thing about {TARGET}, what would it be?" },
  { id: "n16", category: "awkward",  text: "What is {TARGET}'s most questionable fashion choice?" },
  { id: "n17", category: "chaotic",  text: "What's the weirdest thing {TARGET} has ever googled?" },
  { id: "n18", category: "funny",    text: "What fictional character is {TARGET} secretly in love with?" },
  { id: "n20", category: "chaotic",  text: "What would {TARGET}'s exes say about them behind their back?" },
  { id: "n22", category: "absurd",   text: "What is {TARGET}'s most delusional belief?" },
  { id: "n24", category: "absurd",   text: "What smell best describes {TARGET}'s personality?" },
  { id: "n25", category: "chaotic",  text: "What's the pettiest thing {TARGET} has ever done?" },

  // ----- added: mean / savage / friendship-ending -----
  { id: "n26", category: "savage",   text: "What will be written on {TARGET}'s tombstone?" },
  { id: "n27", category: "savage",   text: "What's the most pathetic lie {TARGET} tells themselves daily?" },
  { id: "n28", category: "savage",   text: "Which friend does {TARGET} secretly hate the most?" },
  { id: "n29", category: "savage",   text: "What's the saddest thing in {TARGET}'s search history?" },
  { id: "n30", category: "savage",   text: "What was {TARGET}'s most desperate attempt at seeming cool that failed?" },
  { id: "n31", category: "savage",   text: "What's the one thing everyone in the group finds annoying about {TARGET}?" },
  { id: "n32", category: "savage",   text: "What is {TARGET}'s most cringe romantic failure?" },
  { id: "n33", category: "savage",   text: "How would {TARGET}'s funeral attendance actually look?" },
  { id: "n34", category: "savage",   text: "What's the most selfish thing {TARGET} has ever done?" },
  { id: "n35", category: "savage",   text: "What trait makes people instantly regret becoming friends with {TARGET}?" },
  { id: "n36", category: "savage",   text: "What's {TARGET}'s most disgusting habit that they think is normal?" },
  { id: "n37", category: "savage",   text: "Who in this room talks shit about {TARGET} the most?" },
  { id: "n38", category: "savage",   text: "What's something {TARGET} is way too old to still be doing?" },
  { id: "n39", category: "savage",   text: "What's {TARGET}'s most delusional opinion about their own looks?" },
  { id: "n40", category: "savage",   text: "What would {TARGET}'s dating profile say if it were brutally honest?" },
  { id: "n41", category: "savage",   text: "What's the main reason {TARGET} will die alone?" },
  { id: "n42", category: "savage",   text: "What is {TARGET}'s most embarrassing financial situation?" },
  { id: "n43", category: "savage",   text: "What childhood trauma is {TARGET} clearly not over?" },
  { id: "n44", category: "savage",   text: "What's something {TARGET} does that makes people lose respect for them?" },
  { id: "n45", category: "savage",   text: "How would {TARGET}'s life be described in a brutal roast?" },
  { id: "n46", category: "savage",   text: "What is {TARGET}'s most fake personality trait?" },
  { id: "n47", category: "savage",   text: "What's the one secret that would make everyone leave {TARGET}?" },
  { id: "n48", category: "savage",   text: "What's {TARGET}'s most pathetic attempt at being funny?" },
  { id: "n49", category: "savage",   text: "What's the ugliest part of {TARGET}'s personality?" },
  { id: "n50", category: "savage",   text: "What would {TARGET}'s own mother say is their biggest disappointment?" },
];

// ----- ROUND KIND 2: MIXED PROMPT CHAOS ---------------------
// Open prompts. Each player gets a different one from this deck.
export const MIXED_PROMPTS = [
  { id: "m1",  category: "funny",   text: "A terrible name for a perfume." },
  { id: "m2",  category: "absurd",  text: "An Olympic event that would be way more fun to watch." },
  { id: "m3",  category: "chaotic", text: "The worst possible thing to yell during a moment of silence." },
  { id: "m4",  category: "funny",   text: "A rejected slogan for a fast food chain." },
  { id: "m5",  category: "awkward", text: "Something you should never say to your boss, but kind of want to." },
  { id: "m6",  category: "absurd",  text: "A superpower that is technically useless." },
  { id: "m7",  category: "funny",   text: "The real reason aliens haven't visited Earth yet." },
  { id: "m8",  category: "chaotic", text: "A new law that would instantly ruin society." },
  { id: "m9",  category: "funny",   text: "The worst possible thing to find in your hotel room." },
  { id: "m10", category: "absurd",  text: "A holiday that absolutely should not exist." },
  { id: "m11", category: "awkward", text: "Something you'd hate to hear your doctor say mid-surgery." },
  { id: "m12", category: "funny",   text: "A terrible theme for a child's birthday party." },
  { id: "m13", category: "chaotic", text: "The fastest way to get kicked out of a wedding." },
  { id: "m14", category: "funny",   text: "A confusing thing to whisper to a stranger in an elevator." },
  { id: "m15", category: "absurd",  text: "An invention the world is absolutely not ready for." },
  { id: "m16", category: "funny",   text: "The worst possible name for a boat." },
  { id: "m17", category: "awkward", text: "Something that should never be made 'family sized.'" },
  { id: "m18", category: "chaotic", text: "A bad excuse for being two hours late." },
  { id: "m19", category: "funny",   text: "A new flavor of ice cream that nobody asked for." },
  { id: "m20", category: "absurd",  text: "What a dog is REALLY thinking when it stares at you." },
  { id: "m21", category: "funny",   text: "The worst possible fortune to find in a fortune cookie." },
  { id: "m22", category: "awkward", text: "A really bad time to start laughing." },
  { id: "m23", category: "chaotic", text: "The most chaotic thing to do with a million dollars in one hour." },
  { id: "m24", category: "funny",   text: "A terrible name for a boy band." },
  { id: "m25", category: "absurd",  text: "An animal that would absolutely run a successful business." },
  { id: "m26", category: "funny",   text: "The worst possible thing to be 'world-famous' for." },
  { id: "m27", category: "awkward", text: "Something you should never microwave at work." },
  { id: "m28", category: "chaotic", text: "A great way to immediately end a friendship." },
  { id: "m29", category: "funny",   text: "The most cursed pizza topping combination." },
  { id: "m30", category: "absurd",  text: "A sport that would be improved by adding a single goat." },
  { id: "m31", category: "funny",   text: "A rejected name for a brand new color." },
  { id: "m32", category: "awkward", text: "The worst thing to say right after 'I love you.'" },
  { id: "m33", category: "chaotic", text: "What you would put on a billboard if you had zero rules." },
  { id: "m34", category: "funny",   text: "A terrible motivational poster slogan." },
  { id: "m35", category: "absurd",  text: "The true purpose of that one drawer everyone has." },
  { id: "m36", category: "funny",   text: "The worst possible mascot for a hospital." },
  { id: "m37", category: "awkward", text: "Something you'd be embarrassed to be caught singing." },
  { id: "m38", category: "chaotic", text: "A bold new feature for phones that would end civilization." },
  { id: "m39", category: "funny",   text: "A really bad name for a wifi network." },
  { id: "m40", category: "absurd",  text: "What ghosts complain about in the afterlife." },
  { id: "m41", category: "funny",   text: "The worst possible thing to gift your in-laws." },
  { id: "m42", category: "awkward", text: "A thought you've definitely had during a meeting." },
  { id: "m43", category: "chaotic", text: "The most unhinged thing to put in a wedding speech." },
  { id: "m44", category: "funny",   text: "A terrible name for a cologne aimed at grandpas." },
  { id: "m45", category: "absurd",  text: "An everyday object that is secretly plotting against you." },
  { id: "m46", category: "funny",   text: "The worst advice to give someone on their first day of a new job." },
  { id: "m47", category: "awkward", text: "Something you'd panic-buy at 11:58pm." },
  { id: "m48", category: "chaotic", text: "A new Olympic sport for people who are extremely lazy." },
  { id: "m49", category: "funny",   text: "The worst possible thing for a GPS to say." },
  { id: "m50", category: "absurd",  text: "What your pet would say in a one-star review of you." },
  { id: "m51", category: "funny",   text: "A terrible icebreaker question for a job interview." },
  { id: "m52", category: "awkward", text: "The worst possible thing to overhear about yourself." },
  { id: "m53", category: "chaotic", text: "A new rule that would make grocery shopping pure chaos." },
  { id: "m54", category: "funny",   text: "The most disappointing thing to find at the bottom of a cereal box." },
  { id: "m55", category: "absurd",  text: "A conspiracy theory that is somehow extremely boring." },
  { id: "m56", category: "funny",   text: "The worst possible name for a haunted house attraction." },
  { id: "m57", category: "awkward", text: "Something you should never say while meeting a baby." },
  { id: "m58", category: "chaotic", text: "The fastest way to start drama at a family dinner." },
  { id: "m59", category: "funny",   text: "A terrible thing to put on a tombstone." },
  { id: "m60", category: "absurd",  text: "An app idea so bad it might actually be genius." },
  { id: "m61", category: "funny",   text: "The worst possible thing to be allergic to." },
  { id: "m62", category: "awkward", text: "A text you definitely should not send at 2am." },
  { id: "m63", category: "chaotic", text: "The most ridiculous reason to call in sick to work." },
  { id: "m64", category: "funny",   text: "A rejected Scout badge nobody earned for a good reason." },
  { id: "m65", category: "absurd",  text: "What clouds would say if they could talk." },
];

// ----- ROUND KIND 3: THE FRIENDSHIP TEST (MAD LIBS TWIST) ---
// setup  : the wholesome framing shown WHILE answering
// blanks : labels for each input (player fills these in)
// twist  : reveal template; {0},{1}... inject the answers in a
//          chaotic / darkly-comedic recontextualization.
export const MADLIBS_PROMPTS = [
  {
    id: "ml1",
    category: "wholesome",
    setup: "Let's say something sweet about your friend. They are happiest when ____, and they feel most proud when ____.",
    blanks: ["happiest when…", "most proud when…"],
    twist: "BREAKING NEWS: A local resident was last seen happiest when {0}. Witnesses report they seemed most proud when {1}. Police are baffled.",
  },
  {
    id: "ml2",
    category: "wholesome",
    setup: "Describe your friend's perfect cozy weekend. They love to spend the morning ____ and end the night ____.",
    blanks: ["spend the morning…", "end the night…"],
    twist: "The cult's daily schedule was simple: members spend the morning {0}, then end the night {1}. Recruitment is now open.",
  },
  {
    id: "ml3",
    category: "wholesome",
    setup: "Write a kind note for your friend's birthday card. We all admire how you always ____ and never ____.",
    blanks: ["always…", "never…"],
    twist: "The jury found the defendant guilty. They always {0}, and the court noted they would never {1}. Sentencing is pending.",
  },
  {
    id: "ml4",
    category: "wholesome",
    setup: "Tell us about your friend's dream home. It would have a room just for ____ and a backyard perfect for ____.",
    blanks: ["a room just for…", "a backyard perfect for…"],
    twist: "Inspectors discovered the bunker had a room just for {0}, and a backyard perfect for {1}. Authorities are 'concerned.'",
  },
  {
    id: "ml5",
    category: "wholesome",
    setup: "What makes your friend a great roommate? They're always the first to ____ and they really helped me ____.",
    blanks: ["first to…", "helped me…"],
    twist: "In the breakup text, they wrote: 'You were always the first to {0}. Honestly, you helped me {1}. We're done.'",
  },
  {
    id: "ml6",
    category: "wholesome",
    setup: "Describe your friend's hidden talent. They're surprisingly good at ____ and they do it while ____.",
    blanks: ["surprisingly good at…", "while…"],
    twist: "The wanted poster reads: 'Suspect is surprisingly good at {0}, often seen doing it while {1}. Approach with caution.'",
  },
  {
    id: "ml7",
    category: "wholesome",
    setup: "Toast to your friend! Here's to someone who always brings ____ to the party and leaves everyone feeling ____.",
    blanks: ["always brings…", "leaves everyone feeling…"],
    twist: "The health inspector's report: 'The establishment always brings {0} to the table, leaving every customer feeling {1}.' Closed indefinitely.",
  },
  {
    id: "ml8",
    category: "wholesome",
    setup: "What's your friend like on vacation? They can't wait to try ____ and they always pack way too much ____.",
    blanks: ["can't wait to try…", "way too much…"],
    twist: "The customs agent paused. 'So you couldn't wait to try {0}, and you've packed way too much {1}?' Step into the side room, please.",
  },
  {
    id: "ml9",
    category: "wholesome",
    setup: "Describe your friend's morning routine. They start every day with ____ and a little bit of ____.",
    blanks: ["start every day with…", "a little bit of…"],
    twist: "The ghost's unfinished business: every night it returns to start the day with {0}, and a little bit of {1}. It cannot move on.",
  },
  {
    id: "ml10",
    category: "wholesome",
    setup: "What's your friend's love language? They show they care by ____ and they feel loved when someone ____.",
    blanks: ["they show they care by…", "they feel loved when…"],
    twist: "The supervillain's manifesto: 'I show the world I care by {0}. I will only feel truly loved when humanity {1}.'",
  },
  {
    id: "ml11",
    category: "wholesome",
    setup: "Brag about your friend's career. They worked so hard to become a ____ and everyone says they're amazing at ____.",
    blanks: ["worked hard to become a…", "amazing at…"],
    twist: "The tabloid headline screamed: 'Disgraced ex-{0} EXPOSED — sources confirm they were always amazing at {1}.' More at 11.",
  },
  {
    id: "ml12",
    category: "wholesome",
    setup: "What would your friend do with a free Saturday? They'd probably spend it ____ and finish by ____.",
    blanks: ["spend it…", "finish by…"],
    twist: "The detective read the diary aloud: 'Spent the day {0}. Finished the night by {1}.' The room went silent.",
  },
];

export const ROUND_KINDS = ["targeted", "mixed", "madlibs"];

// A fresh, shuffled "deck" the room draws from so prompts don't repeat.
export function makeDeck(arr) {
  const d = [...arr];
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}
