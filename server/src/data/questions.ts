// Each set contains 20 questions
// correctIndex = 0 / 1 / 2 / 3 (based on ✓ answers)

const baseQuestions = [
    {
        question:
            "<article>\n" +
            "  <header>Welcome</header>\n" +
            "  <section>Content here</section>\n" +
            "  <footer>© 2024</footer>\n" +
            "</article>\n\n" +
            "What happens if you nest another <header> inside the <section>?",
        options: [
            "Syntax error",
            "It's perfectly valid",
            "Only works in Chrome",
            "Automatically converts to <div>"
        ],
        correctAnswer: 1
    },
    {
        question:
            "Which selector has the HIGHEST specificity?",
        options: [
            "div.container p",
            "#main .content p",
            "[data-type=\"special\"] p",
            ".container #main p"
        ],
        correctAnswer: 3
    },
    {
        question:
            "let x = 1;\n" +
            "{\n" +
            "  let x = 2;\n" +
            "  console.log(x);\n" +
            "}\n" +
            "console.log(x);\n\n" +
            "What gets logged?",
        options: ["2, 2", "1, 1", "2, 1", "undefined, 1"],
        correctAnswer: 2
    },
    {
        question:
            "If justify-content: space-between is applied to a flex container with 3 items, where does the extra space go?",
        options: [
            "Before first item",
            "After last item",
            "Between items only",
            "Equally around all items"
        ],
        correctAnswer: 2
    },
    {
        question:
            "<div id=\"parent\">\n" +
            "  <button id=\"child\">Click</button>\n" +
            "</div>\n\n" +
            "If both have click listeners, what order do they fire (default)?",
        options: [
            "Parent then Child",
            "Child then Parent",
            "Only Child",
            "Random order"
        ],
        correctAnswer: 1
    },
    {
        question:
            ".grid {\n" +
            "  display: grid;\n" +
            "  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));\n" +
            "}\n\n" +
            "What does auto-fit do differently from auto-fill?",
        options: [
            "Nothing, they're identical",
            "Collapses empty tracks",
            "Creates more columns",
            "Only works with fixed widths"
        ],
        correctAnswer: 1
    },
    {
        question:
            "Promise.resolve(5)\n" +
            "  .then(x => x * 2)\n" +
            "  .then(x => x + 3)\n" +
            "  .then(console.log);\n\n" +
            "What gets logged?",
        options: ["5", "10", "13", "undefined"],
        correctAnswer: 2
    },
    {
        question:
            "An element with position: sticky behaves like which position until its scroll threshold?",
        options: ["absolute", "fixed", "relative", "static"],
        correctAnswer: 2
    },
    {
        question:
            "[1, 2, 3].reduce((acc, val) => acc + val, 10);\n\n" +
            "What's the result?",
        options: ["6", "16", "60", "Error"],
        correctAnswer: 1
    },
    {
        question:
            "When you apply transform: rotate(45deg), what's the default transform-origin?",
        options: ["top left", "center center", "bottom right", "0 0"],
        correctAnswer: 1
    },
    {
        question:
            "async function test() {\n" +
            "  console.log('A');\n" +
            "  await Promise.resolve();\n" +
            "  console.log('B');\n" +
            "}\n" +
            "test();\n" +
            "console.log('C');\n\n" +
            "What's the output order?",
        options: ["A, B, C", "A, C, B", "C, A, B", "A, B, C (parallel)"],
        correctAnswer: 1
    },
    {
        question:
            ":root { --color: red; }\n" +
            ".child { color: var(--color, blue); }\n" +
            ".parent { --color: green; }\n\n" +
            "What color is .child inside .parent?",
        options: ["red", "blue", "green", "black"],
        correctAnswer: 2
    },
    {
        question:
            "for (var i = 0; i < 3; i++) {\n" +
            "  setTimeout(() => console.log(i), 100);\n" +
            "}\n\n" +
            "What gets logged?",
        options: ["0, 1, 2", "3, 3, 3", "undefined × 3", "2, 2, 2"],
        correctAnswer: 1
    },
    {
        question:
            "What's the default threshold value for IntersectionObserver?",
        options: ["0", "0.5", "1", "[0, 1]"],
        correctAnswer: 0
    },
    {
        question:
            "What does contain: layout prevent?",
        options: [
            "External CSS from affecting element",
            "Layout recalculation outside element",
            "Element from being displayed",
            "Children from overflowing"
        ],
        correctAnswer: 1
    },
    {
        question:
            "What's the typical localStorage limit per origin in most browsers?",
        options: ["1MB", "5MB", "10MB", "Unlimited"],
        correctAnswer: 1
    },
    {
        question:
            "In <svg viewBox=\"0 0 100 100\">, what do the four numbers represent?",
        options: [
            "x, y, width, height",
            "top, left, bottom, right",
            "width, height, x, y",
            "minX, maxX, minY, maxY"
        ],
        correctAnswer: 0
    },
    {
        question:
            "const obj = Object.create(null);\n" +
            "obj.toString();\n\n" +
            "What happens?",
        options: [
            "Returns \"[object Object]\"",
            "Returns \"null\"",
            "TypeError",
            "Returns \"\""
        ],
        correctAnswer: 2
    },
    {
        question:
            "Why is backdrop-filter considered expensive?",
        options: [
            "Large file size",
            "Requires multiple render passes",
            "Not hardware accelerated",
            "Blocks main thread"
        ],
        correctAnswer: 1
    },
    {
        question:
            "If a service worker is registered at /app/sw.js, what's its default scope?",
        options: ["/", "/app/", "/app/sw.js", "Everything"],
        correctAnswer: 1
    }
];

// Helper function to reorder
const reorder = (order: number[]) => order.map(i => baseQuestions[i]);

export const questionSets = {
    A: baseQuestions,
    B: reorder([10, 3, 7, 1, 15, 5, 18, 0, 12, 9, 6, 14, 2, 17, 11, 4, 8, 16, 13, 19]),
    C: reorder([4, 9, 1, 13, 7, 15, 3, 11, 0, 18, 6, 16, 12, 8, 2, 19, 5, 10, 14, 17]),
    D: reorder([6, 14, 0, 12, 9, 3, 17, 5, 10, 18, 1, 7, 15, 11, 19, 2, 16, 4, 8, 13])
};
