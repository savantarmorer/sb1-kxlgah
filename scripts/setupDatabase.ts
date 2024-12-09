import { supabase } from '../src/lib/supabase';
import fs from 'fs';
import path from 'path';

async function runMigrations() {
  console.log('Running migrations...');
  
  try {
    // Read migration file
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, '../migrations/001_create_battle_tables.sql'),
      'utf8'
    );

    // Split into individual statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    // Run each statement
    for (const statement of statements) {
      const { error } = await supabase.rpc('exec', { sql: statement });
      if (error) {
        console.error('Migration error:', error);
        throw error;
      }
    }

    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Error running migrations:', error);
    throw error;
  }
}

const sampleQuestions = [
  {
    question: "Qual é o prazo para contestação em procedimento comum?",
    answers: [
      "10 dias úteis",
      "15 dias úteis",
      "20 dias úteis",
      "30 dias úteis"
    ],
    correct_answer: 1,  // 15 dias úteis
    category: "prazos",
    difficulty: 1
  },
  {
    question: "O que é o princípio do contraditório?",
    answers: [
      "Direito de recorrer sempre",
      "Direito de ser ouvido e se manifestar no processo",
      "Direito de produzir provas",
      "Direito de ter um advogado"
    ],
    correct_answer: 1,
    category: "principios",
    difficulty: 1
  },
  {
    question: "Qual é o prazo para apresentar réplica à contestação?",
    answers: [
      "5 dias úteis",
      "10 dias úteis",
      "15 dias úteis",
      "20 dias úteis"
    ],
    correct_answer: 2,  // 15 dias úteis
    category: "prazos",
    difficulty: 1
  },
  {
    question: "O que é a tutela provisória?",
    answers: [
      "Decisão final do processo",
      "Medida urgente ou baseada em evidência",
      "Recurso especial",
      "Tipo de perícia"
    ],
    correct_answer: 1,
    category: "tutela",
    difficulty: 1
  },
  {
    question: "Qual é o prazo para agravo de instrumento?",
    answers: [
      "5 dias úteis",
      "10 dias úteis",
      "15 dias úteis",
      "20 dias úteis"
    ],
    correct_answer: 2,  // 15 dias úteis
    category: "recursos",
    difficulty: 1
  }
];

async function seedQuestions() {
  console.log('Seeding questions...');
  
  try {
    const { error } = await supabase
      .from('battle_questions')
      .insert(sampleQuestions);

    if (error) {
      console.error('Error seeding questions:', error);
      throw error;
    }
    
    console.log('Successfully seeded questions');
  } catch (error) {
    console.error('Error seeding questions:', error);
    throw error;
  }
}

async function setup() {
  try {
    await runMigrations();
    await seedQuestions();
    console.log('Database setup completed successfully');
  } catch (error) {
    console.error('Database setup failed:', error);
    process.exit(1);
  }
}

// Run setup if this file is run directly
if (require.main === module) {
  setup();
}
