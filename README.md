# CepacPlay

A gamified learning platform for law students.

## Features
- Battle Mode with real-time quizzes
- Achievement system
- Daily rewards
- Moodle integration
- XP and level progression
- Sound effects and notifications
- Bot opponents for practice

## Tech Stack
- Frontend: React + TypeScript
- State Management: React Context + Reducers
- Backend: Supabase
- Build Tool: Vite
- Authentication: Supabase Auth
- Database: PostgreSQL (via Supabase)

## Setup
1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with your Supabase credentials:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start the development server:
```bash
npm run dev
```

## Project Structure
```
project/
├── public/           # Static assets
│   └── sounds/       # Sound effects
├── src/
│   ├── components/   # React components
│   ├── contexts/     # React contexts
│   ├── hooks/        # Custom hooks
│   ├── lib/          # Library code
│   ├── pages/        # Page components
│   ├── services/     # Service layer
│   ├── types/        # TypeScript types
│   └── utils/        # Utility functions
└── tests/            # Test files
```

## Development
- Run tests: `npm test`
- Build for production: `npm run build`
- Preview production build: `npm run preview`

## Contributing
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License
This project is licensed under the MIT License - see the LICENSE file for details.