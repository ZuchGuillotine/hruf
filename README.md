# SupplementTracker - HIPAA-Compliant Health Supplement Management

![SupplementTracker](./generated-icon.png)

A comprehensive HIPAA-compliant supplement tracking application that empowers users with personalized health insights through advanced AI technology and intelligent supplement management.

## 🌟 Features

### Core Functionality
- **Smart Supplement Management**
  - Intelligent supplement name autocomplete with fuzzy search
  - Detailed supplement tracking with dosage and frequency
  - Comprehensive supplement information database
  - Active/inactive supplement status tracking

### User Experience
- **Intuitive Interface**
  - Clean, professional design with forest green theme
  - Responsive layout for all devices
  - Accessible design patterns
  - Real-time search suggestions

### Health Insights
- **AI-Powered Analysis**
  - Personal health recommendations
  - Supplement interaction warnings
  - Custom health insights
  - Progress tracking

### Security & Compliance
- **HIPAA Compliance**
  - Secure authentication system
  - Encrypted data storage
  - Privacy-focused design
  - Audit trail capabilities

## 🚀 Technical Stack

### Frontend
- React 18 with TypeScript
- Tailwind CSS for styling
- shadcn/ui component library
- TanStack Query for data fetching
- Wouter for routing

### Backend
- Express.js with TypeScript
- PostgreSQL database
- Drizzle ORM
- OpenAI GPT-4o integration
- Session-based authentication

### Development Tools
- Vite for frontend tooling
- ESLint & TypeScript for code quality
- Automated deployment on Replit

## 🔧 Setup & Installation

### Prerequisites
- Node.js 20+ and npm
- PostgreSQL database
- OpenAI API key

### Environment Variables
```env
DATABASE_URL=postgresql://user:password@host:port/dbname
OPENAI_API_KEY=your_openai_api_key
```

### Installation Steps
1. Clone the repository
```bash
git clone https://github.com/yourusername/supplement-tracker.git
cd supplement-tracker
```

2. Install dependencies
```bash
npm install
```

3. Set up the database
```bash
npm run db:push
```

4. Start the development server
```bash
npm run dev
```

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/register` - Create new user account
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `GET /api/user` - Get current user details

### Supplement Management
- `GET /api/supplements` - List user's supplements
- `POST /api/supplements` - Add new supplement
- `PUT /api/supplements/:id` - Update supplement
- `DELETE /api/supplements/:id` - Delete supplement

### Health Data
- `GET /api/health-stats` - Get user's health statistics
- `POST /api/health-stats` - Update health statistics

### AI Integration
- `POST /api/chat` - Interact with AI health assistant

## 🛠 Development

### Project Structure
```
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   └── lib/
├── server/
│   ├── routes/
│   ├── services/
│   └── utils/
└── db/
    ├── migrations/
    └── schema.ts
```

### Key Features Implementation

#### Fuzzy Search
The application implements an advanced fuzzy search algorithm for supplement names:
- Levenshtein distance calculation
- Dynamic distance thresholds based on word length
- Special handling for vitamin name variations
- Trie-based data structure for efficient lookups

```typescript
// Example fuzzy search usage
const results = supplementService.search("vitmin", 4);
// Returns matches like "Vitamin A", "Vitamin B12", etc.
```

### Database Schema
```typescript
// Core tables structure
users: {
  id: serial("id").primaryKey(),
  username: text("username").unique(),
  email: text("email").unique(),
  // ...other fields
}

supplements: {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  name: text("name"),
  dosage: text("dosage"),
  frequency: text("frequency"),
  // ...other fields
}
```

## 🔐 Security & HIPAA Compliance

### Security Measures
- Secure session management
- Password hashing with scrypt
- CORS protection
- Input sanitization
- Rate limiting

### HIPAA Compliance
- Encrypted data storage
- Access controls
- Audit logging
- Secure data transmission
- Privacy policy enforcement

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- NIH Office of Dietary Supplements for supplement data
- OpenAI for AI capabilities
- Replit for development platform
- Community contributors

## 📞 Support

For support questions, please create an issue in the GitHub repository or contact the development team.

---

Built with ❤️ for better health management
# hruf
