import pool from "./config/database.js";

  async function seedSampleLessons() {
    try {
      console.log('Seeding sample lessons with dependencies...');

      // Get course IDs for reference
      const courseResult = await pool.query('SELECT id, title FROM courses ORDER BY id');
      const courses = courseResult.rows.reduce((acc, course) => {
        acc[course.title] = course.id;
        return acc;
      }, {});

      // Sample lessons data with dependencies
      const lessonsData = [
        // Course 1: Intro to English with Blockly (4-7 years)
        {
          course_id: courses['Intro to English with Blockly'],
          title: 'Hello, Colors!',
          description: 'Learn basic colors in English while creating colorful block patterns',
          instructions: {
            en: 'Drag and connect the color blocks to create a rainbow pattern. Say each color out loud!',
            spanish: 'Arrastra y conecta los bloques de color para crear un patrón de arcoíris. ¡Di cada color en voz alta!'
          },
          order_index: 1,
          coding_challenge: `
            <xml xmlns="https://developers.google.com/blockly/xml">
              <block type="colour_picker" x="100" y="100">
                <field name="COLOUR">#FF0000</field>
              </block>
            </xml>
          `,
          vocabulary: {
            words: [
              { word: "red", translation: "rojo", audio_url: "/audio/red.mp3" },
              { word: "blue", translation: "azul", audio_url: "/audio/blue.mp3" },
              { word: "green", translation: "verde", audio_url: "/audio/green.mp3" },
              { word: "yellow", translation: "amarillo", audio_url: "/audio/yellow.mp3" }
            ]
          },
          expected_output: "Rainbow pattern created",
          is_optional: false,
          estimated_duration: 600
        },
        {
          course_id: courses['Intro to English with Blockly'],
          title: 'Animal Friends',
          description: 'Meet animal friends and learn their names in English',
          instructions: {
            en: 'Connect the animal blocks to make them appear on screen. Practice saying each animal name!',
            spanish: 'Conecta los bloques de animales para hacer que aparezcan en la pantalla. ¡Practica diciendo cada nombre de animal!'
          },
          order_index: 2,
          coding_challenge: `
            <xml xmlns="https://developers.google.com/blockly/xml">
              <block type="controls_repeat_ext" x="100" y="100">
                <value name="TIMES">
                  <block type="math_number">
                    <field name="NUM">3</field>
                  </block>
                </value>
                <statement name="DO">
                  <block type="animal_show">
                    <field name="ANIMAL">cat</field>
                  </block>
                </statement>
              </block>
            </xml>
          `,
          vocabulary: {
            words: [
              { word: "cat", translation: "gato", audio_url: "/audio/cat.mp3" },
              { word: "dog", translation: "perro", audio_url: "/audio/dog.mp3" },
              { word: "bird", translation: "pájaro", audio_url: "/audio/bird.mp3" },
              { word: "fish", translation: "pez", audio_url: "/audio/fish.mp3" }
            ]
          },
          expected_output: "Animals displayed 3 times",
          is_optional: false,
          estimated_duration: 720
        },
        {
          course_id: courses['Intro to English with Blockly'],
          title: 'Counting Fun',
          description: 'Learn numbers 1-10 in English through interactive counting games',
          instructions: {
            en: 'Use the number blocks to count from 1 to 10. Listen to the pronunciation of each number!',
            spanish: 'Usa los bloques numéricos para contar del 1 al 10. ¡Escucha la pronunciación de cada número!'
          },
          order_index: 3,
          coding_challenge: `
            <xml xmlns="https://developers.google.com/blockly/xml">
              <block type="controls_for" x="100" y="100">
                <field name="VAR">i</field>
                <value name="FROM">
                  <block type="math_number">
                    <field name="NUM">1</field>
                  </block>
                </value>
                <value name="TO">
                  <block type="math_number">
                    <field name="NUM">5</field>
                  </block>
                </value>
                <value name="BY">
                  <block type="math_number">
                    <field name="NUM">1</field>
                  </block>
                </value>
                <statement name="DO">
                  <block type="text_print">
                    <value name="TEXT">
                      <block type="variables_get">
                        <field name="VAR">i</field>
                      </block>
                    </value>
                  </block>
                </statement>
              </block>
            </xml>
          `,
          vocabulary: {
            words: [
              { word: "one", translation: "uno", audio_url: "/audio/one.mp3" },
              { word: "two", translation: "dos", audio_url: "/audio/two.mp3" },
              { word: "three", translation: "tres", audio_url: "/audio/three.mp3" },
              { word: "four", translation: "cuatro", audio_url: "/audio/four.mp3" },
              { word: "five", translation: "cinco", audio_url: "/audio/five.mp3" }
            ]
          },
          expected_output: "1\n2\n3\n4\n5",
          is_optional: false,
          estimated_duration: 900
        },

        // Course 2: English Adventures: Stories & Code (8-12 years)
        {
          course_id: courses['English Adventures: Stories & Code'],
          title: 'The Magic Forest',
          description: 'Create an interactive story about exploring a magical forest',
          instructions: {
            en: 'Write a Python program that tells a story about exploring a magic forest. Use variables to track your adventure!',
            spanish: 'Escribe un programa en Python que cuente una historia sobre explorar un bosque mágico. ¡Usa variables para seguir tu aventura!'
          },
          order_index: 1,
          coding_challenge: `# Create your magic forest adventure story
forest_name = "Enchanted Woods"
character = "brave explorer"
magical_item = "glowing crystal"

print(f"Welcome to the {forest_name}!")
print(f"You are a {character} with a {magical_item}.")`,
          vocabulary: {
            words: [
              { word: "forest", translation: "bosque", audio_url: "/audio/forest.mp3" },
              { word: "adventure", translation: "aventura", audio_url: "/audio/adventure.mp3" },
              { word: "magical", translation: "mágico", audio_url: "/audio/magical.mp3" },
              { word: "explore", translation: "explorar", audio_url: "/audio/explore.mp3" }
            ]
          },
          expected_output: "Welcome to the Enchanted Woods!\nYou are a brave explorer with a glowing crystal.",
          is_optional: false,
          estimated_duration: 1200
        },
        {
          course_id: courses['English Adventures: Stories & Code'],
          title: 'Character Conversations',
          description: 'Make story characters talk to each other using Python input/output',
          instructions: {
            en: 'Create a conversation between two characters. Use input() to let the user participate in the story!',
            spanish: 'Crea una conversación entre dos personajes. ¡Usa input() para permitir que el usuario participe en la historia!'
          },
          order_index: 2,
          coding_challenge: `# Create a character conversation
character1 = "Wise Owl"
character2 = "Curious Rabbit"

print(f"{character1}: Who goes there?")
response = input("Enter your name: ")
print(f"{character2}: Hello {response}! Welcome to our forest!")`,
          vocabulary: {
            words: [
              { word: "conversation", translation: "conversación", audio_url: "/audio/conversation.mp3" },
              { word: "character", translation: "personaje", audio_url: "/audio/character.mp3" },
              { word: "dialogue", translation: "diálogo", audio_url: "/audio/dialogue.mp3" },
              { word: "interactive", translation: "interactivo", audio_url: "/audio/interactive.mp3" }
            ]
          },
          expected_output: "Wise Owl: Who goes there?\n[User input]\nCurious Rabbit: Hello [input]! Welcome to our forest!",
          is_optional: false,
          estimated_duration: 1500
        },
        {
          course_id: courses['English Adventures: Stories & Code'],
          title: 'Story Choices',
          description: 'Create branching story paths with conditional statements',
          instructions: {
            en: 'Use if/else statements to create different story paths based on user choices',
            spanish: 'Usa declaraciones if/else para crear diferentes caminos de historia basados en las elecciones del usuario'
          },
          order_index: 3,
          coding_challenge: `# Create a branching story
print("You reach a fork in the path.")
print("1. Take the left path")
print("2. Take the right path")

choice = input("Enter your choice (1 or 2): ")

if choice == "1":
    print("You discover a hidden waterfall!")
else:
    print("You find a treasure chest!")`,
          vocabulary: {
            words: [
              { word: "choice", translation: "elección", audio_url: "/audio/choice.mp3" },
              { word: "decision", translation: "decisión", audio_url: "/audio/decision.mp3" },
              { word: "branching", translation: "ramificación", audio_url: "/audio/branching.mp3" },
              { word: "conditional", translation: "condicional", audio_url: "/audio/conditional.mp3" }
            ]
          },
          expected_output: "You reach a fork in the path.\n1. Take the left path\n2. Take the right path\n[User input]\n[Path description based on choice]",
          is_optional: false,
          estimated_duration: 1800
        },

        // Course 3: Everyday English for Teens (13-17 years)
        {
          course_id: courses['Everyday English for Teens'],
          title: 'Weather App',
          description: 'Build a simple weather application while learning weather vocabulary',
          instructions: {
            en: 'Create a JavaScript function that displays weather information based on user input',
            spanish: 'Crea una función en JavaScript que muestre información del clima basada en la entrada del usuario'
          },
          order_index: 1,
          coding_challenge: `// Weather vocabulary practice
const weatherWords = {
  sunny: "soleado",
  rainy: "lluvioso", 
  cloudy: "nublado",
  windy: "ventoso"
};

function getWeatherDescription(weatherType) {
  return \`The weather is \${weatherType} - \${weatherWords[weatherType]}\`;
}

// Test the function
console.log(getWeatherDescription("sunny"));`,
          vocabulary: {
            words: [
              { word: "weather", translation: "clima", audio_url: "/audio/weather.mp3" },
              { word: "temperature", translation: "temperatura", audio_url: "/audio/temperature.mp3" },
              { word: "forecast", translation: "pronóstico", audio_url: "/audio/forecast.mp3" },
              { word: "conditions", translation: "condiciones", audio_url: "/audio/conditions.mp3" }
            ]
          },
          expected_output: "The weather is sunny - soleado",
          is_optional: false,
          estimated_duration: 1500
        },
        {
          course_id: courses['Everyday English for Teens'],
          title: 'Shopping List Manager',
          description: 'Create a shopping list application with English food vocabulary',
          instructions: {
            en: 'Build a shopping list manager that uses arrays and objects to store items in both English and Spanish',
            spanish: 'Construye un administrador de lista de compras que use arrays y objetos para almacenar items en inglés y español'
          },
          order_index: 2,
          coding_challenge: `// Shopping list with bilingual support
const shoppingItems = [
  { english: "apple", spanish: "manzana", category: "fruit" },
  { english: "bread", spanish: "pan", category: "bakery" },
  { english: "milk", spanish: "leche", category: "dairy" }
];

function displayShoppingList() {
  shoppingItems.forEach(item => {
    console.log(\`\${item.english} / \${item.spanish} - \${item.category}\`);
  });
}

displayShoppingList();`,
          vocabulary: {
            words: [
              { word: "grocery", translation: "supermercado", audio_url: "/audio/grocery.mp3" },
              { word: "shopping", translation: "compras", audio_url: "/audio/shopping.mp3" },
              { word: "list", translation: "lista", audio_url: "/audio/list.mp3" },
              { word: "items", translation: "artículos", audio_url: "/audio/items.mp3" }
            ]
          },
          expected_output: "apple / manzana - fruit\nbread / pan - bakery\nmilk / leche - dairy",
          is_optional: false,
          estimated_duration: 1800
        },

        // Course 4: Spanish Basics with Blockly (4-7 years)
        {
          course_id: courses['Spanish Basics with Blockly'],
          title: '¡Hola Amigos!',
          description: 'Learn basic Spanish greetings through block programming',
          instructions: {
            en: 'Connect greeting blocks to create a friendly conversation in Spanish',
            spanish: 'Conecta los bloques de saludo para crear una conversación amigable en español'
          },
          order_index: 1,
          coding_challenge: `
            <xml xmlns="https://developers.google.com/blockly/xml">
              <block type="text_join" x="100" y="100">
                <mutation items="2"></mutation>
                <value name="ADD0">
                  <block type="text">
                    <field name="TEXT">¡Hola! </field>
                  </block>
                </value>
                <value name="ADD1">
                  <block type="text">
                    <field name="TEXT">¿Cómo estás?</field>
                  </block>
                </value>
              </block>
            </xml>
          `,
          vocabulary: {
            words: [
              { word: "hola", translation: "hello", audio_url: "/audio/hola.mp3" },
              { word: "adiós", translation: "goodbye", audio_url: "/audio/adios.mp3" },
              { word: "gracias", translation: "thank you", audio_url: "/audio/gracias.mp3" },
              { word: "por favor", translation: "please", audio_url: "/audio/por_favor.mp3" }
            ]
          },
          expected_output: "¡Hola! ¿Cómo estás?",
          is_optional: false,
          estimated_duration: 600
        },
        {
          course_id: courses['Spanish Basics with Blockly'],
          title: 'Números en Español',
          description: 'Learn Spanish numbers 1-5 with counting games',
          instructions: {
            en: 'Use number blocks to count in Spanish and create simple math operations',
            spanish: 'Usa bloques numéricos para contar en español y crear operaciones matemáticas simples'
          },
          order_index: 2,
          coding_challenge: `
            <xml xmlns="https://developers.google.com/blockly/xml">
              <block type="math_arithmetic" x="100" y="100">
                <field name="OP">ADD</field>
                <value name="A">
                  <block type="math_number">
                    <field name="NUM">2</field>
                  </block>
                </value>
                <value name="B">
                  <block type="math_number">
                    <field name="NUM">3</field>
                  </block>
                </value>
              </block>
            </xml>
          `,
          vocabulary: {
            words: [
              { word: "uno", translation: "one", audio_url: "/audio/uno.mp3" },
              { word: "dos", translation: "two", audio_url: "/audio/dos.mp3" },
              { word: "tres", translation: "three", audio_url: "/audio/tres.mp3" },
              { word: "cuatro", translation: "four", audio_url: "/audio/cuatro.mp3" },
              { word: "cinco", translation: "five", audio_url: "/audio/cinco.mp3" }
            ]
          },
          expected_output: "5",
          is_optional: false,
          estimated_duration: 720
        },

        // Course 5: Spanish Storytelling and Code (8-12 years)
        {
          course_id: courses['Spanish Storytelling and Code'],
          title: 'Cuento Interactivo',
          description: 'Create an interactive Spanish story with Python',
          instructions: {
            en: 'Write a Python program that tells a story in Spanish with user interaction',
            spanish: 'Escribe un programa en Python que cuente una historia en español con interacción del usuario'
          },
          order_index: 1,
          coding_challenge: `# Cuento interactivo en español
personaje = input("¿Cómo se llama tu personaje? ")
lugar = "un castillo misterioso"

print(f"Había una vez {personaje} que vivía en {lugar}.")
print("Un día, {personaje} decidió explorar los pasillos secretos.")`,
          vocabulary: {
            words: [
              { word: "cuento", translation: "story", audio_url: "/audio/cuento.mp3" },
              { word: "personaje", translation: "character", audio_url: "/audio/personaje.mp3" },
              { word: "aventura", translation: "adventure", audio_url: "/audio/aventura.mp3" },
              { word: "historia", translation: "history/story", audio_url: "/audio/historia.mp3" }
            ]
          },
          expected_output: "[User input for character name]\nHabía una vez [character] que vivía en un castillo misterioso.\nUn día, [character] decidió explorar los pasillos secretos.",
          is_optional: false,
          estimated_duration: 1500
        },

        // Course 6: French Fun with Blocks (4-7 years)
        {
          course_id: courses['French Fun with Blocks'],
          title: 'Bonjour les Couleurs!',
          description: 'Learn French colors through block programming',
          instructions: {
            en: 'Create colorful patterns while learning French color names',
            spanish: 'Crea patrones coloridos mientras aprendes los nombres de los colores en francés'
          },
          order_index: 1,
          coding_challenge: `
            <xml xmlns="https://developers.google.com/blockly/xml">
              <block type="colour_blend" x="100" y="100">
                <value name="COLOUR1">
                  <block type="colour_picker">
                    <field name="COLOUR">#FF0000</field>
                  </block>
                </value>
                <value name="COLOUR2">
                  <block type="colour_picker">
                    <field name="COLOUR">#0000FF</field>
                  </block>
                </value>
                <value name="RATIO">
                  <block type="math_number">
                    <field name="NUM">0.5</field>
                  </block>
                </value>
              </block>
            </xml>
          `,
          vocabulary: {
            words: [
              { word: "rouge", translation: "red", audio_url: "/audio/rouge.mp3" },
              { word: "bleu", translation: "blue", audio_url: "/audio/bleu.mp3" },
              { word: "vert", translation: "green", audio_url: "/audio/vert.mp3" },
              { word: "jaune", translation: "yellow", audio_url: "/audio/jaune.mp3" }
            ]
          },
          expected_output: "Color blend created",
          is_optional: false,
          estimated_duration: 600
        },

        // Course 7: French Labs: Coding & Conversation (13-17 years)
        {
          course_id: courses['French Labs: Coding & Conversation'],
          title: 'Restaurant Simulator',
          description: 'Build a restaurant ordering system in French',
          instructions: {
            en: 'Create a JavaScript application for a French restaurant with menu and ordering system',
            spanish: 'Crea una aplicación en JavaScript para un restaurante francés con menú y sistema de pedidos'
          },
          order_index: 1,
          coding_challenge: `// French restaurant simulator
const menu = {
  "croissant": 2.50,
  "baguette": 1.80,
  "quiche": 5.00,
  "crêpe": 3.50
};

function commanderNourriture(plat, quantite) {
  const prixTotal = menu[plat] * quantite;
  return \`\${quantite} \${plat}(s) - €\${prixTotal.toFixed(2)}\`;
}

console.log("Menu du jour:");
for (const [plat, prix] of Object.entries(menu)) {
  console.log(\`\${plat}: €\${prix}\`);
}`,
          vocabulary: {
            words: [
              { word: "restaurant", translation: "restaurante", audio_url: "/audio/restaurant.mp3" },
              { word: "commander", translation: "to order", audio_url: "/audio/commander.mp3" },
              { word: "nourriture", translation: "food", audio_url: "/audio/nourriture.mp3" },
              { word: "menu", translation: "menú", audio_url: "/audio/menu_fr.mp3" }
            ]
          },
          expected_output: "Menu du jour:\ncroissant: €2.50\nbaguette: €1.80\nquiche: €5.00\ncrêpe: €3.50",
          is_optional: false,
          estimated_duration: 1800
        },

        // Course 8: German Basics for Kids (8-12 years)
        {
          course_id: courses['German Basics for Kids'],
          title: 'Hallo Deutschland!',
          description: 'Learn basic German greetings and introductions',
          instructions: {
            en: 'Create a Blockly program that introduces yourself in German',
            spanish: 'Crea un programa Blockly que te presente en alemán'
          },
          order_index: 1,
          coding_challenge: `
            <xml xmlns="https://developers.google.com/blockly/xml">
              <block type="text_join" x="100" y="100">
                <mutation items="3"></mutation>
                <value name="ADD0">
                  <block type="text">
                    <field name="TEXT">Hallo! </field>
                  </block>
                </value>
                <value name="ADD1">
                  <block type="text">
                    <field name="TEXT">Ich heiße </field>
                  </block>
                </value>
                <value name="ADD2">
                  <block type="text">
                    <field name="TEXT">[Name]</field>
                  </block>
                </value>
              </block>
            </xml>
          `,
          vocabulary: {
            words: [
              { word: "Hallo", translation: "Hello", audio_url: "/audio/hallo.mp3" },
              { word: "Guten Tag", translation: "Good day", audio_url: "/audio/guten_tag.mp3" },
              { word: "Auf Wiedersehen", translation: "Goodbye", audio_url: "/audio/auf_wiedersehen.mp3" },
              { word: "Danke", translation: "Thank you", audio_url: "/audio/danke.mp3" }
            ]
          },
          expected_output: "Hallo! Ich heiße [Name]",
          is_optional: false,
          estimated_duration: 900
        },

        // Course 9: Mandarin Starter Projects (8-12 years)
        {
          course_id: courses['Mandarin Starter Projects'],
          title: 'Numbers in Mandarin',
          description: 'Learn to count and use numbers in Mandarin Chinese',
          instructions: {
            en: 'Create a Python program that teaches Mandarin numbers 1-10',
            spanish: 'Crea un programa en Python que enseñe los números del 1-10 en mandarín'
          },
          order_index: 1,
          coding_challenge: `# Mandarin numbers practice
mandarin_numbers = {
  1: "一 (yī)",
  2: "二 (èr)", 
  3: "三 (sān)",
  4: "四 (sì)",
  5: "五 (wǔ)",
  6: "六 (liù)",
  7: "七 (qī)",
  8: "八 (bā)",
  9: "九 (jiǔ)",
  10: "十 (shí)"
}

for number, character in mandarin_numbers.items():
    print(f"{number}: {character}")`,
          vocabulary: {
            words: [
              { word: "数字", translation: "numbers", audio_url: "/audio/shuzi.mp3" },
              { word: "一", translation: "one", audio_url: "/audio/yi.mp3" },
              { word: "二", translation: "two", audio_url: "/audio/er.mp3" },
              { word: "三", translation: "three", audio_url: "/audio/san.mp3" }
            ]
          },
          expected_output: "1: 一 (yī)\n2: 二 (èr)\n3: 三 (sān)\n4: 四 (sì)\n5: 五 (wǔ)\n6: 六 (liù)\n7: 七 (qī)\n8: 八 (bā)\n9: 九 (jiǔ)\n10: 十 (shí)",
          is_optional: false,
          estimated_duration: 1200
        },

        // Course 10: Multilingual Explorer (8-12 years)
        {
          course_id: courses['Multilingual Explorer'],
          title: 'Greetings Around the World',
          description: 'Learn greetings in multiple languages through coding',
          instructions: {
            en: 'Create a program that displays greetings in English, Spanish, and French',
            spanish: 'Crea un programa que muestre saludos en inglés, español y francés'
          },
          order_index: 1,
          coding_challenge: `
            <xml xmlns="https://developers.google.com/blockly/xml">
              <block type="controls_if" x="100" y="100">
                <value name="IF0">
                  <block type="logic_compare">
                    <field name="OP">EQ</field>
                    <value name="A">
                      <block type="variables_get">
                        <field name="VAR">language</field>
                      </block>
                    </value>
                    <value name="B">
                      <block type="text">
                        <field name="TEXT">english</field>
                      </block>
                    </value>
                  </block>
                </value>
                <statement name="DO0">
                  <block type="text_print">
                    <value name="TEXT">
                      <block type="text">
                        <field name="TEXT">Hello!</field>
                      </block>
                    </value>
                  </block>
                </statement>
              </block>
            </xml>
          `,
          vocabulary: {
            words: [
              { word: "greeting", translation: "saludo", audio_url: "/audio/greeting.mp3" },
              { word: "language", translation: "idioma", audio_url: "/audio/language.mp3" },
              { word: "multilingual", translation: "multilingüe", audio_url: "/audio/multilingual.mp3" },
              { word: "culture", translation: "cultura", audio_url: "/audio/culture.mp3" }
            ]
          },
          expected_output: "Hello! (when language is english)",
          is_optional: false,
          estimated_duration: 1500
        },

        // Course 11: Advanced Coding for Language Tutors (13-17 years)
        {
          course_id: courses['Advanced Coding for Language Tutors'],
          title: 'Language Quiz App',
          description: 'Build an advanced language learning quiz application',
          instructions: {
            en: 'Create a comprehensive language quiz with multiple question types and scoring system',
            spanish: 'Crea un cuestionario de idiomas completo con múltiples tipos de preguntas y sistema de puntuación'
          },
          order_index: 1,
          coding_challenge: `// Advanced language quiz application
class LanguageQuiz {
  constructor() {
    this.questions = [
      {
        question: "How do you say 'hello' in Spanish?",
        options: ["Hola", "Adiós", "Gracias", "Por favor"],
        answer: "Hola",
        language: "spanish"
      },
      {
        question: "What is 'thank you' in French?",
        options: ["Bonjour", "Merci", "Au revoir", "S'il vous plaît"],
        answer: "Merci", 
        language: "french"
      }
    ];
    this.score = 0;
  }

  checkAnswer(questionIndex, userAnswer) {
    return this.questions[questionIndex].answer === userAnswer;
  }
}

// Test the quiz
const quiz = new LanguageQuiz();
console.log("Welcome to the Language Quiz!");`,
          vocabulary: {
            words: [
              { word: "quiz", translation: "cuestionario", audio_url: "/audio/quiz.mp3" },
              { word: "application", translation: "aplicación", audio_url: "/audio/application.mp3" },
              { word: "advanced", translation: "avanzado", audio_url: "/audio/advanced.mp3" },
              { word: "comprehensive", translation: "integral", audio_url: "/audio/comprehensive.mp3" }
            ]
          },
          expected_output: "Welcome to the Language Quiz!",
          is_optional: false,
          estimated_duration: 2400
        },

        // Course 12: Game-Based Language Learning (8-12 years)
        {
          course_id: courses['Game-Based Language Learning'],
          title: 'Vocabulary Memory Game',
          description: 'Create a memory matching game with language vocabulary',
          instructions: {
            en: 'Build a memory game where players match words with their translations',
            spanish: 'Construye un juego de memoria donde los jugadores emparejen palabras con sus traducciones'
          },
          order_index: 1,
          coding_challenge: `# Vocabulary memory game
import random

# Word pairs: English - Spanish
word_pairs = [
    ["cat", "gato"],
    ["dog", "perro"], 
    ["house", "casa"],
    ["water", "agua"]
]

# Create cards (each word appears twice)
cards = []
for english, spanish in word_pairs:
    cards.extend([english, spanish])

random.shuffle(cards)

print("Memory Game Cards:")
for i, card in enumerate(cards):
    print(f"Card {i+1}: [ ? ]")`,
          vocabulary: {
            words: [
              { word: "game", translation: "juego", audio_url: "/audio/game.mp3" },
              { word: "memory", translation: "memoria", audio_url: "/audio/memory.mp3" },
              { word: "match", translation: "emparejar", audio_url: "/audio/match.mp3" },
              { word: "vocabulary", translation: "vocabulario", audio_url: "/audio/vocabulary.mp3" }
            ]
          },
          expected_output: "Memory Game Cards:\nCard 1: [ ? ]\nCard 2: [ ? ]\n...",
          is_optional: false,
          estimated_duration: 1800
        }
      ];

      // Insert lessons
      const lessonIds = [];
      for (const lesson of lessonsData) {
        const query = `
          INSERT INTO lessons (course_id, title, description, instructions, order_index, coding_challenge, vocabulary, expected_output, is_optional, estimated_duration)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING id
        `;
        const values = [
          lesson.course_id,
          lesson.title,
          lesson.description,
          JSON.stringify(lesson.instructions),
          lesson.order_index,
          lesson.coding_challenge,
          JSON.stringify(lesson.vocabulary),
          lesson.expected_output,
          lesson.is_optional,
          lesson.estimated_duration
        ];
        
        const result = await pool.query(query, values);
        lessonIds.push(result.rows[0].id);
      }

      // Create lesson dependencies
      const dependencies = [
        // Course 1 dependencies
        {
          lesson_id: lessonIds[1], // Animal Friends (requires Hello Colors)
          required_lesson_id: lessonIds[0],
          min_score: 70,
          dependency_type: 'lesson'
        },
        {
          lesson_id: lessonIds[2], // Counting Fun (requires Animal Friends)
          required_lesson_id: lessonIds[1],
          min_score: 80,
          dependency_type: 'lesson'
        },

        // Course 2 dependencies
        {
          lesson_id: lessonIds[4], // Character Conversations (requires Magic Forest)
          required_lesson_id: lessonIds[3],
          min_score: 75,
          dependency_type: 'lesson'
        },
        {
          lesson_id: lessonIds[5], // Story Choices (requires Character Conversations + achievement)
          required_lesson_id: lessonIds[4],
          required_achievement_type: 'fast_learner',
          min_score: 85,
          dependency_type: 'achievement'
        },

        // Course 3 dependencies
        {
          lesson_id: lessonIds[7], // Shopping List Manager (requires Weather App)
          required_lesson_id: lessonIds[6],
          min_score: 80,
          dependency_type: 'lesson'
        },

        // Course 4 dependencies
        {
          lesson_id: lessonIds[9], // Números en Español (requires ¡Hola Amigos!)
          required_lesson_id: lessonIds[8],
          min_score: 70,
          dependency_type: 'lesson'
        },

        // Course 5 dependencies (Spanish Storytelling)
        {
          lesson_id: lessonIds[10], // Requires basic Spanish achievement
          required_achievement_type: 'first_lesson',
          min_score: 0,
          dependency_type: 'achievement'
        },

        // Course 7 dependencies (French Labs)
        {
          lesson_id: lessonIds[12], // Restaurant Simulator requires basic French
          required_achievement_type: 'language_explorer',
          min_score: 0,
          dependency_type: 'achievement'
        },

        // Course 11 dependencies (Advanced Coding)
        {
          lesson_id: lessonIds[16], // Language Quiz App requires multiple achievements
          required_achievement_type: 'fast_learner',
          min_score: 0,
          dependency_type: 'achievement'
        },

        // Course 12 dependencies (Game-Based Learning)
        {
          lesson_id: lessonIds[17], // Vocabulary Memory Game requires basic programming
          required_lesson_id: lessonIds[3], // From English Adventures course
          min_score: 75,
          dependency_type: 'lesson'
        }
      ];

      for (const dep of dependencies) {
        const query = `
          INSERT INTO lesson_dependencies (lesson_id, required_lesson_id, required_achievement_type, min_score, dependency_type)
          VALUES ($1, $2, $3, $4, $5)
        `;
        const values = [
          dep.lesson_id,
          dep.required_lesson_id || null,
          dep.required_achievement_type || null,
          dep.min_score,
          dep.dependency_type
        ];
        
        await pool.query(query, values);
      }

      console.log(`Successfully seeded ${lessonsData.length} lessons with ${dependencies.length} dependencies`);
      return lessonIds;
    } catch (error) {
      console.error('Error seeding lessons:', error);
      throw error;
    }
  }

  async function clearLessons() {
    try {
      await pool.query('DELETE FROM lesson_dependencies');
      await pool.query('DELETE FROM lessons');
      console.log('All lessons and dependencies cleared');
    } catch (error) {
      console.error('Error clearing lessons:', error);
      throw error;
    }
  }


seedSampleLessons();