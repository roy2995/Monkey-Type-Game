const INITIAL_TIME = 60;
    let words = [];
    let currentTime = INITIAL_TIME;
    let playing = false;
    let intervalId = null;

    const $time = document.querySelector('time');
    const $paragraph = document.querySelector('p');
    const $input = document.querySelector('input');
    const $game = document.querySelector('#game');
    const $results = document.querySelector('#results');
    const $wpm = document.querySelector('#results-wpm');
    const $accuracy = document.querySelector('#results-accuracy');
    const $button = document.querySelector('#reload-button');

    async function fetchWords() {
      try {
        const response = await fetch('https://baconipsum.com/api/?type=meat-and-filler&sentences=5');
        const data = await response.json();
        return data[0].split(' ').slice(0, 50);
      } catch (error) {
        console.error('Error fetching words:', error);
        return ["default", "words", "to", "use", "in", "case", "of", "error"];
      }
    }

    async function initGame() {
      $game.style.display = 'flex';
      $results.style.display = 'none';
      $input.value = '';

      playing = false;
      currentTime = INITIAL_TIME;
      $time.textContent = currentTime;

      words = await fetchWords();
      $paragraph.innerHTML = words.map(word => {
        return `<word>${[...word].map(letter => `<letter>${letter}</letter>`).join('')}</word>`;
      }).join('');

      const $firstWord = $paragraph.querySelector('word');
      $firstWord.classList.add('active');
      $firstWord.querySelector('letter').classList.add('active');
    }

    function initEvents() {
      document.addEventListener('keydown', handleKeyDownStart);
      $input.addEventListener('keydown', handleInputKeyDown);
      $input.addEventListener('keyup', handleInputKeyUp);
      $button.addEventListener('click', initGame);
    }

    function handleKeyDownStart() {
      $input.focus();
      if (!playing) {
        playing = true;
        intervalId = setInterval(() => {
          currentTime--;
          $time.textContent = currentTime;
          if (currentTime === 0) {
            clearInterval(intervalId);
            gameOver();
          }
        }, 1000);
      }
    }

    function handleInputKeyDown(event) {
      const $currentWord = $paragraph.querySelector('word.active');
      const $currentLetter = $currentWord.querySelector('letter.active');

      if (event.key === ' ') {
        event.preventDefault();
        handleSpace($currentWord, $currentLetter);
        return;
      }

      if (event.key === 'Backspace') {
        handleBackspace($currentWord, $currentLetter);
        return;
      }
    }

    function handleSpace($currentWord, $currentLetter) {
      const $nextWord = $currentWord.nextElementSibling;
      const $nextLetter = $nextWord.querySelector('letter');

      $currentWord.classList.remove('active', 'marked');
      $currentLetter.classList.remove('active');

      $nextWord.classList.add('active');
      $nextLetter.classList.add('active');

      $input.value = '';

      const hasMissedLetters = $currentWord.querySelectorAll('letter:not(.correct)').length > 0;
      $currentWord.classList.add(hasMissedLetters ? 'marked' : 'correct');
    }

    function handleBackspace($currentWord, $currentLetter) {
      const $prevWord = $currentWord.previousElementSibling;
      const $prevLetter = $currentLetter.previousElementSibling;

      if (!$prevWord && !$prevLetter) {
        return;
      }

      const $wordMarked = $paragraph.querySelector('word.marked');
      if ($wordMarked && !$prevLetter) {
        $prevWord.classList.remove('marked');
        $prevWord.classList.add('active');
        $prevWord.querySelector('letter:last-child').classList.add('active');
        $currentLetter.classList.remove('active');
        $input.value = Array.from($prevWord.querySelectorAll('letter.correct, letter.incorrect'))
                            .map($el => $el.classList.contains('correct') ? $el.innerText : '*')
                            .join('');
      }
    }

    function handleInputKeyUp() {
      const $currentWord = $paragraph.querySelector('word.active');
      const $currentLetter = $currentWord.querySelector('letter.active');
      const currentWordText = $currentWord.innerText.trim();
      $input.maxLength = currentWordText.length;

      const $allLetters = $currentWord.querySelectorAll('letter');
      $allLetters.forEach($letter => $letter.classList.remove('correct', 'incorrect'));

      const inputText = $input.value.split('');
      inputText.forEach((char, index) => {
        const $letter = $allLetters[index];
        const isCorrect = char === currentWordText[index];
        $letter.classList.add(isCorrect ? 'correct' : 'incorrect');
      });

      $currentLetter.classList.remove('active', 'is-last');
      const $nextActiveLetter = $allLetters[$input.value.length];
      if ($nextActiveLetter) {
        $nextActiveLetter.classList.add('active');
      } else {
        $currentLetter.classList.add('active', 'is-last');
      }
    }

    function gameOver() {
      $game.style.display = 'none';
      $results.style.display = 'flex';

      const correctWords = $paragraph.querySelectorAll('word.correct').length;
      const correctLetters = $paragraph.querySelectorAll('letter.correct').length;
      const incorrectLetters = $paragraph.querySelectorAll('letter.incorrect').length;
      const totalLetters = correctLetters + incorrectLetters;

      const accuracy = totalLetters > 0 ? (correctLetters / totalLetters) * 100 : 0;
      const wpm = (correctWords * 60) / INITIAL_TIME;

      $wpm.textContent = wpm.toFixed(2);
      $accuracy.textContent = `${accuracy.toFixed(2)}%`;

      document.removeEventListener('keydown', handleKeyDownStart);
      $input.removeEventListener('keydown', handleInputKeyDown);
      $input.removeEventListener('keyup', handleInputKeyUp);
      $button.removeEventListener('click', initGame);
    }

    initGame();
    initEvents();