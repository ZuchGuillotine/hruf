npm install
```

### Environment Setup
Create a `.env` file with:
```
DATABASE_URL=your_postgres_url
SENDGRID_API_KEY=your_sendgrid_key
OPENAI_API_KEY=your_openai_key
SESSION_SECRET=your_session_secret
```

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start