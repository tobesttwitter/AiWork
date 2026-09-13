import 'dart:typed_data';

import 'package:cross_file/cross_file.dart';
import 'package:flutter/material.dart';
import 'package:gal/gal.dart';
import 'package:image_picker/image_picker.dart';
import 'package:share_plus/share_plus.dart';

import '../api.dart';
import '../config.dart';

class EditorScreen extends StatefulWidget {
  const EditorScreen({super.key});

  @override
  State<EditorScreen> createState() => _EditorScreenState();
}

class _EditorScreenState extends State<EditorScreen> {
  final _picker = ImagePicker();
  final _promptController = TextEditingController();

  Uint8List? _originalBytes;
  Uint8List? _editedBytes;
  String _inputMimeType = 'image/jpeg';
  String _outputMimeType = 'image/png';
  bool _isEditing = false;

  Uint8List? get _previewBytes => _editedBytes ?? _originalBytes;

  @override
  void dispose() {
    _promptController.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    final file = await _picker.pickImage(source: ImageSource.gallery);
    if (file == null) return;

    try {
      final bytes = await file.readAsBytes();
      final mimeType = _mimeTypeForPath(file.path);

      if (!mounted) return;
      setState(() {
        _originalBytes = bytes;
        _editedBytes = null;
        _inputMimeType = mimeType;
        _outputMimeType = 'image/png';
      });
    } catch (error) {
      _showError('Could not read the selected image: $error');
    }
  }

  Future<void> _editImage() async {
    final bytes = _originalBytes;
    final prompt = _promptController.text.trim();

    if (bytes == null) {
      _showError('Select a photo first.');
      return;
    }
    if (prompt.isEmpty) {
      _showError('Describe the edit you want.');
      return;
    }

    setState(() => _isEditing = true);

    try {
      final api = PhotoEditorApi(
        baseUrl: AppConfig.proxyUrl,
        bearerToken: AppConfig.bearerToken,
      );

      final result = await api.edit(
        prompt: prompt,
        imageBytes: bytes,
        mimeType: _inputMimeType,
      );

      if (!mounted) return;
      setState(() {
        _editedBytes = result.bytes;
        _outputMimeType = result.mimeType;
      });
    } catch (error) {
      if (mounted) {
        _showError(error.toString());
      }
    } finally {
      if (mounted) {
        setState(() => _isEditing = false);
      }
    }
  }

  Future<void> _saveImage() async {
    final bytes = _editedBytes;
    if (bytes == null) {
      _showError('Edit an image before saving.');
      return;
    }

    try {
      await Gal.putImageBytes(bytes, name: 'ai_photo_edit');
      if (mounted) {
        _showMessage('Saved to your gallery.');
      }
    } catch (error) {
      _showError('Could not save the image: $error');
    }
  }

  Future<void> _shareImage(BuildContext context) async {
    final bytes = _editedBytes;
    if (bytes == null) {
      _showError('Edit an image before sharing.');
      return;
    }

    try {
      final extension = _outputMimeType == 'image/jpeg' ? 'jpg' : 'png';
      final result = await SharePlus.instance.share(
        ShareParams(
          files: [
            XFile.fromData(
              bytes,
              mimeType: _outputMimeType,
              name: 'ai_photo_edit.$extension',
            ),
          ],
          fileNameOverrides: ['ai_photo_edit.$extension'],
          sharePositionOrigin: _shareOrigin(context),
        ),
      );

      if (!mounted || result.status != ShareResultStatus.success) return;
    } catch (error) {
      _showError('Could not share the image: $error');
    }
  }

  Rect _shareOrigin(BuildContext context) {
    final box = context.findRenderObject() as RenderBox?;
    if (box == null) return const Rect.fromLTWH(0, 0, 1, 1);
    return box.localToGlobal(Offset.zero) & box.size;
  }

  String _mimeTypeForPath(String path) {
    final lower = path.toLowerCase();
    if (lower.endsWith('.png')) return 'image/png';
    if (lower.endsWith('.webp')) return 'image/webp';
    return 'image/jpeg';
  }

  void _showMessage(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(message)));
  }

  void _showError(String message) {
    _showMessage(message.replaceFirst('Exception: ', ''));
  }

  @override
  Widget build(BuildContext context) {
    final hasImage = _previewBytes != null;
    final hasEdit = _editedBytes != null;

    return Scaffold(
      appBar: AppBar(title: const Text('AI Photo Editor')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            AspectRatio(
              aspectRatio: 1,
              child: DecoratedBox(
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.surfaceContainerHighest,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(20),
                  child: hasImage
                      ? Image.memory(_previewBytes!, fit: BoxFit.contain)
                      : const Center(
                          child: Text('Select a photo to begin'),
                        ),
                ),
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _promptController,
              minLines: 2,
              maxLines: 5,
              textInputAction: TextInputAction.newline,
              decoration: const InputDecoration(
                labelText: 'Describe the edit',
                hintText: 'e.g. Remove the background and add a sunset sky',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 16),
            FilledButton.icon(
              onPressed: _isEditing ? null : _pickImage,
              icon: const Icon(Icons.photo_library_outlined),
              label: const Text('Select Photo'),
            ),
            const SizedBox(height: 10),
            FilledButton.icon(
              onPressed: _isEditing ? null : _editImage,
              icon: _isEditing
                  ? const SizedBox.square(
                      dimension: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.auto_awesome),
              label: Text(_isEditing ? 'Editing…' : 'Edit'),
            ),
            const SizedBox(height: 10),
            OutlinedButton.icon(
              onPressed: hasEdit && !_isEditing ? _saveImage : null,
              icon: const Icon(Icons.download_outlined),
              label: const Text('Save'),
            ),
            const SizedBox(height: 10),
            OutlinedButton.icon(
              onPressed: hasEdit && !_isEditing
                  ? () => _shareImage(context)
                  : null,
              icon: const Icon(Icons.share_outlined),
              label: const Text('Share'),
            ),
          ],
        ),
      ),
    );
  }
}
