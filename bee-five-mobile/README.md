# Bee-Five Mobile

A React Native + Expo mobile version of the Bee-Five Connect Five game.

## Features

- **Connect Five Game**: Classic 5-in-a-row gameplay
- **Mobile Optimized**: Touch-friendly interface designed for mobile devices
- **Multiple Game Modes**: Local multiplayer, online play, and AI opponent
- **Responsive Design**: Adapts to different screen sizes
- **Bee Theme**: Fun bee-themed graphics and animations

## Getting Started

### Prerequisites

- Node.js (v16 or later)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- Expo Go app on your mobile device (for testing)

### Installation

1. Navigate to the project directory:
   ```bash
   cd bee-five-mobile
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Scan the QR code with Expo Go app on your mobile device, or press `w` to open in web browser.

## Game Modes

### Take Turns
- Local multiplayer mode
- Two players take turns on the same device
- Perfect for playing with friends

### Online Play
- Multiplayer over the internet
- Play with friends or random opponents
- Real-time gameplay

### Play AI
- Single player mode against AI
- Multiple difficulty levels
- Perfect for solo practice

## Game Rules

1. **Objective**: Be the first to get 5 pieces in a row (horizontal, vertical, or diagonal)
2. **Turn-based**: Players alternate placing pieces
3. **Time Limit**: Each player has a limited time to make their move
4. **Blocked Cells**: Some cells may be blocked and cannot be used
5. **Winning**: First player to get 5 in a row wins the game

## Technical Details

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **State Management**: React Hooks
- **Styling**: StyleSheet API
- **Platform Support**: iOS, Android, Web

## Project Structure

```
bee-five-mobile/
├── src/
│   ├── components/     # React components
│   ├── hooks/          # Custom React hooks
│   ├── utils/          # Utility functions
│   ├── constants/      # Game constants
│   └── data/          # Game data (facts, stories)
├── assets/            # Images and icons
├── App.tsx           # Main app component
└── app.json          # Expo configuration
```

## Building for Production

### Android APK
```bash
expo build:android
```

### iOS App
```bash
expo build:ios
```

### Web App
```bash
expo build:web
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

© 2025 Bee-Five. All rights reserved.

## Support

For issues and questions, please create an issue in the repository.

