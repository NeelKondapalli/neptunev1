# Neptune

A modern web application built with the T3 Stack, featuring AI integration and advanced audio processing capabilities.

## 🚀 Tech Stack

- **Framework**: [Next.js](https://nextjs.org) (App Router)
- **Authentication**: [NextAuth.js](https://next-auth.js.org)
- **Database**: [Supabase](https://supabase.com)
- **Styling**: [Tailwind CSS](https://tailwindcss.com) with [Radix UI](https://www.radix-ui.com)
- **AI Integration**: [Anthropic](https://www.anthropic.com) and [Replicate](https://replicate.com)
- **Storage**: [Web3.Storage](https://web3.storage)
- **Audio Processing**: [Wavesurfer.js](https://wavesurfer.js.org)
- **Form Handling**: [React Hook Form](https://react-hook-form.com) with [Zod](https://zod.dev)
- **Type Safety**: [TypeScript](https://www.typescriptlang.org)

## 📦 Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/neptune.git
   cd neptune
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory with the following variables:
   ```
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

   # AI Services
   ANTHROPIC_API_KEY=your_anthropic_api_key
   REPLICATE_API_TOKEN=your_replicate_api_token

   # Web3.Storage
   WEB3_STORAGE_TOKEN=your_web3_storage_token
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)** in your browser

## 🛠️ Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript compiler
- `npm run format:check` - Check code formatting
- `npm run format:write` - Format code

## 📁 Project Structure

```
src/
├── app/          # Next.js app router pages
├── components/   # Reusable UI components
├── lib/          # Utility functions and configurations
├── styles/       # Global styles and Tailwind config
└── env.js        # Environment variable validation
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
