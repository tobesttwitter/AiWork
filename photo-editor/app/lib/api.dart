import 'dart:convert';
import 'dart:typed_data';

import 'package:http/http.dart' as http;

class EditResult {
  const EditResult({required this.bytes, required this.mimeType});

  final Uint8List bytes;
  final String mimeType;
}

class PhotoEditorApi {
  PhotoEditorApi({required this.baseUrl, this.bearerToken = ''});

  final String baseUrl;
  final String bearerToken;

  Future<EditResult> edit({
    required String prompt,
    required Uint8List imageBytes,
    required String mimeType,
  }) async {
    if (baseUrl.isEmpty) {
      throw const PhotoEditorApiException('Proxy URL is not configured.');
    }

    final uri = Uri.parse('$baseUrl/edit');
    final headers = <String, String>{'Content-Type': 'application/json'};

    if (bearerToken.isNotEmpty) {
      headers['Authorization'] = 'Bearer $bearerToken';
    }

    final response = await http
        .post(
          uri,
          headers: headers,
          body: jsonEncode({
            'prompt': prompt,
            'image_base64': base64Encode(imageBytes),
            'mime_type': mimeType,
          }),
        )
        .timeout(const Duration(minutes: 2));

    Map<String, dynamic>? body;
    try {
      final decoded = jsonDecode(response.body);
      if (decoded is Map<String, dynamic>) {
        body = decoded;
      }
    } catch (_) {
      // Handled below as a malformed response.
    }

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw PhotoEditorApiException(
        body?['error']?.toString() ??
            'The proxy returned HTTP ${response.statusCode}.',
      );
    }

    final outputBase64 = body?['image_base64'];
    final outputMimeType = body?['mime_type'];

    if (outputBase64 is! String || outputBase64.isEmpty) {
      throw const PhotoEditorApiException(
        'The proxy returned an invalid image response.',
      );
    }

    try {
      return EditResult(
        bytes: base64Decode(outputBase64),
        mimeType: outputMimeType is String && outputMimeType.isNotEmpty
            ? outputMimeType
            : 'image/png',
      );
    } on FormatException {
      throw const PhotoEditorApiException(
        'The proxy returned invalid image data.',
      );
    }
  }
}

class PhotoEditorApiException implements Exception {
  const PhotoEditorApiException(this.message);

  final String message;

  @override
  String toString() => message;
}
