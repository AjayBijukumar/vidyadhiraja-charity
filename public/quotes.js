// public/quotes.js - Daily Wisdom Quotes from Chattambi Swamigal

const quotes = [
    {
        text: "True knowledge softens the heart and leads to service.",
        source: "Chattambi Swamigal"
    },
    {
        text: "The divine exists in every being, regardless of caste or creed.",
        source: "Chattambi Swamigal"
    },
    {
        text: "Compassion is the highest form of worship.",
        source: "Chattambi Swamigal"
    },
    {
        text: "Liberation is not in renouncing the world, but in seeing the divine in all.",
        source: "Chattambi Swamigal"
    },
    {
        text: "The mind purified by knowledge sees God in all beings.",
        source: "Chattambi Swamigal"
    },
    {
        text: "Service to humanity is service to the Divine.",
        source: "Chattambi Swamigal"
    },
    {
        text: "Where there is compassion, there is God.",
        source: "Chattambi Swamigal"
    },
    {
        text: "The greatest wisdom is knowing that all life is one.",
        source: "Chattambi Swamigal"
    },
    {
        text: "Peace comes not from changing the world, but from understanding it.",
        source: "Chattambi Swamigal"
    },
    {
        text: "True spirituality is expressed through kindness toward all beings.",
        source: "Chattambi Swamigal"
    },
    {
        text: "The ego separates, but wisdom unites.",
        source: "Chattambi Swamigal"
    },
    {
        text: "In serving the elderly, we serve the divine.",
        source: "Chattambi Swamigal"
    },
    {
        text: "Knowledge without compassion is incomplete.",
        source: "Chattambi Swamigal"
    },
    {
        text: "The sacred is not in temples alone, but in every act of kindness.",
        source: "Chattambi Swamigal"
    },
    {
        text: "When the heart opens, the mind finds peace.",
        source: "Chattambi Swamigal"
    },
    {
        text: "True wealth is measured by what we give, not what we keep.",
        source: "Chattambi Swamigal"
    },
    {
        text: "The soul's journey is toward unity with all.",
        source: "Chattambi Swamigal"
    },
    {
        text: "In helping others, we help ourselves.",
        source: "Chattambi Swamigal"
    },
    {
        text: "The wise see the same divine light in all creatures.",
        source: "Chattambi Swamigal"
    },
    {
        text: "Love is the bridge between the human and the divine.",
        source: "Chattambi Swamigal"
    },
    {
        text: "Every living being deserves respect and dignity.",
        source: "Chattambi Swamigal"
    },
    {
        text: "The path to God is through the heart, not just the mind.",
        source: "Chattambi Swamigal"
    },
    {
        text: "True religion is to practice compassion.",
        source: "Chattambi Swamigal"
    },
    {
        text: "In giving, we receive the greatest blessings.",
        source: "Chattambi Swamigal"
    },
    {
        text: "The universe is one family.",
        source: "Chattambi Swamigal"
    },
    {
        text: "Wisdom begins when we see ourselves in others.",
        source: "Chattambi Swamigal"
    },
    {
        text: "The highest truth is that all beings are interconnected.",
        source: "Chattambi Swamigal"
    },
    {
        text: "Kindness is the language of the soul.",
        source: "Chattambi Swamigal"
    },
    {
        text: "In serving the helpless, we find our true purpose.",
        source: "Chattambi Swamigal"
    },
    {
        text: "The divine light shines equally in all hearts.",
        source: "Chattambi Swamigal"
    }
];

// Function to get today's quote (changes at midnight)
function getTodaysQuote() {
    const today = new Date();
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    const quoteIndex = dayOfYear % quotes.length;
    return quotes[quoteIndex];
}

// Make it available globally
window.quotesData = { quotes, getTodaysQuote };