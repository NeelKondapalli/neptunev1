# Neptune - AI-Powered Music Creation Platform

[Neptune](https://www.useneptune.xyz/) is revolutionizing music creation by making it as effortless as writing text. Our platform combines cutting-edge AI technology with blockchain-verified ownership to democratize music production.

## 🎥 Demo Videos

Check out Neptune in action:

1. [Music Generation Demo](https://www.youtube.com/watch?v=HzEEJJzjGtU) - See how Neptune transforms text into music
2. [Audio Processing Pipeline](https://www.youtube.com/watch?v=ZsCSun0rFJ0) - Watch our advanced audio processing in action
3. [Full Platform Overview](https://www.youtube.com/watch?v=7qGZ3mJmt9c) - Complete walkthrough of Neptune's features

## 🎵 Features

### Audio Generation Pipeline
- User-friendly input methods:
  - Text prompts for describing desired music
  - Optional reference track upload
  - Humming or tapping rhythm input
- Audio artifacts stored on Storacha (Filecoin-backed IPFS)
- Reference tracks semantically transcribed using [Autotex](https://github.com/HariSrikanth/autotex)
- Context aggregation through Claude for prompt refinement
- Text-to-audio generation using Meta's MusicGen model
- Copyright protection via Story integration

### Audio Analysis & Processing
- Advanced spectral analysis (STFT+ Analysis)
- Beat sequence isolation using librosa
- Harmonic analysis with Constant-Q Transform (CQT)
- Instrument separation using MFCC
- High-performance processing:
  - ~1000 events/minute of audio
  - ~1200ms/minute processing time
- IPFS integration for robust versioning & edit management

### Video Input Pipeline
1. File/recording validation
2. Processing with Google Cloud Video Intelligence
3. Audio transcription using OpenAI Whisper
4. Claude-powered context aggregation
5. AI audio overlay for editing

## 🚀 Getting Started

1. **Visit [Neptune](https://www.useneptune.xyz/)**
2. Join the waitlist for early access
3. Once approved, you can start creating music through:
   - Text descriptions
   - Humming or tapping
   - Reference track upload

## 💻 Tech Stack

- **Frontend**: Next.js with TypeScript
- **Authentication**: NextAuth.js
- **Database**: Supabase
- **Styling**: Tailwind CSS + Radix UI
- **AI Integration**: 
  - Claude for context processing
  - Meta's MusicGen for audio generation
  - OpenAI Whisper for transcription
- **Audio Processing**: [Autotex](https://github.com/HariSrikanth/autotex)
- **Storage**: Web3.Storage (IPFS)
- **Audio Visualization**: Wavesurfer.js
- **Form Handling**: React Hook Form + Zod
- **Deployment**: Google Cloud Platform

## 🎯 Key Benefits

### For Musicians
- Intuitive music creation through natural input methods
- Professional-quality output with AI enhancement
- Instant blockchain-verified ownership
- Seamless editing and arrangement tools

### For Content Creators
- Quick music generation for videos and content
- Copyright-safe original music creation
- High-quality audio processing and enhancement
- Integrated video processing pipeline

## 🔒 Security & Ownership

- Automatic blockchain registration of created music
- Clear intellectual property rights establishment
- Immutable proof of authorship
- Integration with Story for copyright protection

## 📈 Performance

- Real-time audio processing and generation
- High-performance analysis pipeline
- Scalable cloud infrastructure
- Robust version control through IPFS

## 🤝 Contributing

We welcome contributions! Please check our [GitHub repository](https://github.com/yourusername/neptune) for guidelines.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

[Join the Waitlist](https://www.useneptune.xyz/) | [Documentation](https://docs.useneptune.xyz) | [GitHub](https://github.com/yourusername/neptune)
