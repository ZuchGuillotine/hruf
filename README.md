git clone [repository-url]
cd supplement-tracker
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
Create a `.env` file with:
```
DATABASE_URL=your_postgres_url
SENDGRID_API_KEY=your_sendgrid_key
OPENAI_API_KEY=your_openai_key
SESSION_SECRET=your_session_secret
```

4. Initialize the database
```bash
npm run db:push
```

5. Start development server
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Development Guidelines

### Code Standards
- Follow TypeScript best practices
- Use TanStack Query for data fetching
- Implement proper error boundaries
- Follow HIPAA compliance requirements
- Use provided UI components from shadcn/ui
- Write comprehensive tests

### HIPAA Compliance
- All health data must be encrypted at rest
- Implement audit logging for data access
- Ensure secure transmission (HTTPS)
- Maintain user consent records
- Regular security assessments

### Blog Management
- Use SEO-friendly slugs for URLs
- Optimize images before upload
- Implement proper content sanitization
- Follow accessibility guidelines
- Maintain consistent formatting

## Project Structure
```
├── client/               # Frontend React application
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Page components
│   │   ├── hooks/       # Custom React hooks
│   │   └── lib/         # Utilities and types
├── server/              # Backend Express application
│   ├── controllers/     # Route controllers
│   ├── services/        # Business logic
│   └── routes.ts        # API routes
└── db/                  # Database schema and migrations