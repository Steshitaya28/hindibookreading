document.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('loading').style.display = 'block';

  const pdfUrl = '/static/hindi_book.pdf'; // Pre-uploaded Hindi book
  const pdfData = await fetch(pdfUrl).then(res => res.arrayBuffer());

  const loadingTask = pdfjsLib.getDocument({ data: pdfData });
  const pdf = await loadingTask.promise;
  let extractedText = '';

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 2.0 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({ canvasContext: context, viewport: viewport }).promise;
      const imageData = canvas.toDataURL('image/png');

      const result = await Tesseract.recognize(imageData, 'hin', {
          logger: (m) => console.log(m),
      });
      extractedText += result.data.text + '\n';
  }

  const response = await fetch('/convert_text_to_speech', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text: extractedText })
  });

  if (response.ok) {
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audioElement = document.getElementById('audio');
      audioElement.src = audioUrl;

      audioElement.addEventListener('canplaythrough', () => {
          audioElement.play(); // Play the audio automatically when it's ready
          document.getElementById('loading').style.display = 'none';
      });

      // Toggle play/pause on screen click or key press
      const toggleAudio = () => {
          if (audioElement.paused) {
              audioElement.play();
          } else {
              audioElement.pause();
          }
      };

      // For mobile devices, 'click' event is used to toggle audio
      document.addEventListener('click', toggleAudio);

      // For laptops/desktops, 'keydown' event with 'Space' key is used to toggle audio
      document.addEventListener('keydown', (event) => {
          if (event.code === 'Space') {
              event.preventDefault(); // Prevent default spacebar behavior (scrolling)
              toggleAudio();
          }
      });

  } else {
      const errorText = await response.text();
      alert('Failed to convert text to speech. ' + errorText);
      document.getElementById('loading').style.display = 'none';
  }
});
