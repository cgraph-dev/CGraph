/**
 * CGraph Lore - The Decentralized Awakening
 *
 * This file contains the narrative framework for CGraph's world-building.
 * The lore creates an immersive backstory that ties into the platform's
 * core values of privacy, decentralization, and user empowerment.
 *
 * Players unlock lore fragments through achievements and progression,
 * revealing the story of how CGraph came to be and the ongoing struggle
 * for digital freedom in a surveilled world.
 */

export interface LoreChapter {
  id: string;
  chapter: number;
  title: string;
  teaser: string;
  entries: LoreFragment[];
}

export interface LoreFragment {
  id: string;
  title: string;
  content: string;
  unlockRequirement: {
    type: 'achievement' | 'level' | 'quest' | 'manual';
    value: string | number;
  };
  nextFragments: string[];
}

/**
 * The lore is structured as a branching narrative tree.
 * Users can unlock different branches based on their actions,
 * creating a personalized story experience.
 */
export const LORE_CHAPTERS: LoreChapter[] = [
  {
    id: 'chapter_1',
    chapter: 1,
    title: 'The Surveillance Age',
    teaser: 'In a world where every message is monitored, every conversation recorded...',
    entries: [
      {
        id: 'lore_1_1',
        title: 'Datastream Chronicles - Entry 001',
        content: `Year 2024. The digital landscape had become a panopticon. Every click tracked, every message logged, every thought cataloged. The great tech conglomerates had woven a web so intricate that privacy had become a myth, a bedtime story told to children who would never know its warmth.

The corporations called it "personalization." The governments named it "security." But those who remembered the old internet, the free internet, knew it for what it truly was: control.

In the depths of the encrypted networks, whispers began to spread. Whispers of a new architecture, a new way to communicate. Not a platform owned by the few, but a protocol embraced by the many. They called it the Graph - a decentralized web of connections where privacy wasn't a premium feature, but a fundamental right.

This is where your journey begins.`,
        unlockRequirement: { type: 'manual', value: 'starter' },
        nextFragments: ['lore_1_2'],
      },
      {
        id: 'lore_1_2',
        title: 'The First Nodes',
        content: `The founders of CGraph were not corporate executives or venture capitalists. They were cryptographers who had watched their life's work twisted into surveillance tools. Developers who had built platforms only to see them sold to the highest bidder. Users who had watched their digital autonomy evaporate like morning mist.

They coded in secret, in basements and coffee shops, using old laptops and borrowed servers. The first protocol was crude, fragile even. Messages took seconds to encrypt, minutes to route. But they were private. Truly, mathematically, provably private.

The first hundred users were paranoid researchers, activists in authoritarian regimes, journalists documenting corruption. They understood the stakes. They knew that every message sent over CGraph was an act of digital rebellion, a declaration that their thoughts belonged to them and them alone.

You are among the early adopters. Every connection you make strengthens the network. Every encrypted message you send chips away at the surveillance state's foundation.`,
        unlockRequirement: { type: 'achievement', value: 'first_message' },
        nextFragments: ['lore_1_3', 'lore_1_4_branch'],
      },
      {
        id: 'lore_1_3',
        title: 'The Corporate Response',
        content: `It didn't take long for them to notice. The analytics showed users vanishing from their platforms, conversations moving to networks their algorithms couldn't penetrate. The ad revenue projections faltered. The surveillance reports came back empty.

At first, they dismissed it as a niche phenomenon, a toy for conspiracy theorists and tech hobbyists. But as the months passed and CGraph's user base grew exponentially, the tone changed. Press releases painted encryption as a tool for criminals. Lobbyists whispered in congressional ears about national security. Tech blogs suddenly ran coordinated campaigns questioning CGraph's stability, its funding, its motives.

But the Graph was designed for this. Decentralized architecture meant there was no company to sue, no CEO to pressure, no server farm to shut down. Like water flowing around a stone, the network simply routed around their attacks, growing stronger with each attempt to contain it.

The corporations learned a hard lesson: you cannot control what you cannot see, and you cannot see what is truly encrypted.`,
        unlockRequirement: { type: 'achievement', value: 'networking_novice' },
        nextFragments: ['lore_2_1'],
      },
      {
        id: 'lore_1_4_branch',
        title: 'The Community Awakens',
        content: `As the network grew, something unexpected happened. It wasn't just about privacy anymore. Users began building communities, creating forums for discussion, organizing groups around shared interests. But unlike the corporate platforms, these spaces belonged to their users.

Moderation was decentralized. Instead of faceless algorithms and underpaid contractors enforcing arbitrary rules, communities governed themselves using transparent voting systems and reputation mechanics. Toxic actors were isolated not by shadowbans, but by the collective action of those they harmed.

Forums emerged for every topic imaginable. Philosophy discussions ran alongside meme boards. Code review channels shared space with creative writing workshops. And because there was no algorithm optimizing for engagement at any cost, the discourse remained surprisingly civil. People came to talk, not to fight.

You watch as these digital towns spring up around you, each one a testament to what the internet could have been. What it still might become.`,
        unlockRequirement: { type: 'achievement', value: 'community_builder' },
        nextFragments: ['lore_2_2_branch'],
      },
    ],
  },
  {
    id: 'chapter_2',
    chapter: 2,
    title: 'The Network Effect',
    teaser: 'As CGraph grew, it attracted both allies and adversaries...',
    entries: [
      {
        id: 'lore_2_1',
        title: 'Going Viral',
        content: `The turning point came unexpectedly. A whistleblower used CGraph to leak evidence of systematic corruption, the kind that would have been traced and suppressed on any other platform. The story exploded. Journalists around the world joined the network to protect their sources. Activists coordinated protests without fear of surveillance. Lawyers shared sensitive case files with their clients.

Within weeks, CGraph's user count increased tenfold. The servers - run by volunteers in dozens of countries - strained under the load. But the community responded. More nodes came online. Developers optimized the protocol. Users donated bandwidth and processing power.

The network didn't just survive the influx; it thrived on it. Each new user made the network more resilient, more private, more powerful. The corporations' nightmare had come true: their users were leaving, and there was nothing they could do to stop it.

You are part of this exodus, this digital migration to freedom. Every friend you invite weakens the old system. Every group you join strengthens the new one.`,
        unlockRequirement: { type: 'level', value: 10 },
        nextFragments: ['lore_2_3'],
      },
      {
        id: 'lore_2_2_branch',
        title: 'The Great Debates',
        content: `The forums became the heart of CGraph. Unlike the sterile, algorithm-curated feeds of traditional social media, these were spaces of genuine discourse. Threads went deep, sometimes hundreds of comments long, with users actually reading and responding to each other's arguments.

Reputation systems emerged organically. Users who contributed thoughtfully gained influence. Those who trolled or spammed found themselves marginalized, not by moderator fiat, but by the community's collective judgment. It wasn't perfect - no human system ever is - but it was better. So much better.

Academic papers were written about the phenomenon. Sociologists studied how decentralized moderation produced more civil discourse than corporate platforms with billions in trust and safety spending. Economists marveled at reputation markets that emerged without any financial backing.

In these digital agoras, you find something you thought the internet had lost forever: genuine community. People who remember your username, who build on your ideas, who challenge you to think deeper. This is what connection is supposed to feel like.`,
        unlockRequirement: { type: 'achievement', value: 'forum_master' },
        nextFragments: ['lore_2_3'],
      },
      {
        id: 'lore_2_3',
        title: 'The Encryption Wars Renewed',
        content: `The governments of the world finally understood what they were facing. CGraph wasn't just a messaging app; it was a parallel communications infrastructure outside their control. Bills were proposed to mandate backdoors. Encryption was labeled a "dual-use technology." Think tanks published papers on the dangers of "going dark."

But the technology was too distributed to ban, too open-source to backdoor, too international to regulate. When one country blocked access to CGraph nodes, ten more appeared in other jurisdictions. When they demanded source code audits, the community laughed and pointed to the GitHub repository that had been public from day one.

The cypherpunks of the 1990s had dreamed of this moment: technology had finally outpaced legislation. The genie was out of the bottle, and no amount of political pressure could put it back.

You stand on the shoulders of giants - mathematicians who proved that perfect secrecy was possible, developers who implemented it elegantly, activists who fought for the right to code. Your encrypted messages are their legacy made manifest.`,
        unlockRequirement: { type: 'level', value: 25 },
        nextFragments: ['lore_3_1'],
      },
    ],
  },
  {
    id: 'chapter_3',
    chapter: 3,
    title: 'The Age of Decentralization',
    teaser: 'CGraph had grown beyond anyone\'s wildest dreams. But challenges remained...',
    entries: [
      {
        id: 'lore_3_1',
        title: 'Scaling the Unscalable',
        content: `By year three, CGraph had millions of active users. The protocol that had been designed for thousands was creaking under the load. Messages sometimes took minutes to arrive. File transfers stalled. The user experience, while private, was starting to fray.

The community rallied. Computer science departments ran research projects on distributed systems optimization. Cryptocurrency projects shared their scaling solutions. Tech companies that had once fought the network now quietly contributed code, recognizing that privacy was a feature users actually wanted.

Layer 2 solutions emerged. Sharding protocols distributed the load. Zero-knowledge proofs allowed verification without revelation. The network adapted, evolved, improved. It was slower than if a single corporation had thrown billions at the problem, but it was also more resilient, more innovative, more aligned with user needs.

You witnessed the transformation firsthand. The occasional lag became smoother. The interface became more polished. The features multiplied. This is what happens when millions of people build something together, for themselves, without shareholders to please or metrics to game.`,
        unlockRequirement: { type: 'level', value: 50 },
        nextFragments: ['lore_3_2'],
      },
      {
        id: 'lore_3_2',
        title: 'The Protocol Wars',
        content: `Success bred competition. Copycat networks emerged, each claiming to be "the real" decentralized platform. Some were genuine attempts to improve on CGraph's design. Others were corporate trojan horses, centralized systems with decentralized marketing.

The community fragmented briefly as users debated the merits of each approach. But something interesting happened: instead of becoming enemies, the legitimate protocols began to interoperate. Messages flowed between networks. Identity verification systems shared standards. The pie was growing faster than anyone could claim exclusive slices.

CGraph's founders had anticipated this. They had designed the protocol to be protocol-agnostic, a meta-framework that could integrate with any system sharing its core values. The network of networks was being born.

You navigate this ecosystem with confidence, knowing that your choice of platform doesn't lock you in, doesn't fence you off from friends using different systems. You are participating in the birth of the open web 3.0 - not the blockchain hype version, but the real thing. Communication infrastructure that belongs to everyone and no one.`,
        unlockRequirement: { type: 'achievement', value: 'protocol_pioneer' },
        nextFragments: ['lore_3_3'],
      },
      {
        id: 'lore_3_3',
        title: 'The Future We Choose',
        content: `Today, you are part of something larger than yourself. Every message you encrypt is a vote for privacy. Every friend you connect with is a node in the resistance against surveillance capitalism. Every forum you contribute to is a brick in the foundation of a better internet.

The corporations still exist, still have billions of users. But they're scared. Their growth has stalled. Their influence is waning. Users have tasted freedom and found it sweet. There is no going back.

CGraph isn't perfect. No human creation ever is. There are still spam problems to solve, moderation challenges to address, accessibility issues to fix. But the difference is that YOU can help solve them. The code is open. The governance is transparent. The community is welcoming to those who wish to build.

This is not the end of the story. It's not even the beginning of the end. It's barely the end of the beginning. The real work - building a digital future worth living in - lies ahead.

And you, Cipher, are invited to help write the next chapter.`,
        unlockRequirement: { type: 'level', value: 100 },
        nextFragments: [],
      },
    ],
  },
];

/**
 * Lore entry unlock conditions mapped to achievements
 * This creates a clear progression path through the narrative
 */
export const LORE_UNLOCK_MAP: Record<string, string[]> = {
  // Starting lore - everyone gets this
  starter: ['lore_1_1'],

  // Social achievements
  first_message: ['lore_1_2'],
  networking_novice: ['lore_1_3'],
  community_builder: ['lore_1_4_branch'],

  // Level milestones
  level_10: ['lore_2_1'],
  level_25: ['lore_2_3'],
  level_50: ['lore_3_1'],
  level_100: ['lore_3_3'],

  // Special achievements
  forum_master: ['lore_2_2_branch'],
  protocol_pioneer: ['lore_3_2'],
};

/**
 * Get lore fragment by ID
 */
export function getLoreFragment(id: string): LoreFragment | null {
  for (const chapter of LORE_CHAPTERS) {
    const entry = chapter.entries.find(e => e.id === id);
    if (entry) return entry;
  }
  return null;
}

/**
 * Get all lore fragments unlocked by a specific achievement
 */
export function getLoreByAchievement(achievementId: string): LoreFragment[] {
  const fragmentIds = LORE_UNLOCK_MAP[achievementId] || [];
  return fragmentIds.map(id => getLoreFragment(id)).filter(Boolean) as LoreFragment[];
}
