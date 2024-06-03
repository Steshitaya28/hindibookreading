from flask import Flask, request, send_file, jsonify, render_template
from gtts import gTTS
import os
import tempfile

app = Flask(_name_)

@app.route('/')
def load_hindi_book():
    return render_template('hindi_book.html')

@app.route('/convert_text_to_speech', methods=['POST'])
def convert_text_to_speech():
    data = request.json
    text = data.get('text')
    if not text:
        return jsonify({'error': 'No text provided'}), 400

    try:
        tts = gTTS(text=text, lang='hi')
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.mp3')
        tts.save(temp_file.name)
        return send_file(temp_file.name, as_attachment=True)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
