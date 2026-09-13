import 'package:flutter_dotenv/flutter_dotenv.dart';

class AppConfig {
  static String get proxyUrl {
    const compileTimeUrl = String.fromEnvironment('PROXY_URL');
    final value = compileTimeUrl.isNotEmpty
        ? compileTimeUrl
        : (dotenv.env['PROXY_URL'] ?? '');

    return value.trim().replaceFirst(RegExp(r'/+$'), '');
  }

  static String get bearerToken => dotenv.env['PROXY_BEARER_TOKEN'] ?? '';
}
