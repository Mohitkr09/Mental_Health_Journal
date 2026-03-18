export const chatWithAI = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        reply: "Please share what you're feeling.",
      });
    }

    const msg = message.toLowerCase();

    // 🧠 Mental health knowledge base
    const responses = [
      // 🔥 PRIORITY (exact phrases from UI buttons)
      {
        keywords: ["i'm feeling stressed today", "feeling stressed today"],
        replies: [
          "That sounds like a heavy day. Try taking a short break and breathe slowly.",
          "Stress can build up — pause and give yourself a few calm minutes.",
        ],
      },
      {
        keywords: ["i can't sleep well", "cant sleep well", "not sleeping well"],
        replies: [
          "Try relaxing your mind before bed — avoid screens and take slow breaths.",
          "A calm routine before sleep can really help your mind unwind.",
        ],
      },
      {
        keywords: ["how can i relax", "how to relax"],
        replies: [
          "Try deep breathing, light stretching, or listening to calm music.",
          "Even a few minutes of stillness can help your mind relax.",
        ],
      },
      {
        keywords: ["i feel anxious about work", "anxious about work"],
        replies: [
          "Work anxiety is common — focus on one task at a time.",
          "Take things step by step — you don’t have to handle everything at once.",
        ],
      },

      // 🧠 GENERAL CASES
      {
        keywords: ["anxiety", "panic", "nervous"],
        replies: [
          "It sounds overwhelming. Try slow breathing — inhale 4 sec, hold, exhale slowly.",
          "You're safe right now. Focus on your breath — it can calm your body.",
        ],
      },
      {
        keywords: ["stress", "pressure", "overwhelmed"],
        replies: [
          "You're carrying a lot. Take a short break and handle one thing at a time.",
          "Pause for a moment — you don’t have to solve everything at once.",
        ],
      },
      {
        keywords: ["sad", "depressed", "low"],
        replies: [
          "I'm really sorry you're feeling this way. You're not alone.",
          "It’s okay to feel low sometimes. Even small steps can help.",
        ],
      },
      {
        keywords: ["overthinking"],
        replies: [
          "Overthinking drains you. Try writing your thoughts down.",
          "Bring your focus back to the present moment — one step at a time.",
        ],
      },
      {
        keywords: ["lonely", "alone"],
        replies: [
          "Feeling lonely hurts. Even a small connection can help.",
          "You’re not truly alone — reaching out can make a difference.",
        ],
      },
      {
        keywords: ["sleep", "insomnia"],
        replies: [
          "Try calming your mind before sleep — avoid screens and breathe slowly.",
          "A simple routine before bed can improve your sleep.",
        ],
      },
      {
        keywords: ["anger", "angry"],
        replies: [
          "Pause before reacting. Take a deep breath.",
          "Give yourself a moment — strong emotions pass.",
        ],
      },
      {
        keywords: ["motivation", "lazy", "no energy"],
        replies: [
          "Start small — even one tiny task can build momentum.",
          "Action creates motivation. Begin with something simple.",
        ],
      },
      {
        keywords: ["failure", "useless"],
        replies: [
          "You're not a failure. Everyone struggles sometimes.",
          "Mistakes don’t define you — they help you grow.",
        ],
      },
      {
        keywords: ["confidence", "self doubt"],
        replies: [
          "Self-doubt is normal. Remember something you've done well.",
          "Confidence builds slowly — keep going.",
        ],
      },
      {
        keywords: ["breakup", "heartbroken"],
        replies: [
          "That pain is real. Healing takes time.",
          "Be gentle with yourself — you're processing a lot.",
        ],
      },
      {
        keywords: ["exam", "study"],
        replies: [
          "Focus on one topic at a time.",
          "Progress matters more than perfection.",
        ],
      },
      {
        keywords: ["job", "career"],
        replies: [
          "It’s okay to feel uncertain — take one step forward.",
          "Clarity comes with action.",
        ],
      },
      {
        keywords: ["family"],
        replies: [
          "Family issues can be tough. Try calm communication.",
          "Give yourself space if needed.",
        ],
      },
      {
        keywords: ["comparison"],
        replies: [
          "Everyone’s journey is different.",
          "Focus on your own progress.",
        ],
      },
      {
        keywords: ["guilt"],
        replies: [
          "Learn from it, but don’t stay stuck there.",
          "You deserve to move forward.",
        ],
      },
      {
        keywords: ["hopeless"],
        replies: [
          "It may feel dark, but things can change.",
          "You’re stronger than this moment.",
        ],
      },
      {
        keywords: ["burnout", "tired"],
        replies: [
          "Rest is not laziness — you need recovery.",
          "Take time to recharge your mind.",
        ],
      },
      {
        keywords: ["focus", "concentration"],
        replies: [
          "Try working in short focused bursts.",
          "Remove distractions and start small.",
        ],
      },
      {
        keywords: ["jealous", "envy"],
        replies: [
          "Your journey is unique — don’t compare.",
          "Focus on your own growth.",
        ],
      },
      {
        keywords: ["future", "worry"],
        replies: [
          "Focus on what you can control today.",
          "The future will unfold step by step.",
        ],
      },
      {
        keywords: ["self hate"],
        replies: [
          "Be kind to yourself — you deserve it.",
          "You are not your worst thoughts.",
        ],
      },
      {
        keywords: ["panic attack"],
        replies: [
          "Try grounding: 5 things you see, 4 you feel.",
          "Breathe slowly — this will pass.",
        ],
      },
      {
        keywords: ["no purpose", "lost"],
        replies: [
          "It’s okay to feel lost — explore slowly.",
          "Purpose comes from trying new things.",
        ],
      },
      {
        keywords: ["stuck"],
        replies: [
          "Start with one small step.",
          "Movement begins with tiny actions.",
        ],
      },
    ];

    // 🔍 Match response
    for (let item of responses) {
      if (item.keywords.some((word) => msg.includes(word))) {
        const randomReply =
          item.replies[Math.floor(Math.random() * item.replies.length)];

        return res.json({ reply: randomReply });
      }
    }

    // 💬 Default fallback
    const fallbackReplies = [
      "I'm here for you. Tell me more about what you're feeling.",
      "That sounds important. I'm listening.",
      "You can share anything — I'm here to help.",
    ];

    const randomFallback =
      fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)];

    res.json({ reply: randomFallback });

  } catch (err) {
    console.error("Chat error:", err.message);
    res.status(500).json({
      reply: "Something went wrong. Please try again.",
    });
  }
};