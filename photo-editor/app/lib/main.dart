import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

import 'screens/editor_screen.dart';

Future<void> main() async {
  // .env is optional because production builds can use --dart-define.
  try {
    await dotenv.load(fileName: '.env');
  } catch (_) {
    // No local .env is fine when PROXY_URL is supplied via --dart-define.
  }

  runApp(const AiPhotoEditorApp());
}

class AiPhotoEditorApp extends StatelessWidget {
  const AiPhotoEditorApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'AI Photo Editor',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.indigo),
        useMaterial3: true,
      ),
      home: const EditorScreen(),
    );
  }
}
